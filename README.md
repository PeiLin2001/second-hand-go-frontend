# 二手Go｜Campus Second-Hand Trading Platform

> A campus-focused second-hand marketplace that helps university students buy, sell, and discover items within their own school community — built by a 5-person full-stack team.

**Live Demo:** https://peilin2001.github.io/second-hand-go-frontend/#/home

---

## Overview

二手Go is a campus-focused second-hand marketplace for university students in Taiwan. It allows verified students to browse products, list second-hand items, post wishlist requests, chat with sellers, and coordinate transactions through purchase requests, order status tracking, and private chat.

The platform is designed around campus life rather than general public trading. It uses `.edu.tw` school-email verification, school-specific community spaces ("校版"), campus-based meetup locations, and student credibility scores to help students discover relevant listings and connect with trusted buyers or sellers from the same school.

---

## Demo

You can browse the website without logging in.  
To try member-only features, please use one of the following demo accounts:

| Username | Email | Password |
|---|---|---|
| 王小阿明 | U10337005@o365.mcut.edu.tw | asd123456 |
| 李吉娃娃 | 123456@nthu.gapp.edu.tw | MitochondrionIsThePowerPlantOfBody1234 |

These accounts are provided for testing purposes only.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular, TypeScript, RxJS, SCSS |
| Backend | Java, Spring Boot, RESTful API |
| Real-time Communication | Socket.IO / Netty-SocketIO |
| Database | MySQL |
| Auth | JWT, School-email verification (`.edu.tw`) |
| Image Storage | Cloudinary |
| File Handling | Base64 image upload, Spring Resource Handler |
| Third-party UI Libraries | ngx-slider, Lucide Icons, SweetAlert2, Google Material Fonts & Icons |
| Tools | Git, GitHub, Postman, Sourcetree |

### External Data & APIs

- **Taiwan Ministry of Education Open Data** — university and department information, used to validate school affiliation and populate department/school filters
- **Taiwan geographic/map data** — used for location-based matching (meetup areas, "nearby users" filtering)
- **Lucide Icons** — icon system integrated across the UI

---

## Key Features

_(Full platform feature set, built collaboratively by the 5-person team — see [My Contributions](#my-contributions) below for what I personally built.)_

### Authentication & Onboarding

- Registration restricted to `.edu.tw` school email domains, with automatic school detection from the email
- Email verification flow; unverified accounts are auto-purged after 7 days to keep data clean
- Password policy enforcement (min. 8 characters, alphanumeric)
- Guest browsing supported for select pages to lower the barrier to first-time use

### Product Discovery

- Category browsing via sidebar navigation, department-group filtering, and a "Recommended for You" homepage section
- Full-text search across product name, category, and user-defined tags — not limited to exact title matches
- Compound filtering (price range, condition, seller rating, meetup location) combined with sorting (price, newest, credit score)
- URL-driven filter state: filter conditions are serialized into query parameters, so filtered views are shareable via link and persist across page refreshes

### Product Details & Transactions

- Full product detail view including photos, applicable department/grade, meetup location, and condition
- Three primary actions: **Favorite**, **Chat with seller**, and **Send purchase request**
- Seller credibility shown via public credit score
- In-context reporting system (e.g., price manipulation, relisting) with required fields to prevent misuse

### Real-time Chat

- Socket.io-based in-app chat for buyer–seller coordination (meetup time, location, payment)
- New message notifications so users don't miss a reply

### Order Flow

- Purchase request → seller acceptance → status transitions from "Requesting" to "In Progress"
- Mutual "Complete Transaction" confirmation unlocks two-way rating, which feeds into a backend-calculated credit score
- Dispute reporting available directly from the order page (e.g., malicious cancellation, fraud, harassment)

### School Community ("校版")

- Each university has a dedicated space with its own product listings, member directory, and wishlist board
- Visibility rules based on the logged-in user's school — some content (e.g., school-only wishlist posts) is restricted to verified students of that school
- Designed to preserve in-group context (shared references, campus-specific slang) that public listings can't capture

### Wishlist ("許願池")

- Users can publicly post items they're looking for instead of only searching passively
- Other users can initiate a chat directly from a wishlist post
- Auto-expires after 14 days; capped at 3 active posts per user to prevent spam

### Personal Store & Product Management

- Public seller storefront preview
- Full product lifecycle management: create, edit, save as draft, delist/relist
- Custom tag creation during listing
- Preview step before publishing to confirm listing accuracy

### Seller Discovery ("尋找同學")

- Search by name, department, region, or user ID
- Filter by credit score threshold or "same-location" (geolocation-based, matches users active in the current area)
- Sort by recommended, same-location priority, credit score, or recency

### Favorites

- Saved product list with multi-select and batch removal

### Admin Backend

- Report review and moderation workflow for flagged listings and transaction disputes

---

## My Contributions

As Project Lead, I owned the frontend architecture and led the following end-to-end:

- **Homepage & entire sidebar navigation module** — layout, frontend logic, backend integration, and mock data generation for all sub-features (category browsing, department-group filter, school search/navigation, wishlist/seller entry points)
- **Favorites page** — layout and integration
- **Chat room page** — layout and integration (UI only; real-time messaging logic was built by a teammate via Socket.io)

### Design System & UX Details

- Defined the platform's overall visual direction and built the SCSS design token system (color palette, font convention, radius) used across the app
- Designed small UX details aimed at reducing friction, including:
  - A contextual call-to-action for guest (not-logged-in) users
  - A "back" button in the chat room for easier navigation
  - A persistent "scroll to top" button on every page
  - A "usage guide" entry point in the sidebar that smooth-scrolls to the tutorial section on the homepage, rather than navigating to a separate page
- Supported team members in UI/UX design and refined their frontend layout implementations.

### Architecture Highlights

- **State management** — Shared filter/sort logic centralized in dedicated Angular services (single source of truth) rather than duplicated per component; page-specific behavior (e.g., school community skipping category filters) handled via method override instead of branching logic
- **URL-driven state** — `combineLatest` on route `paramMap` + `queryParamMap` keeps filter state in sync with the URL, enabling shareable/bookmarkable filtered views
- **Search UX** — RxJS `Subject` + `debounceTime` + `distinctUntilChanged` for debounced, non-blocking search input
- **Responsive design** — Fluid typography via `clamp()` and breakpoint-based layout mixins for mobile/desktop consistency
- **Nested routing** — Multi-tab layouts (e.g., school community's product/members/wishlist tabs) implemented with Angular nested routes and `router-outlet`
- **API integration** — RESTful integration with the Spring Boot backend, including JWT-based auth, response mapping/normalization, and error handling; validated with Postman during development

### Leadership

- Requirement breakdown and task allocation across the 5-person team
- Coordinating frontend–backend integration and establishing shared development conventions
- Running usability tests with real users and iterating on search/listing flows based on feedback
- Code review process to maintain consistency and stability across the codebase

---

## Roadmap

- [ ] AI-powered price recommendation for sellers during listing
- [ ] AI-powered product recommendation on the homepage
- [ ] AI-powered listing content review to detect and prevent policy-violating listings

---

## Team & Responsibilities

This project was developed as a capstone project in a full-stack training program by a 5-member team.

| Area | Responsibilities |
|---|---|
| Project Lead / Frontend Architecture / UI/UX | Overall planning, visual direction, frontend architecture, homepage and sidebar modules, favorites page, chat room UI, debugging, and API integration |
| Backend / Admin / Database | Admin backend, database design, backend APIs, and backend environment setup |
| Core Features / Integration | Version control, frontend-backend integration, debugging, authentication, reports, chat, product listing, and order-related features |
| Frontend Features | Registration, account settings, and product detail page |
| Listing / Presentation Support | Product listing page layout support and presentation materials |

# 二手Go｜校園二手交易平台

> 二手Go 是一個以校園生活為核心的二手交易平台，讓大學生能在所屬學校的社群中刊登、尋找與交易二手物品。本專案由 5 人全端開發團隊共同完成。

**線上展示：**
https://peilin2001.github.io/second-hand-go-frontend/#/home

---

## 專案簡介

二手Go 是一個專為台灣大學生設計的校園二手交易平台。

完成學生身分驗證後，使用者可以瀏覽與刊登二手商品、發布徵求物品的許願貼文、收藏感興趣的商品，並透過購買請求、訂單狀態追蹤及站內聊天功能與其他使用者協調交易。

相較於一般公開型二手交易平台，二手Go 更著重於校園生活情境。平台透過 `.edu.tw` 學校信箱驗證、各校專屬的「校版」社群、校園面交地點及使用者信用評分機制，協助學生找到與自身需求相關的商品，並提高同校學生之間交易的便利性與信任感。

---

## Demo 展示

網站內容可在未登入的情況下瀏覽。

如需體驗會員限定功能，可使用以下測試帳號：

| 使用者名稱 | Email                                                           | 密碼                                     |
| ----- | --------------------------------------------------------------- | -------------------------------------- |
| 王小阿明  | [U10337005@o365.mcut.edu.tw](mailto:U10337005@o365.mcut.edu.tw) | asd123456                              |
| 李吉娃娃  | [123456@nthu.gapp.edu.tw](mailto:123456@nthu.gapp.edu.tw)       | MitochondrionIsThePowerPlantOfBody1234 |

以上帳號僅供專案功能測試使用。

---

## 技術架構

| 類別       | 使用技術                                                              |
| -------- | ----------------------------------------------------------------- |
| 前端       | Angular、TypeScript、RxJS、SCSS                                      |
| 後端       | Java、Spring Boot、RESTful API                                      |
| 即時通訊     | Socket.IO、Netty-SocketIO                                          |
| 資料庫      | MySQL                                                             |
| 身分驗證     | JWT、`.edu.tw` 學校信箱驗證                                              |
| 圖片儲存     | Cloudinary                                                        |
| 檔案處理     | Base64 圖片上傳、Spring Resource Handler                               |
| UI 與前端套件 | ngx-slider、Lucide Icons、SweetAlert2、Google Material Fonts & Icons |
| 開發工具     | Git、GitHub、Postman、Sourcetree                                     |

### 外部資料與 API

* **教育部開放資料**
  取得台灣大專院校及科系資訊，用於判斷使用者所屬學校，並建立學校與科系篩選選項。

* **台灣地理與地圖資料**
  用於面交地點設定及「附近的人」等地區篩選功能。

* **Lucide Icons**
  作為平台主要的前端圖示系統，維持整體視覺風格一致。

---

## 主要功能

> 以下為 5 人團隊共同完成的平台功能，個人實際負責內容請參考「個人貢獻」章節。

### 註冊與登入

* 僅開放使用 `.edu.tw` 學校信箱註冊，並根據信箱網域判斷使用者所屬學校。
* 提供 Email 驗證流程，未在 7 天內完成驗證的帳號將由系統自動清除，避免保留無效資料。
* 密碼須至少包含 8 個字元，並同時包含英文與數字。
* 部分頁面開放訪客瀏覽，降低首次使用者的進入門檻。

### 商品瀏覽與搜尋

* 提供商品分類、適用科系及首頁推薦商品等多種瀏覽方式。
* 支援關鍵字搜尋，可比對商品名稱、分類及使用者自訂標籤，不限於完全符合商品標題。
* 支援價格範圍、商品狀況、賣家評分及面交地點等複合篩選條件。
* 可依價格、刊登時間或信用分數進行排序。
* 將篩選條件同步至 URL 查詢參數，使搜尋結果可透過網址分享或加入書籤，重新整理頁面後也能保留原有條件。

### 商品詳情與交易

* 商品詳情頁呈現商品照片、適用科系與年級、面交地點及商品狀況等資訊。
* 使用者可收藏商品、與賣家聊天或送出購買請求。
* 顯示賣家信用分數，提供買家評估交易對象的參考依據。
* 提供情境式檢舉功能，例如價格異常或重複刊登，並要求填寫必要資訊，以降低檢舉功能被濫用的可能性。

### 即時聊天

* 透過 Socket.IO 建立站內即時聊天功能，讓買賣雙方能討論面交時間、地點及付款方式。
* 提供新訊息提醒，降低使用者錯過訊息的情況。

### 訂單與交易流程

* 買家送出購買請求後，賣家可選擇接受或拒絕。
* 賣家接受請求後，訂單狀態會由「交易請求中」更新為「進行中」。
* 交易雙方皆確認完成後，系統才會開放互評功能。
* 評分結果會納入使用者信用分數的計算。
* 使用者可直接從訂單頁面提出交易爭議，例如惡意取消、詐騙或騷擾。

### 校版社群

* 每所學校皆設有專屬校版，包含商品列表、成員名錄及許願池。
* 系統會根據登入使用者的學校設定內容瀏覽權限。
* 部分校內限定內容，僅開放給該校已完成驗證的學生查看。
* 透過學校專屬的社群空間，讓使用者能在熟悉的校園情境中交流與交易。

### 許願池

* 使用者可以發布正在尋找的物品，不必只能被動等待商品上架。
* 其他使用者可從許願貼文直接發起聊天。
* 貼文會在發布 14 天後自動失效。
* 每位使用者最多可同時發布 3 則有效許願貼文，避免重複刊登或大量洗版。

### 個人賣場與商品管理

* 提供公開的個人賣場頁面，集中展示賣家目前刊登的商品。
* 支援新增、編輯、儲存草稿、下架及重新上架等完整商品管理流程。
* 刊登商品時可自行建立標籤，增加商品被搜尋到的機會。
* 商品正式發布前提供預覽畫面，讓使用者再次確認內容。

### 尋找同學

* 可依姓名、科系、地區或使用者 ID 搜尋平台成員。
* 支援依信用分數及所在地區進行篩選 ( 使用 Geolocation API 進行 GPS 定位 )。
* 可依推薦程度、同地區優先、信用分數或加入時間排序。

### 收藏管理

* 集中顯示使用者收藏的商品。
* 支援多選商品及批次取消收藏。

### 後台管理

* 提供商品與使用者檢舉案件的審核功能。
* 提供交易爭議案件的管理及處理流程。

---

## 個人貢獻

我作為專案領導人，除參與需求規劃與團隊協作外，也負責多項前端功能、介面設計及 API 串接工作。：
- **首頁與整個側邊欄導覽模組** — 所有子功能的功能設計、UIUX、切版、前端邏輯、後端串接以及模擬資料建置。（包含首頁、導覽、商品的分類瀏覽與篩選、尋找同學、許願池與校版）
- **收藏頁面** — 功能設計、UIUX與切版
- **聊天室頁面** — UIUX與切版

### 設計系統與使用者體驗

* 制定平台整體視覺方向，並建立全站共用的 SCSS 設計變數系統（色彩配置、字體規範、圓角規則、共用UI等）
* 設計多項降低操作障礙的 UIUX 細節，包括：

  * 針對未登入訪客顯示相對應的操作提示與登入引導（CTA）。
  * 在聊天室中加入「返回」按鈕，改善頁面之間的導覽體驗。
  * 在各頁面加入固定顯示的「回到頂部」按鈕。
  * 在側邊欄加入「使用說明」入口，點擊後會平滑捲動至首頁教學區域。
* 協助團隊成員改善 UI／UX 設計，並提供版面調整與前端實作建議。

### 前端架構與技術實作

* **共用狀態管理**
  將商品篩選及排序邏輯集中於 Angular Service 中管理，作為共用的單一資料來源，避免不同元件重複撰寫相同邏輯。針對不同頁面的特殊需求，則透過方法覆寫調整行為，減少元件內過多的條件判斷。

* **URL 與篩選狀態同步**
  使用 RxJS 的 `combineLatest` 整合 Angular Router 的 `paramMap` 與 `queryParamMap`，讓頁面篩選條件與網址保持同步，使用者可直接分享或收藏特定的搜尋結果頁面。

* **搜尋輸入最佳化**
  使用 RxJS 的 `Subject`、`debounceTime` 與 `distinctUntilChanged` 處理搜尋輸入，在使用者停止輸入後才送出查詢，減少不必要的搜尋請求。

* **響應式網頁設計**
  透過 clamp() 建立可隨畫面調整的字體大小，並以斷點式版面確保行動裝置與桌面版體驗一致

* **巢狀路由**
  校版中的商品、成員及許願池等分頁，使用 Angular 巢狀路由與 `router-outlet` 建立共用版面與子頁面切換機制。

* **API 串接與資料處理**
  與 Spring Boot 後端進行 RESTful API 串接，處理回傳資料格式轉換、資料標準化及錯誤處理，並使用 Postman 協助驗證 API。

### 團隊協作與專案管理

* 進行需求分析、功能拆解及 5 人團隊的工作分配。
* 協調前後端開發進度與 API 串接內容。
* 建立團隊共用的開發規範，統一命名方式及程式碼撰寫原則。
* 邀請實際使用者進行操作測試，並根據回饋調整搜尋與商品刊登流程。
* 進行 Code Review，維持程式碼風格的一致性及專案穩定性。

---

## 未來規劃

* [ ] 加入 AI 商品定價建議，協助賣家設定合理價格。
* [ ] 建立首頁個人化商品推薦功能。
* [ ] 加入 AI 刊登內容審核，偵測可能違規或不適合上架的商品。

---

## 團隊成員與分工

本專案為全端開發培訓課程的畢業專題，由 5 位成員共同規劃與開發。

| 分工角色             | 負責內容                                               |
| ---------------- | -------------------------------------------------- |
| 專案領導人／前端架構／UI／UX | 專案整體規劃、視覺設計、首頁與側邊欄模組、收藏頁面、聊天室畫面、問題排查、開源資源評估與引用及 API 串接 |
| 後端／後台管理／資料庫      | 後台管理系統、資料庫設計、後端 API 開發及後端環境建置                      |
| 核心功能與系統整合        | 版本控制、前後端整合、身分驗證、檢舉、聊天、商品刊登及訂單功能                    |
| 前端功能開發           | 註冊流程、帳號設定及商品詳情頁                                    |
| 商品刊登／簡報支援        | 商品刊登頁面開發支援及專案簡報製作                                |

