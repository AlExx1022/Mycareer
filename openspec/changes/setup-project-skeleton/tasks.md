# Tasks: setup-project-skeleton

## 1. 專案初始化

- [x] 1.1 `create-next-app`：Next.js (App Router) + TypeScript + Tailwind CSS
- [x] 1.2 建立 GitHub repo 並推上初始 commit

## 2. 資料庫

- [ ] 2.1 建立 Neon Postgres（Vercel Marketplace 整合），設定本地與 Vercel 的 `DATABASE_URL`
- [x] 2.2 安裝 Drizzle ORM + drizzle-kit，設定 `drizzle.config.ts` 與 migration scripts
- [ ] 2.3 跑一次空 migration 驗證 generate → migrate 流程可用

## 3. 認證

- [x] 3.1 安裝 Better Auth（email + password）+ Drizzle adapter，產生 auth 相關 table migration
- [x] 3.2 註冊頁與登入頁（含錯誤訊息：email 已存在、憑證錯誤）
- [x] 3.3 登出功能與未登入導向登入頁的 middleware 保護
- [x] 3.4 seed script 建立固定 demo 帳號，登入頁加「Demo 登入」按鈕

## 4. 首頁與部署

- [x] 4.1 登入後空白首頁：顯示登入狀態 + 登出入口
- [ ] 4.2 Vercel 連 GitHub repo，設定環境變數，main 自動部署
- [ ] 4.3 驗收：公開網址完整走一遍 註冊 → 登出 → 登入 → demo 登入
