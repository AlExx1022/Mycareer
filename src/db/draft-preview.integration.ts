import assert from "node:assert/strict";

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";
const PATH_ID = "python-interview-core";
const FIRST_LESSON_ID = "py-syntax-truthiness-control-flow";
const PREVIEW_QUERY = `preview=${PATH_ID}`;

async function signInCookie() {
  const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: process.env.BETTER_AUTH_URL ?? BASE_URL,
    },
    body: JSON.stringify({
      email: process.env.DEMO_EMAIL,
      password: process.env.DEMO_PASSWORD,
    }),
  });
  assert.equal(response.status, 200, `demo 登入失敗：${await response.text()}`);

  const setCookies = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  const cookie = setCookies
    .map((value) => value.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
  assert.ok(cookie, "登入回應沒有 session cookie");
  return cookie;
}

async function get(path: string, cookie: string) {
  return fetch(`${BASE_URL}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });
}

async function post(path: string, cookie: string, body: unknown) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

async function main() {
  const cookie = await signInCookie();

  const catalog = await get("/tree", cookie);
  assert.equal(catalog.status, 200);
  const catalogHtml = await catalog.text();
  assert.ok(
    catalogHtml.includes("Python Interview Core"),
    "development tree 目錄缺少 published 卡片",
  );
  assert.ok(
    !catalogHtml.includes("DRAFT 試走"),
    "published 目錄不得顯示 draft 標記",
  );
  assert.ok(
    catalogHtml.includes(`/tree/${PATH_ID}`),
    "published 卡片缺少正常路徑連結",
  );
  assert.ok(
    !catalogHtml.includes(`/tree/${PATH_ID}?${PREVIEW_QUERY}`),
    "published 卡片不得攜帶 preview scope",
  );

  const publishedTree = await get(`/tree/${PATH_ID}`, cookie);
  assert.equal(publishedTree.status, 200, "published tree 應可由一般 URL 存取");

  const previewTree = await get(
    `/tree/${PATH_ID}?${PREVIEW_QUERY}`,
    cookie,
  );
  assert.equal(previewTree.status, 200);
  const treeHtml = await previewTree.text();
  assert.ok(
    treeHtml.includes("Python Interview Core"),
    "stale-preview tree 缺少路徑標題",
  );
  assert.ok(
    !treeHtml.includes("Draft 試走模式"),
    "stale preview 不得將 published tree 標成 draft",
  );
  assert.ok(treeHtml.includes(FIRST_LESSON_ID), "published tree 缺少第一個節點");
  assert.ok(
    !treeHtml.includes(`/lesson/${FIRST_LESSON_ID}?${PREVIEW_QUERY}`),
    "stale preview 不得傳播到 tree 內部連結",
  );

  const publishedLesson = await get(`/lesson/${FIRST_LESSON_ID}`, cookie);
  assert.equal(
    publishedLesson.status,
    200,
    "published lesson 應可由一般 URL 存取",
  );

  const previewLesson = await get(
    `/lesson/${FIRST_LESSON_ID}?${PREVIEW_QUERY}`,
    cookie,
  );
  assert.equal(previewLesson.status, 200);
  const lessonHtml = await previewLesson.text();
  assert.ok(
    lessonHtml.includes("Python 語法、Truthiness 與控制流程"),
    "stale-preview lesson 缺少課程標題",
  );
  assert.ok(
    !lessonHtml.includes("Draft 試走模式"),
    "stale preview 不得將 published lesson 標成 draft",
  );
  assert.ok(
    !lessonHtml.includes(`/tree/${PATH_ID}?${PREVIEW_QUERY}`),
    "stale preview 不得傳播到 lesson 內部連結",
  );

  const publishedAnswer = await post(
    `/api/lesson/${FIRST_LESSON_ID}/answer`,
    cookie,
    {},
  );
  assert.equal(
    publishedAnswer.status,
    400,
    "published API 應通過路徑 guard，並停在尚無作答 session 的驗證",
  );

  const previewAnswer = await post(
    `/api/lesson/${FIRST_LESSON_ID}/answer?${PREVIEW_QUERY}`,
    cookie,
    {},
  );
  assert.equal(
    previewAnswer.status,
    publishedAnswer.status,
    "stale preview 不得改變 published API 的存取結果",
  );

  console.log("published path stale-preview integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
