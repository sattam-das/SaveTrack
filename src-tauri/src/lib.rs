use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn get_data_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("store.json");
    Ok(path)
}

#[tauri::command]
fn read_data(app: AppHandle) -> Result<String, String> {
    let path = get_data_file_path(&app)?;
    if !path.exists() {
        return Ok(r#"{"entries":[],"targets":{"weekly":0,"monthly":0},"goals":[]}"#.to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_data(app: AppHandle, content: String) -> Result<(), String> {
    let path = get_data_file_path(&app)?;
    fs::write(path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
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
    .invoke_handler(tauri::generate_handler![read_data, write_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
