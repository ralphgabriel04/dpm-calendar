# Tailwind Tokens — DPM Calendar

Proposition de configuration prête à intégrer dans `tailwind.config.ts`.

---

## Extension theme

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // === COLORS (via CSS variables) ===
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic (extend existing)
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },

      // === BORDER RADIUS ===
      borderRadius: {
        lg: "var(--radius)",        // 12px — cards, modals
        md: "calc(var(--radius) - 4px)", // 8px — buttons, inputs
        sm: "calc(var(--radius) - 6px)", // 6px — internal elements
      },

      // === Z-INDEX (strict scale) ===
      zIndex: {
        base: "0",
        above: "10",
        sticky: "20",
        dropdown: "30",
        "overlay-bg": "40",
        overlay: "50",
        popover: "60",
        toast: "70",
        drag: "80",
        max: "100",
      },

      // === FONT SIZE (app-specific scale) ===
      fontSize: {
        "display": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h1": ["1.875rem", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["1.5rem", { lineHeight: "1.35", letterSpacing: "-0.015em", fontWeight: "600" }],
        "h3": ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h4": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body": ["0.875rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
        "overline": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      // === SPACING (already 4px-based in Tailwind, no override needed) ===

      // === MAX WIDTH ===
      maxWidth: {
        "content": "80rem",  // 1280px — dashboard content
        "form": "42rem",     // 672px — forms, settings
        "modal": "32rem",    // 512px — modals
        "modal-lg": "42rem", // 672px — large modals
      },

      // === ANIMATION ===
      keyframes: {
        "animate-in": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "in": "animate-in 200ms ease-out",
        "scale-in": "scale-in 200ms ease-out",
        "slide-left": "slide-in-left 300ms ease-out",
        "slide-right": "slide-in-right 300ms ease-out",
        "gradient": "gradient-shift 8s ease infinite",
      },

      // === TRANSITION DURATION ===
      transitionDuration: {
        "fast": "100ms",
        "normal": "150ms",
        "medium": "200ms",
        "slow": "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## CSS Variables (globals.css)

Déjà en place — voici les ajouts recommandés :

```css
@layer base {
  :root {
    /* Existing variables... */

    /* Z-index scale (for reference in non-Tailwind contexts) */
    --z-base: 0;
    --z-above: 10;
    --z-sticky: 20;
    --z-dropdown: 30;
    --z-overlay-bg: 40;
    --z-overlay: 50;
    --z-popover: 60;
    --z-toast: 70;
    --z-drag: 80;
    --z-max: 100;

    /* Spacing tokens (for reference) */
    --space-page: 1.5rem;  /* p-6 */
    --space-card: 1.25rem; /* p-5 */
    --space-section: 1.5rem; /* gap-6 / space-y-6 */
  }

  @media (max-width: 767px) {
    :root {
      --space-page: 1rem;   /* p-4 */
      --space-card: 1rem;   /* p-4 */
    }
  }
}
```

---

## Migration notes

### Ce qui est déjà conforme dans le code actuel :
- Colors via CSS variables ✓
- Border radius via `--radius` ✓
- Dark mode via `.dark` class ✓
- Spacing base 4px (Tailwind default) ✓

### Ce qui nécessite un ajout :
1. **z-index tokens** : Remplacer les `z-40`, `z-50` ad-hoc par les tokens nommés
2. **fontSize scale** : Actuellement non standardisée — les pages utilisent des tailles variées
3. **maxWidth tokens** : Remplacer les `max-w-7xl` littéraux par `max-w-content` sémantique
4. **Animation tokens** : Centraliser les keyframes dupliquées entre globals.css et composants

### Effort estimé : 
- Ajout des tokens dans tailwind.config : ~30 min
- Migration des z-index existants : ~1h (search/replace guidé)
- Aucun changement visuel à la migration (backward compatible)
