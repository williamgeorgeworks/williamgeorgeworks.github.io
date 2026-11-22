/* Quick check that the office feed sanitiser never leaks issue details. */
import { sanitise, OFFICE_BOTS } from "./office-feed.js";

const SECRET = "github_pat_EXAMPLESECRETLEAKTEST";
const TITLE = "Do not publish: password hunter2";
const FIXED = "2026-11-22T22:00:00.000Z";

const fake = [
  {
    id: 99,
    number: 99,
    title: TITLE,
    state: "open",
    body: "The token is " + SECRET + " and the url is https://github.com/williamgeorgeworks/quill-family-hq/issues/99",
    html_url: "https://github.com/williamgeorgeworks/quill-family-hq/issues/99",
    user: { login: "benharding75" },
    comments: 4,
    closed_at: null,
    labels: [{ name: "for-george" }, { name: "in-progress" }]
  },
  {
    number: 12,
    title: "A closed job that must not appear",
    state: "closed",
    body: SECRET,
    labels: [{ name: "for-percy" }],
    pull_request: undefined,
    user: { login: "someone" },
    comments: 2,
    closed_at: "2026-11-20T10:00:00Z"
  },
  {
    number: 3,
    title: "A pull request, not an issue",
    state: "open",
    body: SECRET,
    labels: [{ name: "for-archie" }],
    pull_request: { url: "https://api.github.com/repos/williamgeorgeworks/quill-family-hq/pulls/3" }
  },
  {
    number: 7,
    title: "Terry's private task",
    state: "open",
    body: SECRET,
    labels: ["for-terry"]
  },
  {
    number: 8,
    title: "Reggie's private task",
    state: "open",
    body: SECRET,
    labels: [{ name: "for-reggie" }]
  },
  {
    number: 10,
    title: "Percy is genuinely at it",
    state: "open",
    body: "secret body",
    labels: [{ name: "for-percy" }, { name: "for-boris" }]
  }
];

const out = sanitise(fake, FIXED);
const json = JSON.stringify(out);
let failed = 0;

function check(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  }
}

check(out.updated === FIXED, "updated is the supplied timestamp");
check(Object.keys(out).length === 2 && "updated" in out && "bots" in out, "top-level keys are only updated and bots");
check(Object.keys(out.bots).sort().join(",") === OFFICE_BOTS.slice().sort().join(","), "bots are exactly the eleven desks");
for (const [id, state] of Object.entries(out.bots)) {
  check(state === "working" || state === "idle", id + " is working or idle");
}
check(out.bots.george === "working", "open for-george issue marks george working");
check(out.bots.percy === "working", "open for-percy issue marks percy working");
check(out.bots.boris === "working", "open for-boris issue marks boris working");
check(out.bots.archie === "idle", "pull requests are ignored");
check(out.bots.kenneth === "idle", "bots with no open issue are idle");
check(!("terry" in out.bots) && !("reggie" in out.bots), "terry and reggie are not in the output");

const banned = [SECRET, TITLE, "hunter2", "quill-family-hq", "benharding75", "html_url", "password", "issues/99", "secret body", "comments", "closed_at", "for-george", "Terry", "Reggie"];
for (const s of banned) {
  check(!json.includes(s), "output must not contain " + JSON.stringify(s));
}

if (failed) {
  console.error(failed + " check(s) failed");
  console.error(json);
  process.exit(1);
}
console.log("ok — sanitiser returns only bot names and working/idle");
console.log(json);
