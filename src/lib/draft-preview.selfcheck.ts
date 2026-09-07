import assert from "node:assert/strict";
import {
  draftPreviewPathFromUrl,
  resolveDraftPreviewPath,
  withDraftPreview,
} from "./draft-preview";

assert.equal(
  resolveDraftPreviewPath(
    "python-interview-core",
    undefined,
    "development",
  ),
  null,
);
assert.equal(
  resolveDraftPreviewPath(
    "python-interview-core",
    "python-interview-core",
    "development",
  ),
  null,
);
assert.equal(
  resolveDraftPreviewPath(
    "python-interview-core",
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
    ["python-interview-core"],
    undefined,
    "development",
  ),
  null,
);
assert.equal(
  withDraftPreview("/lesson/example", "python-interview-core"),
  "/lesson/example?preview=python-interview-core",
);
assert.equal(
  withDraftPreview("/lesson/example?source=tree", "python-interview-core"),
  "/lesson/example?source=tree&preview=python-interview-core",
);
assert.equal(
  resolveDraftPreviewPath(
    "python-interview-core",
    undefined,
    "production",
  ),
  null,
);

// URL parser follows the process environment; the test runner is non-production.
assert.equal(
  draftPreviewPathFromUrl(
    "http://localhost/lesson/example?preview=python-interview-core",
  ),
  null,
);

console.log("draft preview selfcheck OK");
