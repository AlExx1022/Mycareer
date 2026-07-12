# project-foundation Specification

## Purpose
TBD - created by archiving change setup-project-skeleton. Update Purpose after archive.
## Requirements
### Requirement: 專案骨架
系統 SHALL 以 Next.js (App Router) + TypeScript + Tailwind CSS 建置，並可在本地以 `npm run dev` 啟動。

#### Scenario: 本地啟動
- **WHEN** 開發者執行 `npm run dev`
- **THEN** 應用在 localhost 啟動且首頁可存取

### Requirement: 資料庫連線與 migration
系統 SHALL 透過 Drizzle ORM 連線 Postgres，並提供 migration 流程（generate + migrate）。

#### Scenario: 執行 migration
- **WHEN** 開發者修改 Drizzle schema 並執行 migration 指令
- **THEN** 資料庫結構更新且應用可正常讀寫

### Requirement: 公開部署
系統 SHALL 部署於 Vercel，main 分支推送後自動部署至公開網址。

#### Scenario: 自動部署
- **WHEN** main 分支有新 commit
- **THEN** Vercel 自動建置並更新公開網址內容

### Requirement: 登入後首頁
系統 SHALL 在使用者登入後顯示首頁（後續技能樹地圖的掛載點）。

#### Scenario: 已登入訪問首頁
- **WHEN** 已登入使用者訪問首頁
- **THEN** 顯示登入狀態與登出入口的空白首頁

