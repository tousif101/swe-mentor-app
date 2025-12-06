# Liquid Glass UI Research - 2025

> Research compiled for SWE Mentor App UI design

---

## iOS 26 Liquid Glass

### What is Liquid Glass?
Apple's new design material for iOS 26+, giving UI elements a translucent, glass-like appearance that reflects and refracts surroundings in real time. It's a dynamic evolution of the classic blur effect first seen in iOS 7.

### Key Characteristics
- Translucent, frosted glass appearance
- Real-time blur and refraction
- Elements can **morph and merge** when close together
- Highlights underlying content without obscuring it
- GPU-accelerated for smooth performance

---

## React Native Libraries

### 1. @callstack/liquid-glass (Official)
**The go-to library for iOS liquid glass in React Native**

```bash
npm install @callstack/liquid-glass
```

**Requirements:**
- Xcode 26+
- React Native 0.80+
- Not supported in Expo Go

**Components:**
- `LiquidGlassView` - Individual glass elements
- `LiquidGlassContainerView` - Wrapper for merging glass elements

**Effect Modes:**
| Mode | Description |
|------|-------------|
| `clear` | More transparent glass effect |
| `regular` | Standard glass blur effect |
| `none` | No glass effect (transparent) |

**Merging Example:**
```jsx
<LiquidGlassContainerView>
  <LiquidGlassView mode="regular">
    <Button title="Action 1" />
  </LiquidGlassView>
  <LiquidGlassView mode="regular">
    <Button title="Action 2" />
  </LiquidGlassView>
</LiquidGlassContainerView>
```

**Fallback:**
```jsx
import { isLiquidGlassSupported } from '@callstack/liquid-glass';

// Auto-renders opaque View on Android/older iOS
// Use isLiquidGlassSupported for custom fallbacks
```

**Links:**
- [GitHub](https://github.com/callstack/liquid-glass)
- [Blog Post](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native)

---

### 2. expo-liquid-glass-view
**SwiftUI integration for Expo projects**

**Blur Material Types:**
- `clear`
- `tint`
- `regular`
- `interactive`
- `identity`

**Link:** [Expo Liquid Glass View](https://reactscript.com/liquid-glass-expo-view/)

---

### 3. @metafic-co/react-native-glassmorphism
**Cross-platform glassmorphism (works on Android too)**

```bash
npm install @metafic-co/react-native-glassmorphism
```

Wrapper around `@react-native-community/blur` for glassmorphism design.

**Link:** [NPM Package](https://www.npmjs.com/package/@metafic-co/react-native-glassmorphism)

---

### 4. @react-native-community/blur
**Foundation blur library**

```bash
npm install @react-native-community/blur
```

Base library for implementing blur effects. Required by many glassmorphism libraries.

---

### 5. React Native Skia (Shopify)
**Advanced graphics with blur support**

Excellent API for blur effects with high performance. Good for custom glass implementations.

---

## Bottom Navigation with Liquid Glass

### react-native-bottom-tabs
**Required for native iOS tabs with liquid glass**

React Navigation uses JS tabs that don't get the liquid glass effect. Use this library instead:

```bash
npm install react-native-bottom-tabs
```

**Link:** [GitHub](https://github.com/okwasniewski/react-native-bottom-tabs)

---

## Android - Material 3 Expressive

### Overview
Google's next evolution of Material Design, arriving with Android 16 (September 2025+).

### Key Features

#### Motion Physics System
- Spatial springs for natural animations
- UI elements react playfully to touch
- Haptic feedback integration
- Smooth, predictable transitions

#### Visual Design
- **Vibrant blurred backgrounds** (not solid colors)
- **35 new shapes** with shape-morph animations
- Dynamic transitions (square → circle)
- Layered transparency effects

#### New Components (15 total)
- Button groups
- FAB menu
- Loading indicators
- Split button
- Toolbars

#### Typography
- Variable font support
- Emotional state expression
- Auto-adjusting readability
- Bold editorial layouts

### React Native Implementation

#### React Native Paper v5+
```bash
npm install react-native-paper
```

Full Material You (MD3) support with both Material Design 2 and 3.

**Link:** [React Native Paper](https://reactnativepaper.com/)

#### @yetaanother/react-native-material-you
```bash
npm install @yetaanother/react-native-material-you
```

Google Material 3 design components.

**Link:** [GitHub](https://github.com/yetaanother/react-native-material-you)

---

## Icon Libraries

### Comparison Table

| Library | Icons | Best For | Notes |
|---------|-------|----------|-------|
| [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) | 10,000+ | General use | Most popular, 15+ sets |
| [expo-symbols](https://docs.expo.dev/versions/latest/sdk/symbols/) | SF Symbols | iOS native look | Android fallback available |
| [Lucide](https://lucide.dev/) | 1,500+ | Clean aesthetic | Community-driven |
| [Tabler Icons](https://tabler.io/icons) | 5,500+ | Fast setup | No react-native-svg needed |
| [Lineicons](https://lineicons.com/) | 30,000+ | Variety | 4,000 free icons |
| [Iconoir](https://iconoir.com/) | 1,300+ | Modern minimal | 24x24 grid |

### SF Symbols (iOS Native)
```bash
npx expo install expo-symbols
```

Access Apple's SF Symbols library with Android/Web fallback.

---

## CSS Techniques for Web Mockups

### Glass Effect
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

### Layered Glass (iOS style)
```css
.liquid-glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(40px) saturate(150%);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
```

### Spring Animation (CSS approximation)
```css
.spring-transition {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Shape Morphing
```css
.morph {
  transition: border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.morph:hover {
  border-radius: 50%;
}
```

---

## Performance Considerations

### GPU Usage
Liquid Glass uses real-time, GPU-accelerated blur effects:
- Efficient for a few elements
- Avoid stacking many translucent views
- Don't animate excessively
- Modern GPUs (A17 Pro, Snapdragon 8 Gen 3) handle it well

### Fallbacks
Always provide fallbacks for:
- Older iOS versions (< iOS 26)
- Android devices
- Low-powered devices
- Web browsers with limited backdrop-filter support

---

## Resources

### Official Documentation
- [Apple Liquid Glass](https://developer.apple.com/design/)
- [Material 3 Expressive](https://m3.material.io/)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)

### Tutorials
- [Callstack Liquid Glass Guide](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native)
- [Expo Liquid Glass + SwiftUI](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- [Cygnis Implementation Guide](https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/)

### Design Resources
- [Material Theme Builder](https://m3.material.io/theme-builder)
- [SF Symbols App](https://developer.apple.com/sf-symbols/)
- [Liquid Glass Resources](https://www.liquidglassresources.com/)

---

*Last updated: December 2025*
