# SWE Mentor App - Style Guide

> Reference this document when building UI components for web, mobile, and React Native.

---

## Tech Stack

| Platform | Framework | UI Library | CSS |
|----------|-----------|------------|-----|
| Web | React | DaisyUI 4.x | Tailwind CSS |
| Mobile | React Native | NativeWind | Tailwind-based |

---

## Theme

- **Mode:** Dark theme (`data-theme="dark"`)
- **Base Background:** `bg-gray-950` / `#030712`

---

## Color Palette

### Primary (Purple)
```
50:  #f5f3ff
100: #ede9fe
200: #ddd6fe
300: #c4b5fd
400: #a78bfa
500: #8b5cf6  ← Main
600: #7c3aed
700: #6d28d9
800: #5b21b6
900: #4c1d95
```

### Accent (Pink/Magenta)
```
50:  #fdf4ff
100: #fae8ff
200: #f5d0fe
300: #f0abfc
400: #e879f9
500: #d946ef  ← Main
600: #c026d3
700: #a21caf
800: #86198f
900: #701a75
```

### Semantic Colors
| Purpose | Color | Tailwind Class |
|---------|-------|----------------|
| Success | Green | `text-green-400`, `bg-green-500` |
| Active/Online | Green | `text-green-400` |
| Notification | Pink | `bg-pink-500` / `#ec4899` |
| Muted Text | Gray | `text-gray-400`, `text-gray-500` |

### Gradient
```css
background: linear-gradient(-45deg, #4c1d95, #7c3aed, #8b5cf6, #a78bfa);
background-size: 400% 400%;
```
Tailwind: `gradient-bg` (custom class) or use `bg-gradient-to-br from-primary-600 to-accent-600`

---

## Typography

### Font Sizes
| Use Case | Class | Size |
|----------|-------|------|
| Page Title | `text-2xl font-bold` | 24px |
| Section Header | `text-xl font-bold` | 20px |
| Card Title | `font-medium` or `font-semibold` | 16px |
| Body | `text-sm` | 14px |
| Caption/Label | `text-xs` | 12px |
| Nav Label | `text-[10px]` | 10px |

### Font Weights
- `font-medium` (500) - Card titles, labels
- `font-semibold` (600) - Section headers, buttons
- `font-bold` (700) - Page titles, emphasis

---

## Spacing & Layout

### Border Radius
| Component | Class |
|-----------|-------|
| Cards | `rounded-2xl` (16px) |
| Buttons | `rounded-2xl` (16px) |
| Inputs | `rounded-xl` (12px) |
| Small Cards | `rounded-xl` (12px) |
| Avatars | `rounded-full` |
| Nav Container | `rounded-full` (pill) |

### Padding
- Cards: `p-4` to `p-6`
- Buttons: `py-4 px-4` (full-width) or `py-2 px-4` (inline)
- Inputs: `px-4 py-3.5`
- Screen Content: `px-6 pt-8`

---

## Components

### Tags / Hashtags

Tags should be displayed with a `#` prefix. Use DaisyUI badge component.

```jsx
// React/React Native
<span className="badge badge-primary badge-sm">#Coding</span>
<span className="badge badge-secondary badge-sm">#Review</span>
<span className="badge badge-accent badge-sm">#Meeting</span>
```

| Tag Type | Class |
|----------|-------|
| Default | `badge badge-primary badge-sm` |
| Secondary | `badge badge-secondary badge-sm` |
| Accent | `badge badge-accent badge-sm` |
| Large | `badge badge-primary badge-lg` |

**Always prefix tag text with `#`** (e.g., `#Coding`, `#Review`, `#Meeting`)

---

### Buttons

```jsx
// Primary CTA (gradient)
<button className="w-full py-4 rounded-2xl gradient-bg font-semibold">
  Get Started
</button>

// Primary solid
<button className="w-full py-4 rounded-2xl bg-primary-600 font-semibold">
  Continue
</button>

// Secondary/Glass
<button className="w-full py-4 rounded-2xl glass text-gray-300">
  Cancel
</button>
```

---

### Cards

```jsx
// Standard Card
<div className="rounded-xl bg-gray-800/30 p-4">
  {/* content */}
</div>

// Stat Card
<div className="rounded-xl bg-gray-800/50 p-4">
  <p className="text-gray-400 text-xs mb-1">Label</p>
  <p className="text-2xl font-bold text-primary-400">Value</p>
</div>

// Featured Card (gradient)
<div className="rounded-2xl gradient-bg p-6">
  <p className="text-white/80 text-sm mb-1">Subtitle</p>
  <h3 className="text-xl font-bold mb-4">Title</h3>
</div>

// Glass Card
<div className="glass rounded-2xl p-4">
  {/* content */}
</div>
```

**Glass effect:**
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

### Inputs

```jsx
<div>
  <label className="text-sm text-gray-400 mb-2 block">Label</label>
  <input
    type="text"
    placeholder="Placeholder"
    className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none"
  />
</div>
```

---

### Avatar

```jsx
// With Initials
<div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center font-bold">
  JD
</div>

// Sizes
// Small: w-8 h-8
// Medium: w-12 h-12
// Large: w-24 h-24
```

---

### Bubble Navigation Bar

The main navigation uses a floating pill/bubble design:

```jsx
<div className="bubble-nav">
  <div className="bubble-container">
    <button className="bubble-item active">
      <Icon className="icon" />
      <span className="label">Home</span>
    </button>
    {/* ... more items */}
  </div>
  <button className="search-btn">
    <SearchIcon />
  </button>
</div>
```

**Key styles:**
- Container: `rounded-full`, blur backdrop, semi-transparent dark bg
- Active state: Pink text `#f9a8d4`
- Inactive: Gray `#9ca3af`
- Notification dot: Pink pulsing dot

---

### Chat Bubbles

```jsx
// Incoming (AI/Mentor)
<div className="flex gap-3">
  <div className="w-8 h-8 rounded-full gradient-bg flex-shrink-0" />
  <div className="rounded-2xl rounded-tl-none bg-gray-800 p-4 max-w-[80%]">
    <p className="text-sm">Message text</p>
  </div>
</div>

// Outgoing (User)
<div className="flex gap-3 justify-end">
  <div className="rounded-2xl rounded-tr-none bg-primary-600 p-4 max-w-[80%]">
    <p className="text-sm">Message text</p>
  </div>
</div>
```

---

### Progress Bars

```jsx
<div>
  <div className="flex justify-between text-sm mb-2">
    <span>Skill Name</span>
    <span className="text-primary-400">72%</span>
  </div>
  <div className="h-2 bg-gray-800 rounded-full">
    <div className="h-2 bg-primary-500 rounded-full" style={{ width: '72%' }} />
  </div>
</div>
```

---

### List Items

```jsx
<div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
    <Icon className="w-5 h-5 text-green-400" />
  </div>
  <div>
    <p className="font-medium text-sm">Title</p>
    <p className="text-gray-500 text-xs">Subtitle</p>
  </div>
</div>
```

---

## Animations

### Gradient Animation
```css
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
animation: gradient 15s ease infinite;
```

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: fadeIn 0.3s ease-out;
```

### Pulse (Notification Dot)
```css
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}
animation: pulse-dot 2s ease-in-out infinite;
```

### Slow Pulse (Logo)
```
animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## Icons

Use stroke-based SVG icons (Heroicons style):
- Size: `w-5 h-5` (default), `w-4 h-4` (small), `w-6 h-6` (large)
- Stroke width: 2
- Style: `stroke="currentColor"` with `fill="none"`

---

## React Native / NativeWind Notes

When implementing in React Native with NativeWind:

1. **Shadows** - Use React Native shadow props instead of Tailwind shadow classes
2. **Backdrop blur** - May require `expo-blur` or similar
3. **Gradients** - Use `expo-linear-gradient` or `react-native-linear-gradient`
4. **Safe Areas** - Use `react-native-safe-area-context`
5. **Border radius** - Same values work, use `rounded-2xl` etc.

```jsx
// React Native gradient example
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#4c1d95', '#7c3aed', '#8b5cf6', '#a78bfa']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  className="rounded-2xl p-6"
>
  {/* content */}
</LinearGradient>
```

---

## DaisyUI Component Reference

Components used from DaisyUI:
- `badge` - Tags and labels
- `btn` - Buttons (optional, can use custom)

Tailwind + DaisyUI CDN:
```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.14.1/dist/full.min.css" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
```

---

## Quick Reference

| Element | Classes |
|---------|---------|
| Page bg | `bg-gray-950` |
| Card | `rounded-xl bg-gray-800/30 p-4` |
| Button primary | `rounded-2xl bg-primary-600 py-4 font-semibold` |
| Button gradient | `rounded-2xl gradient-bg py-4 font-semibold` |
| Input | `rounded-xl bg-gray-800 border border-gray-700 px-4 py-3.5` |
| Tag | `badge badge-primary badge-sm` with `#` prefix |
| Avatar | `rounded-full gradient-bg w-12 h-12` |
| Muted text | `text-gray-400` or `text-gray-500` |
| Active accent | `text-pink-300` / `#f9a8d4` |
