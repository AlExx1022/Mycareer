import assert from "node:assert/strict";
import {
  readDraftPilotRecord,
  saveDraftPilotEntry,
  serializeDraftPilotRecord,
  type DraftPilotStorage,
} from "./draft-pilot-feedback";

const values = new Map<string, string>();
const storage: DraftPilotStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

assert.deepEqual(readDraftPilotRecord(storage, "javascript-interview-core"), {
  version: 1,
  pathId: "javascript-interview-core",
  entries: {},
});

const record = saveDraftPilotEntry(storage, "javascript-interview-core", {
  lessonId: "js-runtime-values-types",
  lessonTitle: "JavaScript runtime、值與型別",
  issues: ["too_shallow", "question_drift"],
  note: "缺少 host API 反例",
  reviewedAt: "2026-08-31T10:00:00.000Z",
});
assert.deepEqual(record.entries["js-runtime-values-types"].issues, [
  "too_shallow",
  "question_drift",
]);

const serialized = JSON.parse(
  serializeDraftPilotRecord(record, "2026-08-31T11:00:00.000Z"),
);
assert.equal(serialized.pathId, "javascript-interview-core");
assert.equal(serialized.exportedAt, "2026-08-31T11:00:00.000Z");
assert.equal(serialized.lessons.length, 1);
assert.equal(serialized.lessons[0].note, "缺少 host API 反例");

values.set(
  "mycareer:draft-pilot:v1:javascript-interview-core",
  "not-json",
);
assert.deepEqual(readDraftPilotRecord(storage, "javascript-interview-core"), {
  version: 1,
  pathId: "javascript-interview-core",
  entries: {},
});

console.log("draft pilot feedback selfcheck OK");
