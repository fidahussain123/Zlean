# 🏗️ zLean System Architecture

## 📌 Overview
**zLean** is a high-performance Car Wash Management SaaS. It utilizes a **Serverless / Direct-to-Service** architecture where the mobile client communicates directly with **Supabase** for database, authentication, and storage, eliminating the need for a separate middle-tier backend.

---

## 🛠️ Core Tech Stack
| Layer | Technology | Implementation |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo) | `apps/mobile` (TypeScript/expo-router) |
| **Backend/DB** | Supabase (PostgreSQL) | Direct SDK access via `lib/supabase.ts` |
| **Authentication** | Supabase Auth | Email/Phone OTP with SecureStore persistence |
| **Real-time** | Postgres CDC | Listeners on `public.visits` table for live updates |
| **Storage** | Supabase Buckets | `car-photos` for vehicle logs; `invoices` for PDFs |

---

## 🔐 Role-Based Access Control (RBAC)
User permissions are defined in the `public.profiles` table and enforced via **PostgreSQL Row Level Security (RLS)**.

### 👥 User Roles
1.  **Super Admin (`super_admin`)**: Manages the entire platform. Can create/invite shops and view global revenue.
2.  **Admin (`admin`)**: The Shop Owner. Manages their specific shop's workers, services, and financial reports.
3.  **Worker (`worker`)**: Shop staff. Responsible for vehicle intake, status updates, and photo capture.
4.  **Customer (`customer`)**: Car owner. Accesses a live tracker and loyalty points dashboard.

### 🛡️ Data Isolation (RLS)
- **`shop_id` Isolation**: Every table (Visits, Workers, Services) is keyed by `shop_id`. 
- **Policy Logic**: Users can only `SELECT`, `INSERT`, or `UPDATE` rows where the `shop_id` matches their own profile `shop_id`.

---

## 📂 Data & Storage Architecture
### 🗄️ Database Tables
- **`profiles`**: Extends `auth.users`. Stores `role` and `shop_id`.
- **`shops`**: Stores shop metadata, owner links, and plan status.
- **`visits`**: The core operation log. Uses `JSONB` for the `photos` array.
- **`service_packages`**: Shop-specific wash options and pricing.

### 🖼️ Storage Strategy
- **Bucket**: `car-photos`
- **Pathing**: `${shop_id}/${car_plate}/${timestamp}.jpg`
- **Optimization**: Use Supabase Image Transformation for generating 3D-style thumbnails for bento tiles.

---

## 🎨 UI/UX Philosophy: "Bento-Glass"
Following `UI_GUIDELINES.md`:
- **Background**: Pure White (`#FFFFFF`).
- **Accent**: Lime Yellow (`#E4FF50`).
- **Layout**: Modular Bento Grid tiles (`24px` radius).
- **Feedback**: Liquid Glass progress bars and Haptic-first interactions.

---

## 🔄 Critical Workflows
### 1. Real-time Queue Update
Worker updates `visits.status` → Supabase broadcasts change → Admin Dashboard `useVisits` hook receives payload → UI updates instantly.

### 2. Photo Capture & Link
Camera captures image → Uploads to Supabase Storage → Receives Public URL → Appends URL to `visits.photos` JSONB array.

---

## 📝 Guidelines for AI (Antigravity)
1. **No External Backend**: Do not generate Express.js or Node.js server code. All logic must reside in the mobile app or Supabase Edge Functions.
2. **Type Safety**: Use generated Supabase types for all database interactions.
3. **White Space**: Maintain a 30% white-space-to-content ratio in all generated screens.