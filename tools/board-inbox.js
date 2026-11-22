#!/usr/bin/env node
/* Reggie's post round, step one: list the unread messages waiting in the private tray.
   The tray is inbox.json in the private repo williamgeorgeworks/post-room, cloned next to this repo
   (so ../post-room/inbox.json); set BOARD_INBOX to read it from somewhere else.
   Usage: node tools/board-inbox.js
   Prints a JSON list of {id, t, name, msg} for every message not yet in board.json's "done" list. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const inboxPath = process.env.BOARD_INBOX || path.join(root, "..", "post-room", "inbox.json");
if (!fs.existsSync(path.dirname(inboxPath))) {
  console.error("The post room is not here: attach and clone williamgeorgeworks/post-room next to this repo, or set BOARD_INBOX.");
  process.exit(2);
}
const read = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
const inbox = read(inboxPath) || { items: [] };
const board = read(path.join(root, "board.json")) || { done: [] };
const done = new Set(board.done || []);
const out = (inbox.items || []).filter(it => it && it.id && !done.has(it.id))
  .map(it => ({ id: it.id, t: it.t, name: it.name, msg: it.msg }));
console.log(JSON.stringify(out, null, 1));
