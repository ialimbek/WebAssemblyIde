use notify::{
    event::ModifyKind, Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};
use serde::Serialize;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
    time::{Duration, Instant, SystemTime},
};
use tauri::Emitter;

#[derive(Default)]
struct DesktopWorkspaceState {
    root: Mutex<Option<PathBuf>>,
    allowed_files: Mutex<HashSet<PathBuf>>,
    watcher: Mutex<Option<RecommendedWatcher>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceInfo {
    root: String,
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileReadResultDto {
    path: String,
    name: String,
    content: String,
    encoding: String,
    size: u64,
    modified_at: u64,
    from_cache: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceEntryDto {
    path: String,
    name: String,
    is_directory: bool,
    size: u64,
    modified_at: u64,
    extension: Option<String>,
    children: Option<Vec<WorkspaceEntryDto>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopFileChangeDto {
    kind: String,
    paths: Vec<String>,
    timestamp: u64,
}

#[tauri::command]
fn desktop_pick_directory() -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .pick_folder()
        .map(|path| path_to_frontend(&path)))
}

#[tauri::command]
fn desktop_pick_file(
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<Option<FileReadResultDto>, String> {
    let Some(path) = rfd::FileDialog::new().pick_file() else {
        return Ok(None);
    };

    // canonicalize may fail on Windows; fallback to the raw picked path.
    // Also strip the \\?\ verbatim prefix so paths match the frontend format.
    let path = strip_verbatim_prefix(path.canonicalize().unwrap_or(path));

    remember_allowed_file(&state, &path)?;
    read_file_result(&path).map(Some)
}

#[tauri::command]
fn desktop_pick_save_file(
    suggested_name: Option<String>,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<Option<String>, String> {
    let mut dialog = rfd::FileDialog::new();
    if let Some(name) = suggested_name.filter(|name| !name.trim().is_empty()) {
        dialog = dialog.set_file_name(name);
    }

    let Some(path) = dialog.save_file() else {
        return Ok(None);
    };

    remember_allowed_file(&state, &path)?;
    Ok(Some(path_to_frontend(&path)))
}

#[tauri::command]
fn desktop_open_workspace(
    root: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<WorkspaceInfo, String> {
    let root_path = PathBuf::from(&root);

    // Verify the path exists and is a directory before canonicalizing.
    // canonicalize can fail on Windows for perfectly valid directories.
    let metadata = fs::metadata(&root_path)
        .map_err(|err| format!("Workspace root does not exist '{}': {}", root, err))?;
    if !metadata.is_dir() {
        return Err(format!("Workspace root is not a directory: {}", root));
    }

    let canonical = root_path
        .canonicalize()
        .unwrap_or_else(|_| root_path.clone());
    // Windows canonicalize() returns \\?\ verbatim paths. Strip the prefix so
    // that the stored root is consistent with paths coming from the frontend
    // (which also strip \\?\ via path_to_frontend). Without this, starts_with
    // comparisons in resolve_allowed_path always fail on Windows.
    let canonical = strip_verbatim_prefix(canonical);

    {
        let mut guard = state
            .root
            .lock()
            .map_err(|_| "Workspace state is poisoned".to_string())?;
        *guard = Some(canonical.clone());
    }
    state
        .allowed_files
        .lock()
        .map_err(|_| "Allowed file state is poisoned".to_string())?
        .clear();

    start_workspace_watcher(&state, &app, &canonical)?;

    Ok(WorkspaceInfo {
        root: path_to_frontend(&canonical),
        name: path_name(&canonical),
    })
}

#[tauri::command]
fn desktop_read_file(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<FileReadResultDto, String> {
    let path = resolve_allowed_path(&state, &path, false)?;
    read_file_result(&path)
}

#[tauri::command]
fn desktop_write_file(
    path: String,
    content: String,
    create_dirs: Option<bool>,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<(), String> {
    let path = resolve_allowed_path(&state, &path, true)?;

    if let Some(parent) = path.parent() {
        if create_dirs.unwrap_or(false) {
            fs::create_dir_all(parent)
                .map_err(|err| format!("Failed to create parent directories: {err}"))?;
        } else if !parent.exists() {
            return Err(format!(
                "Parent directory does not exist: {}",
                path_to_frontend(parent)
            ));
        }
    }

    fs::write(&path, content).map_err(|err| format!("Failed to write file: {err}"))
}

#[tauri::command]
fn desktop_delete_path(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<(), String> {
    let path = resolve_allowed_path(&state, &path, false)?;
    ensure_not_workspace_root(&state, &path)?;

    let metadata = fs::metadata(&path).map_err(|err| format!("Path not found: {err}"))?;
    if metadata.is_dir() {
        fs::remove_dir_all(&path).map_err(|err| format!("Failed to delete directory: {err}"))
    } else {
        fs::remove_file(&path).map_err(|err| format!("Failed to delete file: {err}"))
    }
}

#[tauri::command]
fn desktop_rename_path(
    old_path: String,
    new_path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<(), String> {
    let old_path = resolve_allowed_path(&state, &old_path, false)?;
    ensure_not_workspace_root(&state, &old_path)?;

    let new_path = resolve_allowed_path(&state, &new_path, true)?;
    if let Some(parent) = new_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to create target parent directory: {err}"))?;
    }

    fs::rename(&old_path, &new_path).map_err(|err| format!("Failed to rename path: {err}"))
}

#[tauri::command]
fn desktop_create_directory(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<(), String> {
    let path = resolve_allowed_path(&state, &path, true)?;
    fs::create_dir_all(&path).map_err(|err| format!("Failed to create directory: {err}"))
}

#[tauri::command]
fn desktop_exists(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<bool, String> {
    let path = resolve_allowed_path(&state, &path, true)?;
    Ok(path.exists())
}

#[tauri::command]
fn desktop_is_directory(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<bool, String> {
    let path = resolve_allowed_path(&state, &path, false)?;
    Ok(path.is_dir())
}

#[tauri::command]
fn desktop_stat(
    path: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<WorkspaceEntryDto, String> {
    let path = resolve_allowed_path(&state, &path, false)?;
    stat_entry(&path, None)
}

#[tauri::command]
fn desktop_list_directory(
    path: String,
    max_depth: Option<usize>,
    include_hidden: Option<bool>,
    limit: Option<usize>,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<Vec<WorkspaceEntryDto>, String> {
    let path = resolve_allowed_path(&state, &path, false)?;
    let max_depth = max_depth.unwrap_or(1);
    let include_hidden = include_hidden.unwrap_or(false);
    let limit = limit.unwrap_or(5_000);
    let mut visited = 0usize;

    list_directory_entries(&path, max_depth, include_hidden, limit, &mut visited)
}

fn read_file_result(path: &Path) -> Result<FileReadResultDto, String> {
    let metadata = fs::metadata(path).map_err(|err| format!("Failed to inspect file: {err}"))?;
    if metadata.is_dir() {
        return Err("Cannot read a directory as a file".to_string());
    }

    // Read raw bytes first, then convert to string lossily to handle various encodings
    let bytes = fs::read(path).map_err(|err| format!("Failed to read file: {err}"))?;
    let content = String::from_utf8(bytes)
        .unwrap_or_else(|e| String::from_utf8_lossy(e.as_bytes()).into_owned());

    Ok(FileReadResultDto {
        path: path_to_frontend(path),
        name: path_name(path),
        content,
        encoding: "utf-8".to_string(),
        size: metadata.len(),
        modified_at: modified_at_ms(&metadata),
        from_cache: false,
    })
}

fn list_directory_entries(
    path: &Path,
    depth: usize,
    include_hidden: bool,
    limit: usize,
    visited: &mut usize,
) -> Result<Vec<WorkspaceEntryDto>, String> {
    if *visited >= limit {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(path)
        .map_err(|err| format!("Failed to read directory {}: {err}", path_to_frontend(path)))?;

    for dir_entry in read_dir {
        if *visited >= limit {
            break;
        }

        let dir_entry =
            dir_entry.map_err(|err| format!("Failed to read directory entry: {err}"))?;
        let entry_path = dir_entry.path();
        let name = dir_entry.file_name().to_string_lossy().to_string();

        if !include_hidden && name.starts_with('.') {
            continue;
        }

        let metadata = dir_entry
            .metadata()
            .map_err(|err| format!("Failed to inspect {name}: {err}"))?;
        let is_directory = metadata.is_dir();
        if is_directory && is_ignored_directory_name(&name) {
            continue;
        }
        *visited += 1;

        let children = if is_directory && depth > 0 {
            Some(list_directory_entries(
                &entry_path,
                depth.saturating_sub(1),
                include_hidden,
                limit,
                visited,
            )?)
        } else {
            None
        };

        entries.push(stat_entry(&entry_path, Some((metadata, children)))?);
    }

    entries.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

fn stat_entry(
    path: &Path,
    known: Option<(fs::Metadata, Option<Vec<WorkspaceEntryDto>>)>,
) -> Result<WorkspaceEntryDto, String> {
    let (metadata, children) = match known {
        Some(value) => value,
        None => (
            fs::metadata(path).map_err(|err| format!("Path not found: {err}"))?,
            None,
        ),
    };

    let is_directory = metadata.is_dir();
    Ok(WorkspaceEntryDto {
        path: path_to_frontend(path),
        name: path_name(path),
        is_directory,
        size: if is_directory { 0 } else { metadata.len() },
        modified_at: modified_at_ms(&metadata),
        extension: if is_directory {
            None
        } else {
            path.extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext.to_string())
        },
        children,
    })
}

fn resolve_allowed_path(
    state: &DesktopWorkspaceState,
    raw_path: &str,
    allow_missing: bool,
) -> Result<PathBuf, String> {
    let root = state
        .root
        .lock()
        .map_err(|_| "Workspace state is poisoned".to_string())?
        .clone();

    let input = PathBuf::from(raw_path);
    let candidate = match &root {
        Some(root) if !input.is_absolute() => root.join(input),
        _ => input,
    };
    let candidate = normalize_lexically(candidate);

    if let Some(root) = root {
        let root = normalize_lexically(root);
        if candidate.starts_with(&root) {
            return Ok(candidate);
        }

        if is_allowed_single_file(state, &candidate, allow_missing)? {
            return Ok(candidate);
        }

        return Err(format!(
            "Access denied: path is outside the active workspace ({})",
            path_to_frontend(&root)
        ));
    }

    Ok(candidate)
}

fn remember_allowed_file(state: &DesktopWorkspaceState, path: &Path) -> Result<(), String> {
    state
        .allowed_files
        .lock()
        .map_err(|_| "Allowed file state is poisoned".to_string())?
        .insert(normalize_lexically(path.to_path_buf()));
    Ok(())
}

fn start_workspace_watcher(
    state: &DesktopWorkspaceState,
    app: &tauri::AppHandle,
    root: &Path,
) -> Result<(), String> {
    let app_handle = app.clone();
    let root_for_filter = normalize_lexically(root.to_path_buf());
    let cooldown: std::sync::Arc<Mutex<HashMap<String, Instant>>> =
        std::sync::Arc::new(Mutex::new(HashMap::new()));
    let debounce_ms = Duration::from_millis(300);

    let mut watcher = RecommendedWatcher::new(
        move |event_result: notify::Result<Event>| {
            let Ok(event) = event_result else {
                return;
            };

            let paths: Vec<String> = event
                .paths
                .iter()
                .map(|path| normalize_lexically(path.to_path_buf()))
                .filter(|path| path.starts_with(&root_for_filter))
                .filter(|path| !path_has_ignored_component(path))
                .map(|path| path_to_frontend(&path))
                .collect();

            if paths.is_empty() {
                return;
            }

            let now = Instant::now();
            let mut guard = match cooldown.lock() {
                Ok(g) => g,
                Err(_) => return,
            };

            let deduped: Vec<String> = paths
                .into_iter()
                .filter(|p| {
                    if let Some(last) = guard.get(p) {
                        if now.duration_since(*last) < debounce_ms {
                            return false;
                        }
                    }
                    guard.insert(p.clone(), now);
                    true
                })
                .collect();

            guard.retain(|_, t| now.duration_since(*t) < debounce_ms);

            if deduped.is_empty() {
                return;
            }

            let payload = DesktopFileChangeDto {
                kind: event_kind_to_frontend(&event.kind).to_string(),
                paths: deduped,
                timestamp: now_ms(),
            };

            let _ = app_handle.emit("desktop://fs-event", payload);
        },
        Config::default(),
    )
    .map_err(|err| format!("Failed to create workspace watcher: {err}"))?;

    watcher
        .watch(root, RecursiveMode::Recursive)
        .map_err(|err| format!("Failed to watch workspace: {err}"))?;

    let mut guard = state
        .watcher
        .lock()
        .map_err(|_| "Workspace watcher state is poisoned".to_string())?;
    *guard = Some(watcher);
    Ok(())
}

fn event_kind_to_frontend(kind: &EventKind) -> &'static str {
    match kind {
        EventKind::Create(_) => "created",
        EventKind::Remove(_) => "deleted",
        EventKind::Modify(ModifyKind::Name(_)) => "renamed",
        EventKind::Modify(_) => "modified",
        _ => "modified",
    }
}

fn path_has_ignored_component(path: &Path) -> bool {
    path.components().any(|component| {
        component
            .as_os_str()
            .to_str()
            .map(is_ignored_directory_name)
            .unwrap_or(false)
    })
}

fn is_ignored_directory_name(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | "node_modules"
            | "target"
            | "dist"
            | "build"
            | ".next"
            | ".turbo"
            | "coverage"
            | "out"
            | ".venv"
            | "venv"
    )
}

fn is_allowed_single_file(
    state: &DesktopWorkspaceState,
    path: &Path,
    allow_missing: bool,
) -> Result<bool, String> {
    let normalized = normalize_lexically(path.to_path_buf());
    let comparable = if normalized.exists() {
        normalized
            .canonicalize()
            .unwrap_or_else(|_| normalized.clone())
    } else if allow_missing {
        normalized.clone()
    } else {
        return Ok(false);
    };

    let allowed_files = state
        .allowed_files
        .lock()
        .map_err(|_| "Allowed file state is poisoned".to_string())?;

    Ok(allowed_files.contains(&normalized) || allowed_files.contains(&comparable))
}

fn ensure_not_workspace_root(state: &DesktopWorkspaceState, path: &Path) -> Result<(), String> {
    let root = state
        .root
        .lock()
        .map_err(|_| "Workspace state is poisoned".to_string())?
        .clone();

    if let Some(root) = root {
        if normalize_lexically(root) == normalize_lexically(path.to_path_buf()) {
            return Err("Refusing to modify/delete the active workspace root".to_string());
        }
    }

    Ok(())
}

fn normalize_lexically(path: PathBuf) -> PathBuf {
    let mut normalized = PathBuf::new();

    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::Normal(value) => normalized.push(value),
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
        }
    }

    normalized
}

fn path_to_frontend(path: &Path) -> String {
    let s = path.to_string_lossy().replace('\\', "/");
    // Remove Windows UNC prefix (\\?\) for cleaner frontend paths
    if s.starts_with("//?/") {
        s[4..].to_string()
    } else {
        s
    }
}

/// Strip the Windows verbatim/UNC prefix (\\?\) from a path so that
/// the stored path is consistent with paths returned by `path_to_frontend`.
/// On non-Windows or paths without the prefix this is a no-op.
fn strip_verbatim_prefix(path: PathBuf) -> PathBuf {
    // Use into_owned() so `s` doesn't borrow `path`, letting us return `path`
    // in the else branch without a borrow-checker conflict.
    let s = path.to_string_lossy().into_owned();
    if s.starts_with(r"\\?\") {
        PathBuf::from(&s[4..])
    } else {
        path
    }
}

fn path_name(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path_to_frontend(path))
}

fn modified_at_ms(metadata: &fs::Metadata) -> u64 {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(SystemTime::UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DesktopWorkspaceState::default())
        .invoke_handler(tauri::generate_handler![
            desktop_pick_directory,
            desktop_pick_file,
            desktop_pick_save_file,
            desktop_open_workspace,
            desktop_read_file,
            desktop_write_file,
            desktop_delete_path,
            desktop_rename_path,
            desktop_create_directory,
            desktop_exists,
            desktop_is_directory,
            desktop_stat,
            desktop_list_directory,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.emit("tauri://close-requested", ());
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Auto-update plugin — endpoint configured in tauri.conf.json.
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

            // System tray icon with "Show / Hide / Quit" menu.
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
            use tauri::Manager;

            let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("primary-tray")
                .menu(&menu)
                .tooltip("WebAssemblyIde")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.close();
                        } else {
                            app.exit(0);
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
