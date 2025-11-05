# 🌌 Logverse

Logverse is a Next.js 15 application that visualizes your life as a personal galaxy.
Each life domain — Finance, Fitness, Learning, Investment, Travel, Career, Routine, Shopping, Note, etc. — is represented as a planet orbiting your core (the Sun).
You can visually navigate, oversee, and manage your life constellation.

## ✨ Features

- 🪐 **Galaxy Mapping**: Planets represent life categories around your core
- 🎨 **Modern UI**: Tailwind CSS v4 with theme tokens and dark mode
- ✨ **Smooth Animations**: Interactive galaxy with drag-to-rotate and scroll-to-zoom
- 📱 **Responsive Design**: Scales gracefully for all devices with mobile-friendly sidebar
- 🌟 **Starfield Background**: Subtle twinkling ambient animation
- 🧭 **Sidebar Navigation**: Quick access to all categories with mobile menu
- 🔗 **Dynamic Routing**: Category-specific pages for each life domain

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build and Deploy (Static Export for GitHub Pages)

```bash
# Build for local preview (no basePath)
npm run build

# Preview the exported site locally
npm run preview

# Build for GitHub Pages deployment (with basePath)
npm run build:gh-pages
```

**Note:** 
- Use `npm run build` for local preview/testing
- Use `npm run build:gh-pages` when building for actual GitHub Pages deployment
- The build process automatically generates static files in the `out` directory
- For GitHub Pages deployment, configure your repository to serve from the `out` directory

## 🔧 Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type safety and better DX
- **Tailwind CSS 4** - Modern utility-first styling
- **Lucide React** - Beautiful icon library
- **Static Site Generation** - Pre-rendered for optimal performance
- **GitHub Pages** - Static site deployment

## 🧭 Concept

- Each life domain (Finance, Fitness, Learning, Investment, Travel, Career, etc.) is modeled as a planet.
- Your personal core (the Sun) sits at the center, symbolizing your identity and priorities.
- Interact with your “universe” to explore and navigate your current focus.

## 📦 Project Structure

```
CKLEE-99.GITHUB/
├── src/
│   ├── app/                      # Next.js App Router (routes & layouts)
│   │   ├── layout.tsx            # Root layout (global styles + providers)
│   │   ├── page.tsx              # Home page (Galaxy view)
│   │   ├── not-found.tsx         # 404 page
│   │   └── [category]/
│   │       └── page.tsx          # Dynamic category pages
│   │
│   ├── features/                 # Feature modules
│   │   └── galaxy/
│   │       ├── components/
│   │       │   ├── Galaxy.tsx
│   │       │   ├── GalaxySidebar.tsx
│   │       │   └── StarField.tsx
│   │       └── index.ts
│   │
│   ├── components/               # Shared/common components
│   │   ├── ui/
│   │   │   ├── sonner.tsx
│   │   │   └── tooltip.tsx
│   │   └── layout/
│   │       └── layout.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                      # Utilities
│   │   └── utils.ts
│   │
│   ├── data/                     # Static data
│   │   └── categories.json
│   │
│   └── styles/                   # Global styles
│       └── globals.css
│
├── public/                       # Public static assets
│   ├── font/Art.ttf
│   └── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── package.json
```

## 🎨 Customization

- Adjust `src/features/galaxy/*` to customize galaxy interactions.
- Tweak global styles in `src/styles/globals.css`.

---

Built with passion, debugged with despair and emotional damage. 💻✨
