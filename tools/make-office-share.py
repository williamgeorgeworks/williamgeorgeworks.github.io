#!/usr/bin/env python3
"""Build office-share.png, the 1200 by 630 picture used when the virtual office is shared.

The office itself is drawn in the browser, in code, so this script opens a local
copy of office.html?demo=share, reads the canvas, and frames it to the usual
Open Graph size. It is a snapshot: it will not update when the live feed changes.

From the repository root:

    python3 tools/make-office-share.py

Needs Google Chrome (or Chromium) and Pillow (Python's PIL). The posed layout
comes from the demo=share mode in office.js. After replacing the picture, bump
the cache-bust query strings on office.css / office.js only if those files also
changed; crawlers cache the image URL itself, so a new filename is the reliable
way to force a fresh preview.
"""
from __future__ import annotations

import base64
import http.server
import json
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "office-share.png"
CANVAS_TMP = Path("/tmp/office-share-canvas.png")

CHROME_CANDIDATES = [
    "/opt/google/chrome/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]
HOST_RULES = (
    "MAP arcade-scores.benharding75.workers.dev 127.0.0.1, "
    "MAP wgw-office-feed.benharding75.workers.dev 127.0.0.1, "
    "MAP wgw-office-feed.williamgeorgeworks.workers.dev 127.0.0.1"
)
FONT_ANTON = "/usr/share/fonts/truetype/sand-box/google/Anton/Anton-Regular.ttf"
FONT_HAND = "/usr/share/fonts/truetype/sand-box/google/Permanent Marker/PermanentMarker-Regular.ttf"
FONT_FALLBACK = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Card colours, matching the other William George Works Open Graph pictures.
INK = (20, 20, 20)
CREAM = (246, 242, 231)
RED = (209, 32, 47)
CARD = (255, 253, 247)


def find_chrome():
    env = os.environ.get("CHROME")
    if env and Path(env).exists():
        return env
    for path in CHROME_CANDIDATES:
        if Path(path).exists():
            return path
    raise SystemExit("Cannot find Google Chrome or Chromium. Set CHROME to the binary.")


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_server(port):
    os.chdir(ROOT)
    handler = http.server.SimpleHTTPRequestHandler

    class Quiet(handler):
        def log_message(self, fmt, *args):
            pass

    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), Quiet)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


# --- minimal WebSocket / CDP client (stdlib only) ---

def _read_headers(sock):
    data = b""
    while b"\r\n\r\n" not in data:
        chunk = sock.recv(4096)
        if not chunk:
            break
        data += chunk
    return data


def ws_connect(url):
    rest = url[len("ws://"):]
    hostport, _, path = rest.partition("/")
    path = "/" + path
    host, port = hostport.split(":")
    port = int(port)
    key = base64.b64encode(os.urandom(16)).decode()
    sock = socket.create_connection((host, port), timeout=30)
    sock.sendall(
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n".encode()
    )
    hdr = _read_headers(sock)
    if b"101" not in hdr.split(b"\r\n", 1)[0]:
        raise RuntimeError("WebSocket upgrade failed")
    sock.settimeout(30)
    return sock


def ws_send(sock, text):
    payload = text.encode()
    n = len(payload)
    hdr = bytes([0x81])
    if n < 126:
        hdr += bytes([0x80 | n])
    elif n < 65536:
        hdr += bytes([0x80 | 126]) + n.to_bytes(2, "big")
    else:
        hdr += bytes([0x80 | 127]) + n.to_bytes(8, "big")
    mask = os.urandom(4)
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    sock.sendall(hdr + mask + masked)


def ws_recv_frame(sock):
    hdr = b""
    while len(hdr) < 2:
        chunk = sock.recv(2 - len(hdr))
        if not chunk:
            raise RuntimeError("WebSocket closed")
        hdr += chunk
    length = hdr[1] & 0x7F
    masked = hdr[1] & 0x80
    if length == 126:
        ext = b""
        while len(ext) < 2:
            ext += sock.recv(2 - len(ext))
        length = int.from_bytes(ext, "big")
    elif length == 127:
        ext = b""
        while len(ext) < 8:
            ext += sock.recv(8 - len(ext))
        length = int.from_bytes(ext, "big")
    mask = b""
    if masked:
        while len(mask) < 4:
            mask += sock.recv(4 - len(mask))
    data = b""
    while len(data) < length:
        chunk = sock.recv(min(65536, length - len(data)))
        if not chunk:
            raise RuntimeError("WebSocket closed mid-frame")
        data += chunk
    if masked:
        data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
    return hdr[0] & 0x0F, data


def ws_recv_message(sock):
    parts = []
    while True:
        opcode, data = ws_recv_frame(sock)
        if opcode == 0x9:
            continue
        if opcode == 0x8:
            raise RuntimeError("WebSocket close")
        parts.append(data)
        return b"".join(parts).decode()


class CDP:
    def __init__(self, sock):
        self.sock = sock
        self.n = 0

    def call(self, method, **params):
        self.n += 1
        mid = self.n
        ws_send(self.sock, json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws_recv_message(self.sock))
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})


def wait_debug_port(port, tries=80):
    url = f"http://127.0.0.1:{port}/json/version"
    for _ in range(tries):
        try:
            urllib.request.urlopen(url, timeout=0.2)
            return
        except Exception:
            time.sleep(0.1)
    raise RuntimeError(f"Chrome debug port {port} did not come up")


def capture_canvas(http_port):
    from PIL import Image
    import io

    chrome = find_chrome()
    debug_port = free_port()
    udd = f"/tmp/office-share-chrome-{os.getpid()}"
    os.makedirs(udd, exist_ok=True)
    url = f"http://127.0.0.1:{http_port}/office.html?demo=share"
    # A 640-wide window keeps the canvas at 1x (see fitCanvas in office.js).
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--force-device-scale-factor=1",
        f"--host-resolver-rules={HOST_RULES}",
        f"--user-data-dir={udd}",
        f"--remote-debugging-port={debug_port}",
        "--remote-allow-origins=*",
        "--window-size=640,900",
        "about:blank",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_debug_port(debug_port)
        targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json/list"))
        page = next(t for t in targets if t.get("type") == "page")
        sock = ws_connect(page["webSocketDebuggerUrl"])
        cdp = CDP(sock)
        cdp.call("Emulation.setDeviceMetricsOverride", width=640, height=900, deviceScaleFactor=1, mobile=False)
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call("Page.navigate", url=url)
        deadline = time.time() + 10
        loaded = False
        sock.settimeout(0.3)
        while time.time() < deadline and not loaded:
            try:
                msg = json.loads(ws_recv_message(sock))
                if msg.get("method") == "Page.loadEventFired":
                    loaded = True
            except socket.timeout:
                pass
        sock.settimeout(30)
        # Let one or two animation frames land so monitors and steam look alive.
        time.sleep(1.2)
        expr = (
            "(function(){var c=document.getElementById('office-canvas');"
            "if(!c)return '';return c.toDataURL('image/png');})()"
        )
        ev = cdp.call("Runtime.evaluate", expression=expr, returnByValue=True)
        val = (ev.get("result") or {}).get("value") or ""
        if not val.startswith("data:image"):
            raise RuntimeError("Could not read the office canvas")
        raw = base64.b64decode(val.split(",", 1)[1])
        CANVAS_TMP.write_bytes(raw)
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        return im
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def font(path, size, fallback_size=None):
    from PIL import ImageFont
    for candidate in (path, FONT_FALLBACK):
        if candidate and Path(candidate).exists():
            try:
                return ImageFont.truetype(candidate, size)
            except Exception:
                continue
    return ImageFont.load_default()


def wrap_text(draw, text, font_obj, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font_obj) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def compose(office):
    from PIL import Image, ImageDraw

    W, H = 1200, 630
    BAR = 16
    card = Image.new("RGB", (W, H), INK)
    draw = ImageDraw.Draw(card)
    draw.rectangle((0, 0, W, BAR), fill=RED)
    draw.rectangle((0, H - BAR, W, H), fill=RED)

    # Office fills the height between the bars, integer-nearest, with a thin cream frame.
    inner_h = H - 2 * BAR
    # Leave a little air under/over the art so the frame is visible.
    art_size = 560
    office_sq = office.convert("RGB")
    if office_sq.size != (640, 640):
        office_sq = office_sq.resize((640, 640), Image.Resampling.NEAREST)
    art = office_sq.resize((art_size, art_size), Image.Resampling.NEAREST)
    frame = 4
    framed = Image.new("RGB", (art_size + frame * 2, art_size + frame * 2), CREAM)
    framed.paste(art, (frame, frame))
    art_x = W - framed.width - 36
    art_y = BAR + (inner_h - framed.height) // 2
    card.paste(framed, (art_x, art_y))

    title_font = font(FONT_ANTON, 64)
    sub_font = font(FONT_HAND, 28)
    tag_font = font(FONT_FALLBACK, 24)
    url_font = font(FONT_ANTON, 22)

    left = 48
    text_w = art_x - left - 28
    title_lines = wrap_text(draw, "THE OFFICE, LIVE", title_font, text_w)
    y = 140
    for line in title_lines:
        draw.text((left, y), line, font=title_font, fill=CREAM)
        y += 70
    y += 4
    sub_lines = wrap_text(draw, "William George Works", sub_font, text_w)
    for line in sub_lines:
        draw.text((left, y), line, font=sub_font, fill=RED)
        y += 36
    y += 18
    tag_lines = wrap_text(draw, "One human, two machines, six cats and a lot of bots.", tag_font, text_w)
    for line in tag_lines:
        draw.text((left, y), line, font=tag_font, fill=CREAM)
        y += 32

    draw.text((left, H - BAR - 52), "williamgeorgeworks.co.uk", font=url_font, fill=CREAM)
    return card


def main():
    try:
        from PIL import Image
    except ImportError:
        raise SystemExit("This needs Pillow: pip install Pillow")

    dest = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else OUT
    http_port = free_port()
    httpd = start_server(http_port)
    try:
        office = capture_canvas(http_port)
    finally:
        httpd.shutdown()
    if office.size[0] < 200 or office.size[1] < 200:
        raise SystemExit(f"Canvas capture looks wrong: {office.size}")
    card = compose(office)
    dest.parent.mkdir(parents=True, exist_ok=True)
    card.save(dest, "PNG", optimize=True)
    size = dest.stat().st_size
    print(f"Wrote {dest} ({card.size[0]}x{card.size[1]}, {size} bytes)")
    if size > 1000 * 1000:
        print("Warning: the file is over 1 MB; consider compressing it.", file=sys.stderr)


if __name__ == "__main__":
    main()
