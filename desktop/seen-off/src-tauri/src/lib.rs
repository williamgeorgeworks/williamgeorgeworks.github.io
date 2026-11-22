//! Seen Off desktop shell. The whole game is the offline web bundle in ../web;
//! this crate only opens a window on it.

/// Steamworks hook (not wired yet). web/achievements.js will call this via
/// `window.__TAURI__.core.invoke('steam_unlock', { id })` once Steam is integrated,
/// e.g. with the `steamworks` crate: client.user_stats().achievement(&id).set() then store_stats().
#[tauri::command]
fn steam_unlock(id: String) -> bool {
    eprintln!("[seen-off] achievement unlocked (Steam not wired yet): {id}");
    false
}

use tauri::Manager;

/// Steam sets SteamDeck=1 on the Deck and SteamGamepadUI in Big Picture / Game Mode.
/// SEEN_OFF_FULLSCREEN=1 forces it anywhere (handy as a Steam launch option).
fn want_fullscreen() -> bool {
    let on = |k: &str| std::env::var(k).map(|v| !v.is_empty() && v != "0").unwrap_or(false);
    on("SteamDeck") || on("SteamGamepadUI") || on("SEEN_OFF_FULLSCREEN")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if want_fullscreen() {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_fullscreen(true);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![steam_unlock])
        .run(tauri::generate_context!())
        .expect("error while running Seen Off");
}
