use serde::Serialize;
use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
    time::SystemTime,
};

#[derive(Default)]
struct DesktopWorkspaceState {
    root: Mutex<Option<PathBuf>>,
    allowed_files: Mutex<HashSet<PathBuf>>,
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

    let path = path
        .canonicalize()
        .map_err(|err| format!("Failed to resolve selected file: {err}"))?;

    remember_allowed_file(&state, &path)?;
    read_file_result(&path).map(Some)
}

#[tauri::command]
fn desktop_open_workspace(
    root: String,
    state: tauri::State<'_, DesktopWorkspaceState>,
) -> Result<WorkspaceInfo, String> {
    let root_path = PathBuf::from(root);
    let canonical = root_path
        .canonicalize()
        .map_err(|err| format!("Workspace root does not exist: {err}"))?;

    let metadata = fs::metadata(&canonical)
        .map_err(|err| format!("Failed to inspect workspace root: {err}"))?;
    if !metadata.is_dir() {
        return Err("Workspace root is not a directory".to_string());
    }

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

    let content = fs::read_to_string(path).map_err(|err| {
        format!("Failed to read file as UTF-8 text (binary files are not supported yet): {err}")
    })?;

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
    path.to_string_lossy().replace('\\', "/")
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DesktopWorkspaceState::default())
        .invoke_handler(tauri::generate_handler![
            desktop_pick_directory,
            desktop_pick_file,
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
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
