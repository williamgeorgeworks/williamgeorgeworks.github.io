#!/usr/bin/env bash
# Build Seen Off desktop: Windows (cross from Linux via cargo-xwin, NSIS installer) then Linux (deb + AppImage).
set -uo pipefail
export PATH="$HOME/.cargo/bin:$PATH"
export APPIMAGE_EXTRACT_AND_RUN=1   # linuxdeploy is itself an AppImage; no FUSE on build boxes
cd "$(dirname "$0")"
echo "=== Windows x64 (cargo-xwin + NSIS) ==="
npx tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis; W=$?
echo "=== Linux x64 (deb + AppImage) ==="
NO_STRIP=true npx tauri build --bundles deb,appimage; L=$?
echo "windows_exit=$W linux_exit=$L"
