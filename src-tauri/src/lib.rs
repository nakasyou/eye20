use tauri::{
    menu::{Menu, MenuItem}, tray::TrayIconBuilder, Emitter, Manager
};
use std::time::Duration;

#[derive(Clone, serde::Serialize)]
struct StartResting {}
fn show_window(window: &tauri::WebviewWindow) {
    if !window.is_visible().unwrap() {
        window.show().unwrap();
    }
    if !window.is_focused().unwrap() {
        window.set_focus().unwrap();
    }
    if window.is_minimized().unwrap() {
        window.unminimize().unwrap();
    }
    // fullscreen
    if !window.is_fullscreen().unwrap() {
        window.set_fullscreen(true).unwrap();
    }
    window.emit("start_resting", StartResting {}).unwrap();
}

#[tauri::command]
fn finish_resting(window: tauri::Window) {
    // minimize the window
    window.hide().unwrap();
}

const REST_INTERVAL: u64 = 20 * 60; // 20 minutes

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            // Set up the interval (Tokio→std::thread)
            std::thread::spawn(move || {
                loop {
                    show_window(&window);
                    std::thread::sleep(Duration::from_secs(20 + REST_INTERVAL));
                }
            });

            // Set up the system tray
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| {
                    if event.id() == "quit" {
                        app.exit(0);
                    }
                })
                .show_menu_on_left_click(true)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![finish_resting])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
