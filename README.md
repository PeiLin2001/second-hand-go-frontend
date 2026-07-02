# 二手Go｜Campus Second-Hand Trading Platform

> A campus-focused second-hand marketplace that helps university students buy, sell, and discover items within their own school community — built by a 5-person full-stack team.

**Live Demo:** https://peilin2001.github.io/second-hand-go-frontend/#/home

---

## Overview

二手Go is a campus-focused second-hand marketplace for university students in Taiwan. It allows verified students to browse products, list second-hand items, post wishlist requests, chat with sellers, and coordinate transactions through purchase requests, order status tracking, and private chat.

The platform is designed around campus life rather than general public trading. It uses `.edu.tw` school-email verification, school-specific community spaces ("校版"), campus-based meetup locations, and student credibility scores to help students discover relevant listings and connect with trusted buyers or sellers from the same school.

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

### 🔐 Authentication & Onboarding

- Registration restricted to `.edu.tw` school email domains, with automatic school detection from the email
- Email verification flow; unverified accounts are auto-purged after 7 days to keep data clean
- Password policy enforcement (min. 8 characters, alphanumeric)
- Guest browsing supported for select pages to lower the barrier to first-time use

### 🛍️ Product Discovery

- Category browsing via sidebar navigation, department-group filtering, and a "Recommended for You" homepage section
- Full-text search across product name, category, and user-defined tags — not limited to exact title matches
- Compound filtering (price range, condition, seller rating, meetup location) combined with sorting (price, newest, credit score)
- URL-driven filter state: filter conditions are serialized into query parameters, so filtered views are shareable via link and persist across page refreshes

### 📦 Product Details & Transactions

- Full product detail view including photos, applicable department/grade, meetup location, and condition
- Three primary actions: **Favorite**, **Chat with seller**, and **Send purchase request**
- Seller credibility shown via public credit score
- In-context reporting system (e.g., price manipulation, relisting) with required fields to prevent misuse

### 💬 Real-time Chat

- Socket.io-based in-app chat for buyer–seller coordination (meetup time, location, payment)
- New message notifications so users don't miss a reply

### 🤝 Order Flow

- Purchase request → seller acceptance → status transitions from "Requesting" to "In Progress"
- Mutual "Complete Transaction" confirmation unlocks two-way rating, which feeds into a backend-calculated credit score
- Dispute reporting available directly from the order page (e.g., malicious cancellation, fraud, harassment)

### 🎓 School Community ("校版")

- Each university has a dedicated space with its own product listings, member directory, and wishlist board
- Visibility rules based on the logged-in user's school — some content (e.g., school-only wishlist posts) is restricted to verified students of that school
- Designed to preserve in-group context (shared references, campus-specific slang) that public listings can't capture

### 💭 Wishlist ("許願池")

- Users can publicly post items they're looking for instead of only searching passively
- Other users can initiate a chat directly from a wishlist post
- Auto-expires after 14 days; capped at 3 active posts per user to prevent spam

### 🏪 Personal Store & Product Management

- Public seller storefront preview
- Full product lifecycle management: create, edit, save as draft, delist/relist
- Custom tag creation during listing
- Preview step before publishing to confirm listing accuracy

### ⭐ Seller Discovery ("尋找同學")

- Search by name, department, region, or user ID
- Filter by credit score threshold or "same-location" (geolocation-based, matches users active in the current area)
- Sort by recommended, same-location priority, credit score, or recency

### ❤️ Favorites

- Saved product list with multi-select and batch removal

### 🛠️ Admin Backend

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
