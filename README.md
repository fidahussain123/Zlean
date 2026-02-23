# zLean — Car Wash Management App

Full-stack car wash management system with React Native (Expo) mobile app + TypeScript/Express backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo), TypeScript, expo-router |
| Backend | Express.js, TypeScript |
| Database | Turso (LibSQL) |
| Storage | Appwrite (for photos) |
| Email | SendGrid (for invites) |
| Auth | Custom JWT-style tokens (Turso-based) |

## Project Structure

```
zlean/
├── apps/
│   └── mobile/              # React Native Expo app
│       ├── app/             # expo-router screens
│       │   ├── (auth)/      # Login, Signup, Shop-signup
│       │   ├── (super-admin)/ # Platform management
│       │   ├── (admin)/     # Shop admin screens
│       │   ├── (worker)/    # Worker screens
│       │   └── (customer)/  # Customer screens
│       ├── contexts/        # React contexts (auth)
│       ├── constants/       # Theme, API config
│       └── services/        # API client
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, role guards
│   │   ├── services/        # Email service
│   │   └── db/              # Turso client, schema push
│   └── schema.sql           # Database schema
├── .env                     # Environment variables (root)
└── UI_GUIDELINES.md         # Design system
```

## Credentials

| Role | Email/Login | Password |
|------|-------------|----------|
| Super Admin | `zlean314@gmail.com` | `NAELZ@123` |

## Environment Variables

Root `.env` file contains:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Appwrite Storage
APPWRITE_ENDPOINT=https://...
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
APPWRITE_BUCKET_ID=...

# SendGrid (optional - for invite emails)
SENDGRID_API_KEY=...
FROM_EMAIL=zlean314@gmail.com
APP_URL=http://localhost:8081

# Firebase (placeholder - not used yet)
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_APP_ID
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Mobile
cd apps/mobile
npm install
```

### 2. Database Setup

```bash
cd backend
npm run db:push   # Creates tables + seeds super_admin
```

### 3. Start Development

```bash
# Terminal 1 - Backend (port 4000)
cd backend
npm run dev

# Terminal 2 - Mobile (port 8081)
cd apps/mobile
npx expo start
```

Press `w` to open web, or scan QR code for mobile.

---

## Features Completed

### Authentication System
- [x] Single login screen (email/phone + password)
- [x] Role-based routing (super_admin → admin → worker → customer)
- [x] Customer signup
- [x] Session management (SecureStore for native, localStorage for web)
- [x] Logout functionality (all roles)

### Super Admin Features
- [x] Dashboard with platform stats (shops, admins count)
- [x] Shops list view
- [x] Admins list view
- [x] **Shop Owner Invite System** ⭐
  - Enter email to invite shop owners
  - Email sent via SendGrid (optional)
  - Shop owners can signup by entering invited email
  - Shop onboarding form (name, address, phone)
- [x] Settings with logout

### Admin (Shop Owner) Features
- [x] Dashboard with today's stats
- [x] Live car queue
- [x] Add new car (car entry form)
- [x] Worker assignment
- [x] Service selection
- [x] Car detail view
- [x] Services management (CRUD)
- [x] Workers list
- [x] Settings with logout

### Worker Features
- [x] Queue screen with stats
- [x] Visit list
- [x] Visit detail view
- [x] Status update (waiting → washing → drying → ready → delivered)
- [x] Settings with logout

### Customer Features
- [x] Basic tracker screen (placeholder)
- [x] Settings with logout

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login (email/phone + password) |
| POST | `/signup/customer` | Customer signup |

### Invites (`/api/invites`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | super_admin | Create invite |
| GET | `/` | super_admin | List all invites |
| POST | `/check-email` | public | Check if email has invite |
| GET | `/:token` | public | Validate invite token |
| POST | `/:token/accept` | public | Accept invite + create account |
| POST | `/:id/resend` | super_admin | Resend invite |
| DELETE | `/:id` | super_admin | Revoke invite |

### Shops (`/api/shops`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | admin/super | List shops |
| GET | `/:id` | admin/super | Get shop |
| POST | `/` | super_admin | Create shop |
| PATCH | `/:id` | admin/super | Update shop |
| DELETE | `/:id` | super_admin | Soft delete |

### Workers (`/api/workers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | admin | List workers |
| POST | `/` | admin | Create worker |
| PATCH | `/:id` | admin | Update worker |
| DELETE | `/:id` | admin | Deactivate worker |

### Cars/Visits (`/api/cars`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | admin/worker | List visits |
| GET | `/:id` | admin/worker | Get visit |
| POST | `/` | admin | Create visit (car entry) |
| PATCH | `/:id` | admin/worker | Update visit status |

### Services (`/api/services`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | admin | List services |
| POST | `/` | admin | Create service |
| PATCH | `/:id` | admin | Update service |
| DELETE | `/:id` | admin | Delete service |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin` | admin | Admin dashboard stats |
| GET | `/worker` | worker | Worker dashboard stats |

---

## Database Schema

### Core Tables
- `users` - All users (super_admin, admin, worker, customer)
- `shops` - Car wash shops
- `visits` - Car entries/visits
- `invoices` - Billing records
- `service_packages` - Available services per shop
- `invites` - Shop owner invitations

### User Roles
1. **super_admin** - Platform owner, manages all shops
2. **admin** - Shop owner, manages their shop
3. **worker** - Shop employee, handles car washing
4. **customer** - End user, tracks their car

---

## UI Design System

Following `UI_GUIDELINES.md`:

| Element | Value |
|---------|-------|
| Primary Color | `#E4FF50` (lime accent) |
| Background | `#FFFFFF` |
| Surface | `#F6F8FC` |
| Text | `#111827` |
| Text Subtle | `#6B7280` |
| Border | `#E5E7EB` |
| Tile Radius | `24px` |
| Button Radius | `12px` |

---

## What's Next (TODO)

### High Priority
- [ ] Worker photo capture + Appwrite upload
- [ ] Admin worker management (add/edit/delete)
- [ ] Real-time updates (WebSocket or polling)
- [ ] Push notifications

### Medium Priority
- [ ] Customer car tracking (real-time status)
- [ ] Customer booking/appointments
- [ ] Customer wash history
- [ ] Billing/invoices flow
- [ ] Reports & analytics

### Low Priority
- [ ] Firebase SMS OTP login
- [ ] Membership/loyalty system
- [ ] Multi-language support
- [ ] Dark mode

---

## Known Issues

1. **SendGrid 403 Error** - Need to verify sender email in SendGrid dashboard
   - Go to SendGrid → Settings → Sender Authentication → Verify Single Sender
   - Verify `zlean314@gmail.com` as sender
   - Alternative: Shop owners can signup without email (they just need to know their invited email)

2. **Web Alert** - `Alert.alert()` doesn't work on web, fixed with `Platform.OS` check using `window.confirm()`

---

## Contributing

1. Clone the repo
2. Copy `.env` from project lead
3. Run `npm install` in both `backend/` and `apps/mobile/`
4. Start backend: `cd backend && npm run dev`
5. Start mobile: `cd apps/mobile && npx expo start`

---

## Contact

- Repository: https://github.com/fidahussain123/Zlean
- Super Admin: zlean314@gmail.com
