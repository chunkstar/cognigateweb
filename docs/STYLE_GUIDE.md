# Cognigate Website Style Guide

**Version**: 1.0
**Last Updated**: November 23, 2025
**Brand**: Cognigate - AI Gateway with Budget Protection

---

## 🎨 Color Palette

### Primary Colors
```css
--primary: #06b6d4        /* Cyan - Main brand color */
--primary-light: #22d3ee  /* Light cyan - Hover states */
--primary-dark: #0891b2   /* Dark cyan - Active states */
```

### Secondary Colors
```css
--secondary: #10b981      /* Emerald green - Success, accents */
--accent: #8b5cf6         /* Purple/violet - Highlights */
```

### Dark Theme Background
```css
--dark: #0a0a0a          /* Primary background */
--dark-2: #111111        /* Secondary background (sections) */
--dark-3: #1a1a1a        /* Tertiary background (cards, code blocks) */
--dark-4: #232323        /* Quaternary background */
```

### Neutral Grays
```css
--gray-50: #fafafa       /* Lightest gray */
--gray-100: #f4f4f5
--gray-200: #e4e4e7
--gray-300: #d4d4d8
--gray-600: #52525b
--gray-700: #3f3f46
--gray-800: #27272a
--gray-900: #18181b      /* Darkest gray */
```

### Text Colors
```css
--text-primary: #ffffff    /* Primary text (headings, body) */
--text-secondary: #a1a1aa  /* Secondary text (descriptions, captions) */
```

### Usage Guidelines
- **Backgrounds**: Use dark colors (#0a0a0a to #232323) for sections and containers
- **Text**: White (#ffffff) for headings, gray (#a1a1aa) for body text
- **Accents**: Cyan gradient for CTAs, emerald for success states
- **Borders**: Always use `rgba(255, 255, 255, 0.05)` for subtle borders

---

## 🔤 Typography

### Font Families
```css
/* UI/Interface Text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Code/Monospace */
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

**Google Fonts Import**:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Font Sizes & Hierarchy

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Hero H1 | 5rem (80px) | 900 | Main landing page headline |
| Section Title | 3.5rem (56px) | 800 | Section headings |
| Feature Title | 1.75rem (28px) | 700 | Card/feature headings |
| Body Large | 1.5rem (24px) | 400 | Hero subheading |
| Body | 1.125rem (18px) | 500 | Standard text |
| Body Small | 1.05rem (17px) | 400 | Card descriptions |
| Caption | 0.95rem (15px) | 500 | Nav links, labels |
| Tiny | 0.9rem (14px) | 400 | Fine print |

### Font Weights
- **300**: Light (rare, subtle text)
- **400**: Regular (body text)
- **500**: Medium (nav links, labels)
- **600**: Semibold (buttons, emphasis)
- **700**: Bold (feature titles)
- **800**: Extrabold (section titles)
- **900**: Black (hero headlines)

### Text Styles
```css
/* Gradient text effect */
.gradient-text {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
    background-size: 200% 200%;
}

/* Letter spacing */
letter-spacing: -0.02em; /* For large headings */
```

---

## 📐 Spacing & Layout

### Container
```css
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
}
```

### Section Padding
```css
section {
    padding: 8rem 0; /* 128px top/bottom */
}
```

### Grid Patterns
```css
/* Features Grid */
grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
gap: 2rem;

/* Stats Grid */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 4rem;

/* Providers Grid */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 3rem;
```

### Spacing Scale
- **0.5rem** (8px): Tiny gaps (icon-text)
- **1rem** (16px): Small gaps
- **1.5rem** (24px): Medium gaps
- **2rem** (32px): Large gaps (grid, cards)
- **3rem** (48px): XL gaps (sections)
- **4rem** (64px): 2XL gaps (major sections)
- **8rem** (128px): 3XL gaps (section padding)

---

## 🎯 Buttons

### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    padding: 1.125rem 2.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    border-radius: 0.75rem;
    border: 2px solid transparent;
    box-shadow: 0 10px 30px -10px rgba(6, 182, 212, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px -10px rgba(6, 182, 212, 0.6);
}
```

### Secondary Button
```css
.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border: 2px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 1.125rem 2.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    border-radius: 0.75rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}
```

### Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 0.75rem 1.5rem | 0.95rem |
| Medium | 1rem 2rem | 1rem |
| Large | 1.125rem 2.5rem | 1.125rem |

---

## 🃏 Cards

### Feature Card
```css
.feature-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    padding: 2.5rem;
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    opacity: 0;
    transition: opacity 0.4s;
}

.feature-card:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(6, 182, 212, 0.3);
    box-shadow: 0 20px 60px -15px rgba(6, 182, 212, 0.3);
}

.feature-card:hover::before {
    opacity: 1;
}
```

### Pricing Card (Same base style)
```css
.pricing-card {
    /* Same as feature-card */
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    padding: 2.5rem;
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.pricing-card.popular {
    border: 2px solid rgba(6, 182, 212, 0.5);
    background: rgba(255, 255, 255, 0.05);
    transform: scale(1.05);
}
```

### Provider Card
```css
.provider-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;
}

.provider-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(6, 182, 212, 0.3);
}
```

---

## ✨ Animations & Effects

### Animated Gradient Background
```css
.gradient-bg::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
    animation: gradientMove 20s ease infinite;
    z-index: 0;
}

@keyframes gradientMove {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(-50px, -50px) rotate(180deg); }
}
```

### Hover Transforms
- **Cards**: `translateY(-8px)` with 0.4s cubic-bezier
- **Buttons**: `translateY(-2px)` with 0.3s cubic-bezier
- **Nav Links**: Underline animation (0 → 100% width)

### Glassmorphism Effect
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.05);
```

### Gradient Shift Animation
```css
@keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
```

### Box Shadows
```css
/* Primary button */
box-shadow: 0 10px 30px -10px rgba(6, 182, 212, 0.5);

/* Card hover */
box-shadow: 0 20px 60px -15px rgba(6, 182, 212, 0.3);

/* Popular card */
box-shadow: 0 30px 80px -20px rgba(6, 182, 212, 0.4);
```

---

## 🧩 Common Components

### Header/Navigation
```css
header {
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 1.25rem 0;
    position: sticky;
    top: 0;
    z-index: 1000;
}
```

### Logo
```css
.logo {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

### Badge/Tag
```css
.badge {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
}
```

### Popular Badge (for pricing)
```css
.popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    padding: 6px 20px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (phones, 640px and up) */
@media (max-width: 640px) {
    .hero h1 { font-size: 3rem; }
    .section-title { font-size: 2.5rem; }
    section { padding: 4rem 0; }
}

/* Medium devices (tablets, 768px and up) */
@media (max-width: 768px) {
    nav { flex-direction: column; gap: 1rem; }
    .features-grid { grid-template-columns: 1fr; }
}

/* Large devices (desktops, 1024px and up) */
@media (min-width: 1024px) {
    /* Default styles apply */
}

/* Extra large devices (large desktops, 1280px and up) */
@media (min-width: 1280px) {
    .container { max-width: 1400px; }
}
```

---

## 🎨 Logo

### Official Logo
The Cognigate logo features:
- **Clear sphere** with gradient (cyan to emerald to purple)
- **Neural brain** above representing AI intelligence
- **Gate structure** below representing gateway/control
- **Faded "AI" text** in the center

### Logo Files
- `logo.svg` - 48x48px logo for navigation (32px display size)
- `favicon.svg` - 64x64px logo for browser favicon

### Logo Usage
```html
<!-- Navigation logo -->
<img src="logo.svg" alt="Cognigate Logo" width="32" height="32"
     style="filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.3));">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">
```

### Logo Guidelines
- **DO** use the cyan drop-shadow for glow effect
- **DO** maintain aspect ratio (always square)
- **DON'T** change the colors (cyan/emerald gradient is brand)
- **DON'T** use on light backgrounds (designed for dark theme)

## 🎨 Icon System

- **Size**: 3rem (48px) for feature icons
- **Color**: Use gradient or inherit from parent
- **Unicode/Emoji**: Preferred for simplicity
- Examples: 🚀 🎯 💰 ⚡ 🔒 📊

---

## 🧪 Code Blocks

```css
.code-block {
    background: var(--dark-3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    padding: 3rem;
    overflow-x: auto;
    position: relative;
}

.code-block::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, rgba(6, 182, 212, 0.05), transparent);
    border-radius: 1rem 1rem 0 0;
}

/* Syntax Highlighting */
.code-comment { color: #6a9955; }
.code-keyword { color: #569cd6; }
.code-string { color: #ce9178; }
.code-function { color: #dcdcaa; }
.code-number { color: #b5cea8; }
.code-const { color: #4fc1ff; }
```

---

## 📋 Best Practices

### DO ✅
- Use dark theme consistently across all pages
- Apply glassmorphism (backdrop-filter) to cards and modals
- Use gradient text for emphasis (headings, CTAs)
- Add subtle hover animations (translateY, shadow)
- Keep borders at 1px with low opacity (0.05)
- Use Inter for UI, JetBrains Mono for code
- Apply 0.75rem border radius for buttons, 1.5rem for cards

### DON'T ❌
- Use pure white backgrounds (always use dark colors)
- Use harsh borders (always use rgba with low opacity)
- Skip hover states (all interactive elements need feedback)
- Use default system fonts (always load Inter)
- Forget backdrop-filter for glassmorphism effect
- Use linear gradients without smooth transitions
- Mix different animation timing functions

---

## 🚀 Quick Start Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Cognigate</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #06b6d4;
            --primary-light: #22d3ee;
            --primary-dark: #0891b2;
            --secondary: #10b981;
            --accent: #8b5cf6;
            --dark: #0a0a0a;
            --dark-2: #111111;
            --dark-3: #1a1a1a;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--dark);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        /* Add more styles as needed */
    </style>
</head>
<body>
    <!-- Your content here -->
</body>
</html>
```

---

## 📦 Asset Checklist

For every new page, ensure:
- [ ] Google Fonts (Inter + JetBrains Mono) loaded
- [ ] CSS variables defined in :root
- [ ] Dark theme background applied
- [ ] Container max-width set to 1400px
- [ ] Buttons have gradient + hover effects
- [ ] Cards have glassmorphism + hover animations
- [ ] Navigation is sticky with backdrop-filter
- [ ] All text uses correct font weights
- [ ] Spacing follows 8rem → 4rem → 2rem → 1rem scale

---

**Maintained by**: Cognigate Team
**Contact**: For questions about this style guide, open an issue on GitHub
**Version History**:
- v1.0 (Nov 23, 2025): Initial style guide creation
