# 📝 Study Log - Learning Journey

A personal study log website built with Next.js 15, using static rendering and deployed to GitHub Pages.

## ✨ Features

- 📝 **Timeline Display**: Show learning records in timeline format
- 🎨 **Modern UI**: Built with TailwindCSS 4 and dark mode support
- ✨ **Smooth Animations**: Integrated Framer Motion for fluid interactions
- 📱 **Responsive Design**: Support for various device sizes
- 🔄 **Expand/Collapse**: Cards support click to expand and view details
- 📊 **JSON Data**: Learning records stored in `public/data/logs.json`
- 🌟 **Stellar Background**: Beautiful animated starfield background

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the result

### Build and Deploy

```bash
npm run build
npm run start
```

## 🔧 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS 4** - Modern CSS framework
- **Framer Motion** - Animation library
- **GitHub Pages** - Static site deployment

## 📊 Data Structure

Learning records are stored in `public/logs.json`:

```json
[
  {
    "date": "2025-01-15",
    "title": "Learning Topic",
    "summary": "Brief summary",
    "details": "Detailed content...",
    "icon": "📘"
  }
]
```

## 📦 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── StudyCard.tsx    # Study card component
│   │   ├── Timeline.tsx     # Timeline component
│   │   └── Stellaris.tsx    # Starfield background
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
public/
├── data/logs.json           # Learning records data
└── font/Art.ttf             # Font file
```

## 🎨 Customization

- Modify `public/data/logs.json` to update learning records
- Adjust components in `src/app/components/` to change UI
- Customize styles in `src/app/globals.css`

## 🌟 Background Features

- Animated starfield with twinkling stars
- Deep space gradient background
- Multiple star colors and sizes
- Smooth animations and transitions

---

Built with passion, debugged with despair and emotional damage. 💻✨
