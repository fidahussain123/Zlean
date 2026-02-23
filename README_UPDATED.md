# zLean V2 — Complete Supabase Architecture

zLean is a robust, full-stack car wash management system built with React Native (Expo) and styled with a Hyper-Minimalist Bento Glass UI system. Version 2.0 completely migrates the backend from Express/Turso/Appwrite directly into a unified Serverless Supabase architecture for maximum performance and real-time capabilities.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo), TypeScript, expo-router |
| Backend & API | Supabase (PostgreSQL + PostgREST) |
| Authentication | Supabase Auth (Email/Password) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (Buckets) |
| Real-Time | Supabase Realtime (WebSockets) |

## 📁 Project Structure

```
zlean/
├── apps/
│   └── mobile/              # React Native Expo app (Runs on Web/iOS/Android)
│       ├── app/             # expo-router file-based routing
│       │   ├── (auth)/      # Login, Signup, Shop-signup
│       │   ├── (super-admin)/ # Platform management & global stats
│       │   ├── (admin)/     # Shop owner dashboard & live queue
│       │   ├── (worker)/    # Worker queue & task management
│       │   └── (customer)/  # Customer live, real-time car wash tracker
│       ├── components/      # Reusable UI components
│       ├── contexts/        # React contexts (Supabase Auth Session)
│       ├── lib/             # Utility functions
│       │   └── supabase.ts  # Supabase Client Initialization
│       ├── constants/       # Theme colors, APIs, constraints
│       └── supabase/        
│           └── schema.sql   # Postgres Schema, RLS Policies & Triggers
├── UI_GUIDELINES.md         # Design system constraints
└── README_UPDATED.md        # This file
```

---

## 🔐 Role-Based Access Control

The app operates on a 4-tier role system. Users are automatically routed to their respective dashboards upon logging in:

| Role | Responsibility | Login |
|------|----------------|-------|
| `super_admin` | Manages the entire platform, views global revenue, and invites new shop owners. | `zlean314@gmail.com` |
| `admin` | A shop owner. Manages workers, services, and live queues for their specific shop. | Assigned via Email Invite |
| `worker` | A shop employee. Changes car wash statuses (waiting -> washing -> ready). | Created by Shop Admin |
| `customer` | The end user. Can track their live car wash progress via a real-time progress bar. | Any standard signup |

---

## 🎨 UI Design System: The "Bento-Glass" Aesthetic

zLean adheres strictly to the `UI_GUIDELINES.md`.
- **Canvas**: Pure White (`#FFFFFF`) with generous atmospheric spacing.
- **Accents**: Lime Yellow (`#E4FF50`) and Deep Slate Black (`#111827`).
- **Layout**: Information is presented in modular "Bento" tiles with 24px extra-rounded corners and ultra-soft, almost invisible shadows. 
- **Typography**: Inter/Space Grotesk with thick, confident headings.

---

## ⚡ Serverless & Real-Time Functionality

V2 eliminates custom Express endpoints and heavily utilizes Supabase native features:

1. **Native Counts**: Dashboards use optimized `count: exact` Postgres queries instead of heavy fetching.
2. **Row Level Security (RLS)**: Data access is strictly controlled. Shop owners can only view their shop's visits, workers see queue assignments, and customers ONLY see their own `visits`.
3. **Database Triggers**: Signing up automatically triggers a database function (`handle_new_user`) that writes the Auth metadata directly into the public `profiles` table.
4. **Live Timelines**: The Customer Tracker dashboard utilizes `supabase.channel` websockets to animate the progress bar instantly the moment a worker clicks "Update Status".

---

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 2. Environment Variables
Create a `.env` file inside `apps/mobile/` and link your Supabase instance:
```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Database Schema setup
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Copy the entire contents of `apps/mobile/supabase/schema.sql`.
3. Run the script. This drops any old tables, creates the `profiles`, `shops`, `visits`, etc., enforces Row Level Security policies, and registers the database triggers.
4. *Important:* Ensure `zlean314@gmail.com` is registered in Auth and its role is manually set to `super_admin` in the `profiles` table to bootstrap the network.

### 4. Start Development
```bash
cd apps/mobile
npx expo start
```
Press `w` for the web interface or use the Expo Go app to test natively on iOS/Android.

---

## 🚀 Features Migrated to V2 Complete Status

- [x] **Global Auth:** Fully robust `supabase.auth` sign ups and log-outs across all 4 environments.
- [x] **Shop Owner Onboarding:** `shop-signup.tsx` handles Supabase invite tokens, automatically creating Auth users, native Shops, and linking Profiles.
- [x] **Real-Time Dashboards:** Customer tracker visualizes data instantly over Websockets without polling.
- [x] **Security:** Row Level Security (RLS) enabled across every table to prevent Cross-Shop data leakage.
