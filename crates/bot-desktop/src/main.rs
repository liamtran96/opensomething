#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn send_message(message: &str) -> String {
    bot_core::echo_reply(message)
}

fn main() -> tauri::Result<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_message])
        .run(tauri::generate_context!())
}
