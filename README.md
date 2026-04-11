# 🚨 NearFix — Emergency Help, Closest to You

NearFix is a mobile-first web application that helps travelers find nearby emergency services (mechanics, puncture shops, hospitals, police stations, and fuel stations) along the Honnavar–Bhatkal coastal highway (NH-66) in Karnataka, India.

![NearFix](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Leaflet](https://img.shields.io/badge/Map-Leaflet-199900?style=flat-square&logo=leaflet)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwindcss)

## 🌟 Features

- 🗺️ **Interactive Map** — OpenStreetMap with custom colored markers per category
- 📍 **Geolocation** — Auto-detect user location with distance-based sorting
- 🔧 **5 Service Categories** — Mechanic, Puncture Shop, Hospital, Police, Fuel
- 🆘 **SOS Button** — Quick access to emergency contacts (108, 100, 101, 1033)
- ⭐ **Reviews & Ratings** — Leave feedback for services
- 🛡️ **Admin Panel** — Full CRUD for services, feedback management
- 🌙 **Dark/Light Mode** — Emergency orange + night mode first design
- 📱 **Mobile-First** — Responsive with bottom navigation
- 🔒 **Secure** — Row Level Security, rate limiting, input validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- (Optional) An [Upstash](https://upstash.com) Redis database for rate limiting

### 1. Clone & Install

```bash
cd nearfix
npm install
```

### 2. Set Up Environment

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase and Upstash credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com
```

### 3. Set Up Database

Go to your Supabase dashboard → SQL Editor, and run the migration file:

```
supabase/migrations/001_initial_schema_and_seed.sql
```

This will:
- Create the `services` and `feedback` tables
- Set up PostGIS extension
- Enable Row Level Security
- Insert 30+ seed services along NH-66

### 4. Create Admin User

In Supabase Dashboard → Authentication → Users, create a new user with the email you set in `NEXT_PUBLIC_ADMIN_EMAILS`.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
nearfix/
├── app/
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout
│   ├── loading.tsx                 # Global loading
│   ├── map/page.tsx                # Full map view
│   ├── services/[category]/        # Service list by category
│   ├── service/[id]/               # Service detail
│   ├── feedback/[id]/              # Feedback page
│   ├── admin/                      # Admin panel (auth protected)
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Dashboard
│   │   ├── services/page.tsx       # CRUD services
│   │   └── feedback/page.tsx       # Manage feedback
│   ├── api/
│   │   ├── services/route.ts       # GET services API
│   │   └── feedback/route.ts       # POST/GET feedback API
│   └── offline/page.tsx            # Offline fallback
├── components/
│   ├── layout/                     # Header, BottomNav, SOSButton
│   ├── map/                        # LeafletMap, DynamicMap
│   ├── services/                   # ServiceCard, ServiceList, CategorySelector
│   └── providers/                  # ThemeProvider
├── hooks/                          # useLocation, useNearbyServices, useMap
├── lib/                            # Supabase clients, utils, validations
├── types/                          # TypeScript interfaces
├── supabase/migrations/            # SQL schema + seed data
└── middleware.ts                   # Session refresh
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Map | Leaflet.js + react-leaflet |
| Styling | Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toasts | Sonner |
| Rate Limiting | Upstash Redis |

## 📞 Emergency Contacts

These are available via the SOS button on every page:

| Service | Number |
|---------|--------|
| 🚑 Ambulance | 108 |
| 🚔 Police | 100 |
| 🔥 Fire | 101 |
| 🛣️ Highway | 1033 |

## 📝 License

This project is built for educational/college purposes.
