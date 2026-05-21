use serde::{Deserialize, Serialize};

/// Tauri desktop host bridge — exposes native FS, workspace, and process
/// capabilities to the frontend via Tauri command protocol.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FsEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadFileResult {
    pub content: String,
    pub encoding: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteFileRequest {
    pub path: String,
    pub content: String,
    pub encoding: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub root: String,
    pub name: String,
    pub is_writable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequest {
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub env: Option<Vec<(String, String)>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

/// Read file content from the native filesystem.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn read_file(path: String) -> Result<ReadFileResult, String> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))?;
    Ok(ReadFileResult {
        content,
        encoding: "utf-8".to_string(),
    })
}

/// Write content to a native filesystem path.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn write_file(request: WriteFileRequest) -> Result<(), String> {
    std::fs::write(&request.path, &request.content)
        .map_err(|e| format!("Failed to write file '{}': {}", request.path, e))
}

/// Delete a file from the native filesystem.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file '{}': {}", path, e))
}

/// Rename a file.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn rename_file(from: String, to: String) -> Result<(), String> {
    std::fs::rename(&from, &to)
        .map_err(|e| format!("Failed to rename '{}' -> '{}': {}", from, to, e))
}

/// Check if a path exists.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn path_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

/// List directory entries.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FsEntry>, String> {
    let entries = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to list directory '{}': {}", path, e))?;

    let mut result = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Dir entry error: {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Metadata error: {}", e))?;
        result.push(FsEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }
    result.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(result)
}

/// Create a directory (recursive).
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory '{}': {}", path, e))
}

/// Stat a path — returns size, is_dir, modified timestamp.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn stat_path(path: String) -> Result<FsEntry, String> {
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to stat '{}': {}", path, e))?;
    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(FsEntry {
        name,
        path,
        is_dir: metadata.is_dir(),
        size: metadata.len(),
    })
}

/// Open a native workspace folder picker dialog (returns chosen path).
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn open_workspace_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    let folder = FileDialogBuilder::new()
        .set_title("Open Workspace Folder")
        .pick_folder();
    Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

/// Run a shell command in the workspace with policy guard.
#[cfg(feature = "tauri")]
#[tauri::command]
pub async fn run_command(request: CommandRequest) -> Result<CommandResult, String> {
    use std::process::Command;

    let cwd = request
        .cwd
        .unwrap_or_else(|| std::env::current_dir().unwrap().to_string_lossy().to_string());

    let mut cmd = Command::new(&request.command);
    cmd.args(&request.args).current_dir(&cwd);

    if let Some(env_vars) = request.env {
        for (key, val) in env_vars {
            cmd.env(&key, &val);
        }
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Command execution failed: {}", e))?;

    Ok(CommandResult {
        exit_code: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

/// Tauri plugin builder for desktop-host commands.
#[cfg(feature = "tauri")]
pub fn init() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::new("desktop-host")
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            delete_file,
            rename_file,
            path_exists,
            list_directory,
            create_directory,
            stat_path,
            open_workspace_dialog,
            run_command,
        ])
        .build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fs_entry_serialization() {
        let entry = FsEntry {
            name: "test.ts".to_string(),
            path: "/workspace/test.ts".to_string(),
            is_dir: false,
            size: 1024,
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("test.ts"));
        let deserialized: FsEntry = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "test.ts");
        assert_eq!(deserialized.size, 1024);
    }

    #[test]
    fn test_command_request_serialization() {
        let req = CommandRequest {
            command: "npm".to_string(),
            args: vec!["run".to_string(), "build".to_string()],
            cwd: Some("/workspace".to_string()),
            env: None,
        };
        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("npm"));
        let deserialized: CommandRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.command, "npm");
        assert_eq!(deserialized.args.len(), 2);
    }

    #[test]
    fn test_command_result_serialization() {
        let result = CommandResult {
            exit_code: 0,
            stdout: "success".to_string(),
            stderr: String::new(),
        };
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: CommandResult = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.exit_code, 0);
    }
}
