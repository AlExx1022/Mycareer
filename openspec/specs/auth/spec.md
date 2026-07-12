# auth Specification

## Purpose
TBD - created by archiving change setup-project-skeleton. Update Purpose after archive.
## Requirements
### Requirement: 註冊
系統 SHALL 允許訪客以 email + 密碼註冊帳號。

#### Scenario: 成功註冊
- **WHEN** 訪客提交有效 email 與密碼
- **THEN** 建立帳號並自動登入，導向首頁

#### Scenario: email 已存在
- **WHEN** 訪客以已註冊的 email 提交註冊
- **THEN** 顯示錯誤訊息，不建立帳號

### Requirement: 登入與登出
系統 SHALL 允許使用者以 email + 密碼登入，並可登出。

#### Scenario: 成功登入
- **WHEN** 使用者提交正確憑證
- **THEN** 建立 session 並導向首頁

#### Scenario: 憑證錯誤
- **WHEN** 使用者提交錯誤密碼
- **THEN** 顯示錯誤訊息，不建立 session

#### Scenario: 登出
- **WHEN** 已登入使用者點擊登出
- **THEN** session 失效並導向登入頁

### Requirement: 未登入導向
系統 SHALL 將未登入使用者導向登入頁，保護登入後頁面。

#### Scenario: 未登入訪問首頁
- **WHEN** 未登入訪客訪問首頁
- **THEN** 導向登入頁

### Requirement: Demo 帳號
系統 SHALL 提供一個由 seed script 建立的固定 demo 帳號，登入頁提供一鍵 demo 登入。

#### Scenario: 一鍵 demo 登入
- **WHEN** 訪客在登入頁點擊「Demo 登入」
- **THEN** 以 demo 帳號建立 session 並導向首頁

