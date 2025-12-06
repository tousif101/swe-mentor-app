# SWE Mentor App

An AI-powered career development companion for software engineers — track daily work, receive AI mentorship, and measure progress against career advancement ladders.

> **Status:** Early development. See [Features (Planned)](#features-planned) for roadmap.

## Project Structure

```
swe-mentor-app/
├── apps/
│   ├── mobile/          # Expo + NativeWind
│   │   ├── App.tsx
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── tailwind.config.js
│   │   └── global.css
│   └── web/             # Next.js + Tailwind + DaisyUI
│       └── src/app/
│           ├── globals.css   # Theme config
│           ├── layout.tsx
│           └── page.tsx
├── packages/
│   └── shared/          # Shared types & utilities
│       └── src/index.ts
├── mockups/             # Design mockups
├── package.json         # npm workspaces root
├── STYLE_GUIDE.md       # UI/UX reference
└── .gitignore
```

## Tech Stack

| Platform | Framework | UI Library | CSS |
|----------|-----------|------------|-----|
| Web | Next.js 16 | DaisyUI 5 | Tailwind v4 |
| Mobile | Expo 54 | NativeWind 4 | Tailwind v3 |
| Shared | TypeScript | - | - |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Expo Go app (for mobile testing)

### Installation

```bash
# Clone and install all workspace dependencies
git clone <repository-url>
cd swe-mentor-app
npm install
```

### Development

```bash
# Run Next.js web app (http://localhost:3000)
npm run dev:web

# Run Expo mobile app
npm run dev:mobile
```

Or run directly in each app:

```bash
# Web
cd apps/web && npm run dev

# Mobile
cd apps/mobile && npm start
```

## Configuration

### Web (Next.js + Tailwind v4 + DaisyUI)

Theme is configured in `apps/web/src/app/globals.css` using CSS-based Tailwind v4 config:

- Custom primary (purple) and accent (pink) color palettes
- DaisyUI dark theme enabled
- Custom utility classes: `.gradient-bg`, `.glass`, animations

### Mobile (Expo + NativeWind)

Theme is configured in `apps/mobile/tailwind.config.js`:

- Same color palette as web
- NativeWind v4 preset for React Native compatibility

### Shared Package

`packages/shared` contains:

- **Types**: `User`, `JournalEntry`, `Tag`, `MentorMessage`, `Insight`, `SkillProgress`
- **Constants**: Color palette matching the style guide
- **Utilities**: `formatTag()`, `parseTag()` for hashtag formatting

Import in apps:

```typescript
import { User, formatTag, colors } from '@swe-mentor/shared';
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start Next.js dev server |
| `npm run dev:mobile` | Start Expo dev server |
| `npm run build:web` | Build Next.js for production |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type check all workspaces |

## Style Guide

See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for:

- Color palette reference
- Component patterns (buttons, cards, inputs, tags)
- Typography scale
- Animation keyframes
- React Native / NativeWind notes

**Key convention**: Tags are displayed with `#` prefix (e.g., `#Coding`, `#Review`)

## Features (Planned)

- Daily work journaling (web, mobile, SMS)
- AI-powered mentorship with Socratic questioning
- Career ladder tracking and gap analysis
- Vector search across journal entries
- Daily/weekly/monthly AI-generated insights

## License

MIT
