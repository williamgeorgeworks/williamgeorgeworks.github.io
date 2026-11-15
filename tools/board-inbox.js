#!/usr/bin/env node
/* Reggie's post round, step one: decrypt the unread messages in board-inbox.json.
   Usage: BOARD_KEY_FILE=/tmp/board.pem node tools/board-inbox.js
   Prints a JSON list of {id, t, name, msg} for every message not yet in board.json's "done" list.
   The private key is never stored in the repository. */
const fs = require("fs"), crypto = require("crypto");
const root = __dirname + "/../";
const keyFile = process.env.BOARD_KEY_FILE;
if (!keyFile) { console.error("Set BOARD_KEY_FILE to the private key path."); process.exit(2); }
const priv = crypto.createPrivateKey(fs.readFileSync(keyFile, "utf8"));
const read = f => { try { return JSON.parse(fs.readFileSync(root + f, "utf8")); } catch (e) { return null; } };
const inbox = read("board-inbox.json") || { items: [] };
const board = read("board.json") || { done: [] };
const done = new Set(board.done || []);
const out = [];
for (const it of inbox.items || []) {
  if (done.has(it.id)) continue;
  try {
    const aesKey = crypto.privateDecrypt({ key: priv, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(it.k, "base64"));
    const ct = Buffer.from(it.ct, "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(it.iv, "base64"));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8");
    const p = JSON.parse(plain);
    out.push({ id: it.id, t: it.t, name: p.name, msg: p.msg });
  } catch (e) { out.push({ id: it.id, t: it.t, error: "could not decrypt" }); }
}
console.log(JSON.stringify(out, null, 1));
