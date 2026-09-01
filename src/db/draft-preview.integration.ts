import assert from "node:assert/strict";

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";
const PATH_ID = "javascript-interview-core";
const FIRST_LESSON_ID = "js-runtime-values-types";
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
    catalogHtml.includes("JavaScript Interview Core"),
    "development tree 目錄缺少 draft 卡片",
  );
  assert.ok(catalogHtml.includes("DRAFT 試走"), "draft 卡片缺少狀態標記");
  assert.ok(
    catalogHtml.includes(`/tree/${PATH_ID}?${PREVIEW_QUERY}`),
    "draft 卡片連結未攜帶 preview scope",
  );

  const hiddenTree = await get(`/tree/${PATH_ID}`, cookie);
  assert.equal(hiddenTree.status, 404, "draft tree 不得由一般 URL 公開");

  const previewTree = await get(
    `/tree/${PATH_ID}?${PREVIEW_QUERY}`,
    cookie,
  );
  assert.equal(previewTree.status, 200);
  const treeHtml = await previewTree.text();
  assert.ok(
    treeHtml.includes("JavaScript Interview Core"),
    "preview tree 缺少路徑標題",
  );
  assert.ok(treeHtml.includes("Draft 試走模式"), "preview tree 缺少模式提示");
  assert.ok(treeHtml.includes(FIRST_LESSON_ID), "preview tree 缺少第一個節點");
  assert.ok(treeHtml.includes(PREVIEW_QUERY), "preview tree 未保留 preview scope");

  const hiddenLesson = await get(`/lesson/${FIRST_LESSON_ID}`, cookie);
  assert.equal(hiddenLesson.status, 404, "draft lesson 不得由一般 URL 公開");

  const previewLesson = await get(
    `/lesson/${FIRST_LESSON_ID}?${PREVIEW_QUERY}`,
    cookie,
  );
  assert.equal(previewLesson.status, 200);
  const lessonHtml = await previewLesson.text();
  assert.ok(
    lessonHtml.includes("JavaScript runtime、值與型別"),
    "preview lesson 缺少課程標題",
  );
  assert.ok(
    lessonHtml.includes("Draft 試走模式"),
    "preview lesson 缺少模式提示",
  );
  assert.ok(lessonHtml.includes(PREVIEW_QUERY), "lesson 未保留 preview scope");

  const hiddenAnswer = await post(
    `/api/lesson/${FIRST_LESSON_ID}/answer`,
    cookie,
    {},
  );
  assert.equal(hiddenAnswer.status, 404, "draft API 不得由一般 URL 存取");

  const previewAnswer = await post(
    `/api/lesson/${FIRST_LESSON_ID}/answer?${PREVIEW_QUERY}`,
    cookie,
    {},
  );
  assert.equal(
    previewAnswer.status,
    400,
    "preview API 應通過 draft guard，並停在尚無作答 session 的驗證",
  );

  console.log("draft preview development integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
