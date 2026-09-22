# 🍔 BiteRush — Next-Gen Food Delivery Ecosystem Frontend

A state-of-the-art, high-performance food delivery web application built using **Next.js 15 App Router**, **Redux Toolkit & RTK Query**, **Three.js & React Three Fiber (3D graphics)**, **Tailwind CSS**, and **Framer Motion**.

Designed for seamless integration with Spring Boot Microservices (Eureka Discovery Server, Spring Cloud Gateway on `localhost:8080`).

---

## ✨ Features & Architecture

- 🎨 **Dual Dynamic Themes**: Toggle between **Cyber Dark Mode** (Neon Amber `#FF7A00`) and **Warm Sunset Mode** (`#D97706`).
- 🧊 **3D Interactive Graphics**: Three.js floating elements and interactive canvas powered by `@react-three/fiber` & `@react-three/drei`.
- 🔐 **Multi-Role RBAC Middleware**: Full role-based routing & UI permissions for:
  - 👤 **Customer**: Browse restaurants, filter cuisines, cart management, mock checkout, live GPS tracking.
  - 🏪 **Restaurant Owner**: Kitchen queue dashboard & menu item CRUD.
  - 🚗 **Delivery Driver**: Active route management & status updates.
  - 🛡️ **Admin / Manager**: Platform analytics & Eureka microservices status monitoring.
- ⚡ **Redux Toolkit & RTK Query**: Instant state hydration, automated API caching, token persistence, dynamic toast notifications.
- 📱 **100% Responsive & Fluid**: Modern glassmorphism, micro-animations, mobile drawer, drawer cart, custom font styling.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Client Components)
- **State Management**: Redux Toolkit + RTK Query
- **3D & Animation**: Three.js, React Three Fiber, Framer Motion, Lucide Icons
- **Styling**: Tailwind CSS, CSS Custom Variables
- **HTTP & Auth**: Axios, JWT Interceptor
- **Notifications**: React Hot Toast

---

## 🚀 Quick Start Guide

### 1. Set Workspace & Install Dependencies
```bash
# Navigate into the extracted project directory
cd biterush-frontend

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Ensure `.env.local` is present in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=BiteRush
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Demo Credentials & Quick Logins

On the Login Page (`/auth/login`), use the quick-fill buttons or these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Customer** | `customer@biterush.com` | `Password123!` |
| **Owner** | `owner@biterush.com` | `Password123!` |
| **Driver** | `driver@biterush.com` | `Password123!` |
| **Admin** | `admin@biterush.com` | `Password123!` |

---

## 📦 Backend Compatibility Matrix

Tested against Spring Boot API Gateway (`http://localhost:8080`):
- `/api/v1/auth/*` — Auth & Registration Service
- `/api/v1/restaurants/*` — Restaurant & Menu Service
- `/api/v1/orders/*` — Order & Cart Service
- `/api/v1/payments/*` — Payment Gateway Mock Service
- `/api/v1/users/*` — User Profile & Address Service
- `/api/v1/support/*` — Support & Reviews Service
