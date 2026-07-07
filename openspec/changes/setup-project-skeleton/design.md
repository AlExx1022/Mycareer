# Design: setup-project-skeleton

## Context

全新 codebase，無既有程式碼。readme.md 已定案技術棧：Next.js (App Router) + TS + Tailwind、Postgres + Drizzle、Vercel 單一服務。本 change 只立地基，不做任何產品功能。

## Goals / Non-Goals

**Goals**

- 公開網址可註冊、登入、登出，看到空白首頁。
- DB 連線與 migration 流程可用，後續 change 直接加 table。
- demo 帳號基礎機制：一個固定帳號，可一鍵登入（C6 才打磨體驗與預灌資料）。

**Non-Goals**

- 任何產品功能（技能樹、課程、LLM）。
- Email 驗證、忘記密碼、OAuth——MVP 用不到。
- demo 帳號的預灌資料與限次（屬 C6）。

## Decisions

1. **認證用 Better Auth**（而非 Auth.js/NextAuth）：TS-first、email+password 開箱即用、官方 Drizzle adapter。NextAuth v5 對 credentials 登入態度消極，硬走會逆風。
2. **Postgres 用 Neon**（Vercel Marketplace 整合）：serverless、免費層夠用、與 Vercel 環境變數整合順。本地開發直連 Neon dev branch，不裝本地 Postgres。
3. **Migration 用 drizzle-kit**：`drizzle-kit generate` + `migrate`，schema 即 source of truth。
4. **demo 帳號 = seed script 建立的固定使用者**：登入頁放「Demo 登入」按鈕，用固定憑證走一般登入流程——不做特殊 session 邏輯，C6 要加限制時再說。

## Risks / Trade-offs

- [Better Auth 相對年輕] → 功能面只用 email+password 核心，被坑面積小；真不行換 Auth.js 只影響 auth 層。
- [本地開發依賴雲端 DB] → Neon dev branch 隔離正式資料；離線開發不支援，接受。

## Migration Plan

全新專案，無遷移。部署即上線：Vercel 連 GitHub repo，main 自動部署。

## Open Questions

（無——選型均已定案。）
