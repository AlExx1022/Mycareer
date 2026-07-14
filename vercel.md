# AI Gateway 使用方式

## 模型選擇

起手模型：`google/gemini-3-flash`

- 性價比最好：input $0.50 / output $3.00（每百萬 tokens），比 `openai/gpt-5.4-mini`（$0.75 / $4.50）便宜約 33%，比 flagship `openai/gpt-5.4`（$2.50 / $15）便宜 5 倍
- Context window 100 萬 tokens，支援 reasoning / vision / tool-use / web-search
- 教學對話這種強度綽綽有餘，開發期免費額度直接省到零成本

模型是字串常數，不寫死 provider。哪天要換（例如檢核 JSON 輸出不穩定，想測 `openai/gpt-5.4-mini`）改一行字串就好。

## 認證方式：OIDC，不申請外部 key

```bash
vercel link
vercel env pull .env.local   # 自動生成 VERCEL_OIDC_TOKEN（~24h 效期）
```

- 不用去 Google AI Studio 額外申請 key，AI SDK 直接讀 `VERCEL_OIDC_TOKEN` 打 Gateway
- 部署到 Vercel 上 token 自動 refresh，本機開發過期就重新 `vercel env pull --yes`
- 唯一需要「外部申請 key」的情境：BYOK（想用自己既有的 provider 額度/合約價）或非 Vercel 環境（CI）用 `AI_GATEWAY_API_KEY`——目前用不到

## 成本疑慮：Gateway 不會比較貴

- 官方保證 zero markup：token 價格跟直接找 provider 申請 key 打 API 完全一樣，包含 BYOK
- 每月有免費額度（開發期基本用不完），超過才照 provider 原價扣
- 真正的成本驅動是 Vercel Function 執行時間（等 LLM 回應那段），跟走不走 Gateway 無關——省錢重點是選便宜模型 + 串流回應別空等，不是迴避 Gateway

## 架構價值

- 用 Vercel AI SDK 走 AI Gateway，換 provider/模型只改一個字串常數
- 順便拿到用量觀測、per-model/per-tag 成本追蹤、fallback——是「demo 帳號成本防護」（C6）的現成基礎設施
- 面試時「模型可抽換」比「綁定某家 provider」好講

## 查即時價格

```bash
curl https://ai-gateway.vercel.sh/v1/models   # 不用認證
```
