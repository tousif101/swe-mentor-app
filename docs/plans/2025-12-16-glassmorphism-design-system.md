# Glassmorphism + Momentum UI Design System

**Created:** 2025-12-16
**Status:** Approved
**Mockup:** `mockups/mobile/home-polish-mockup.html`

## Overview

A cohesive design system for the SWE Mentor mobile app combining glassmorphism aesthetics with momentum-oriented UI patterns. Designed for engineers who use iOS, Linear, Notion, and Arc - familiar, premium, focused.

## Design Principles

1. **Clarity through layers** - Glass effects separate cognitive zones
2. **Momentum over gamification** - Streaks feel earned, not gimmicky
3. **Subtle delight** - Animations reward without distracting
4. **Progressive disclosure** - UI complexity grows with user investment

---

## Color System

### Base Palette

```
Background:     #0f0d23 (deep purple-black)
Surface:        rgba(255, 255, 255, 0.05)
Border:         rgba(255, 255, 255, 0.1)
Text Primary:   #ffffff
Text Secondary: #9ca3af
Text Muted:     #6b7280
```

### Accent Gradients

| Context | Gradient | Shadow |
|---------|----------|--------|
| **Morning** | `#d97706 → #f59e0b → #fbbf24` | `rgba(217, 119, 6, 0.25)` |
| **Evening** | `#8b5cf6 → #6366f1 → #3b82f6` | `rgba(139, 92, 246, 0.3)` |
| **Completed** | `#10b981 → #14b8a6 → #06b6d4` | `rgba(16, 185, 129, 0.3)` |
| **Streak** | `#f59e0b → #ef4444` | `rgba(249, 115, 22, 0.2)` |
| **Primary** | `#8b5cf6 → #a78bfa` | — |

### Semantic Colors

```
Success:  #10b981 (emerald)
Warning:  #f59e0b (amber)
Error:    #ef4444 (red)
Info:     #8b5cf6 (purple)
```

---

## Glassmorphism Tokens

### Glass Card (Standard)

```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
```

### Glass Card (Tinted)

For accent cards (streak, insights):

```css
background: rgba({accent}, 0.1);
backdrop-filter: blur(20px);
border: 1px solid rgba({accent}, 0.2);
border-radius: 16px;
```

### Glass Card (Elevated)

For hero cards with gradients:

```css
background: linear-gradient(135deg, ...);
box-shadow: 0 20px 60px rgba({accent}, 0.25);
border-radius: 24px;
```

### Glass Overlay (Shine Effect)

Top highlight on gradient cards:

```css
/* Pseudo-element */
background: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.15) 0%,
  rgba(255, 255, 255, 0) 50%
);
```

---

## Animation Patterns

### 1. Press Feedback (All Tappable Elements)

```javascript
// React Native Animated
onPressIn:  scale → 0.98 (spring)
onPressOut: scale → 1.0  (spring, friction: 3, tension: 40)
```

### 2. Icon Float (Hero Cards)

Subtle vertical float to draw attention:

```css
@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
duration: 3s;
timing: ease-in-out;
iteration: infinite;
```

### 3. Fire Pulse (Streak Celebration)

```css
@keyframes fire-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
duration: 1s;
timing: ease-in-out;
iteration: infinite;
```

### 4. Sequential Dot Pop (Week Progress)

Staggered entrance for week dots:

```css
@keyframes dot-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
duration: 0.3s;
delay: index * 0.05s; /* 50ms stagger */
```

### 5. Gradient Border Shimmer (Streak Card)

Animated border glow:

```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
duration: 3s;
timing: linear;
iteration: infinite;
```

### 6. Ambient Glow (Background)

Subtle purple glow pulse:

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
duration: 4s;
timing: ease-in-out;
```

### 7. Confetti Burst (Milestone Celebrations)

Triggered on: 7-day, 30-day, 100-day streaks

```
Particles: 50
Colors: [#f97316, #fbbf24, #ef4444, #8b5cf6, #10b981]
Duration: 2s
Spread: Full width
Fall distance: 400px
Rotation: 720deg
```

---

## Component Specifications

### Hero Card

| Property | Value |
|----------|-------|
| Min height | 260px |
| Border radius | 24px |
| Padding | 32px 24px |
| Icon circle | 80px, rgba(255,255,255,0.2) |
| Title | 24px bold white |
| Subtitle | 14px rgba(255,255,255,0.8) |
| Context text | 13px #6b7280, below card |

### Glass Card (Standard)

| Property | Value |
|----------|-------|
| Border radius | 16px |
| Padding | 16px |
| Gap between items | 12px |

### Streak Card

| Property | Value |
|----------|-------|
| Border radius | 20px |
| Padding | 20px |
| Week dot height | 36px |
| Week dot radius | 10px |
| Animated border | 2px gradient |

### Continue Card

| Property | Value |
|----------|-------|
| Border radius | 16px |
| Padding | 16px |
| Icon size | 44px square, 12px radius |
| Arrow | #6b7280, 18px |

### Progress Bar

| Property | Value |
|----------|-------|
| Height | 8px |
| Border radius | 4px |
| Background | rgba(255,255,255,0.1) |
| Fill | linear-gradient(#8b5cf6, #a78bfa) |

---

## Progressive Disclosure States

### New User (0 check-ins)

**Shown:** Hero card only
**Title:** "Welcome! Let's begin"
**Hero subtitle:** "Start your first reflection"
**Hero context:** "Your journey begins here"

### First Done (1 check-in today, <3 total)

**Shown:** Hero + Tip card
**Title:** "Nice start!"
**Tip:** Quick explanation of morning/evening rhythm

### Building (3-7 total check-ins)

**Shown:** Hero + Week Progress
**Title:** "Building momentum"
**Progress:** X/7 days this week

### Established (8+ check-ins OR 5+ day streak)

**Shown:** Hero + Week Progress + Streak (if 3+) + Insights Preview
**Title:** "Keep it going!"
**Full dashboard experience**

### Continue State (Partial completion)

**Shown:** Completed Hero + Continue Card + Progress
**Title:** "Welcome back"
**Continue card:** "Continue evening reflection"

---

## Screen-Specific Applications

### Home Screen

- Ambient glow background (top-left)
- Hero card (primary action)
- Progressive cards based on journey stage
- Bottom tab navigation (unchanged)

### Check-in Screens (Morning/Evening)

- Same glass card treatment for input sections
- ChipSelector uses glass pill style
- Submit button uses gradient (morning/evening)
- Progress indicator at top (glass style)

### Journal Screen

- List items use glass card style
- Filter chips use glass pill style
- Empty state uses centered glass card

### Insights Screen

- Stat cards use glass treatment
- Charts on glass card backgrounds
- Streak visualization matches home

### Profile Screen

- Settings rows use glass card grouping
- Avatar circle with glass border
- Sign out button uses subtle glass

---

## Implementation Notes

### React Native Dependencies

```
expo-linear-gradient    # Gradient backgrounds
expo-blur              # Backdrop blur (iOS native)
react-native-reanimated # Performant animations
lottie-react-native    # Confetti (optional)
```

### Backdrop Blur Fallback

iOS supports `backdropFilter` natively. For Android:

```javascript
// Use solid semi-transparent background as fallback
Platform.select({
  ios: { backdropFilter: 'blur(20px)' },
  android: { backgroundColor: 'rgba(15, 13, 35, 0.95)' }
})
```

### Performance Considerations

1. Use `useNativeDriver: true` for all Animated transforms
2. Limit concurrent animations to 3-4
3. Confetti: Remove particles after animation completes
4. Disable ambient glow on low-end devices (optional)

---

## File References

| Asset | Location |
|-------|----------|
| Mockup | `mockups/mobile/home-polish-mockup.html` |
| Components | `apps/mobile/src/components/` |
| Check-in mockup | `mockups/mobile/check-in-redesign.html` |

---

## Changelog

- 2025-12-16: Initial design system created
- 2025-12-16: Toned down morning gradient (softer amber)
