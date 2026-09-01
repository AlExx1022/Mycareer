import assert from "node:assert/strict";
import {
  draftPreviewPathFromUrl,
  resolveDraftPreviewPath,
  withDraftPreview,
} from "./draft-preview";

assert.equal(
  resolveDraftPreviewPath(
    "javascript-interview-core",
    undefined,
    "development",
  ),
  "javascript-interview-core",
);
assert.equal(
  resolveDraftPreviewPath(
    "javascript-interview-core",
    "javascript-interview-core",
    "development",
  ),
  "javascript-interview-core",
);
assert.equal(
  resolveDraftPreviewPath(
    "javascript-interview-core",
    "react-junior-mid",
    "development",
  ),
  null,
);
assert.equal(
  resolveDraftPreviewPath("unknown-draft", undefined, "development"),
  null,
);
assert.equal(
  resolveDraftPreviewPath(
    ["javascript-interview-core"],
    undefined,
    "development",
  ),
  null,
);
assert.equal(
  withDraftPreview("/lesson/example", "javascript-interview-core"),
  "/lesson/example?preview=javascript-interview-core",
);
assert.equal(
  withDraftPreview("/lesson/example?source=tree", "javascript-interview-core"),
  "/lesson/example?source=tree&preview=javascript-interview-core",
);
assert.equal(
  resolveDraftPreviewPath(
    "javascript-interview-core",
    undefined,
    "production",
  ),
  null,
);

// URL parser follows the process environment; the test runner is non-production.
assert.equal(
  draftPreviewPathFromUrl(
    "http://localhost/lesson/example?preview=javascript-interview-core",
  ),
  "javascript-interview-core",
);

console.log("draft preview selfcheck OK");
