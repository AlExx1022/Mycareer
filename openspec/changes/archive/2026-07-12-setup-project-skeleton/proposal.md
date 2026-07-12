# Proposal: setup-project-skeleton

## Why

一切後續 change（技能樹、學習循環、Sandpack）都需要一個可部署、可登入的專案地基。C0 先把骨架立起來，讓「公開網址可體驗」從第一天就成立。

## What Changes

- 建立 Next.js (App Router) + TypeScript + Tailwind CSS 專案。
- 接上 Postgres + Drizzle ORM（含 migration 流程）。
- 認證：註冊 / 登入 / 登出，並預留 demo 帳號機制的基礎（一個可程式化登入的固定帳號）。
- Vercel 部署管線：main 分支自動部署到公開網址。
- 空白首頁（登入後可見），作為後續技能樹地圖的掛載點。

## Capabilities

### New Capabilities

- `project-foundation`: 專案骨架——框架、資料庫連線與 migration、部署管線。
- `auth`: 使用者註冊、登入、登出，與 demo 帳號的基礎機制。

### Modified Capabilities

（無——這是第一個 change，尚無既有 spec。）

## Impact

- 全新 codebase，無既有程式碼受影響。
- 新增外部依賴：Vercel（部署 + Postgres）、認證函式庫。
- 後續所有 change（C1–C6）皆以此為依賴。
