# CampusRecover AI — Developer Guide

## 1. Architecture Overview

CampusRecover AI is structured as a client-first, cloud-native enterprise Single Page Application (SPA):

```
src/
├── app/                  # Application routing, lazy code splitting, layout wiring
├── components/           # Reusable UI component library
│   ├── auth/             # Role guards and protected route wrappers
│   ├── common/           # Error boundaries, Skeletons, EmptyState, SEO, ThemeToggle
│   ├── layout/           # Sidebar, TopNav, AppLayout, PublicLayout
│   └── ui/               # Atomic buttons, badges, cards, inputs
├── config/               # Environment validator (Zod), Firebase, QueryClient, constants
├── context/              # React contexts (AuthContext, ThemeContext)
├── hooks/                # Custom React Query hooks (useLostItems, useAIMatches, etc.)
├── pages/                # Lazy-loaded feature views and role dashboards
├── schemas/              # Zod validation schemas for report submission and validation
├── services/             # Domain logic (Matching, Handover, OCR, Embedding, Logger, RateLimiter)
├── types/                # Core domain TypeScript interfaces
└── utils/                # Receipt generator, image optimizer, date helpers
```

---

## 2. Prerequisites & Local Setup

### Toolchain
- **Node.js**: >= 20.x
- **Package Manager**: npm or pnpm
- **Vite**: 8.x with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite`

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials for your Firebase project and Cloudinary cloud.

### Development Server
```bash
npm run dev
```
Access the application at `http://localhost:8443` or the port allocated by Vite.

---

## 3. Development Workflow & Quality Standards

### Code Formatting
This repository uses `oxfmt` for high-speed style formatting:
```bash
npm run format
```

### TypeScript Validation
Run the compiler check to verify type safety:
```bash
npx tsc --noEmit
```

### Automated Testing
Run the Vitest test suite:
```bash
npm test
```

### Writing New Services
- All services must be modular classes or singleton instances exported from `src/services/`.
- Use `Logger.info()` / `Logger.error()` for diagnostic tracing.
- Wrap mutations with `RateLimiter.check()` if they involve sensitive endpoints (OTP, reports).

---

## 4. Building for Production

```bash
npm run build
```
Vite will compile and chunk-split your assets into the `dist/` directory.

### Deployment Targets
- **Vercel**: Deploy using `vercel.json` (auto-configured SPA fallback and caching headers).
- **Firebase Hosting**: Deploy using `firebase deploy --only hosting,firestore`.
