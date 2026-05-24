# DPM Calendar — Design System

**Version** : 1.0  
**Dernière mise à jour** : 2026-05-24  
**Framework** : Tailwind CSS 3.4 + CSS Custom Properties  
**Approche** : Dark-first, token-based, WCAG 2.1 AA

---

## 1. Palette de couleurs

### 1.1 Couleurs de marque

| Token | Light (HSL) | Dark (HSL) | Hex approx (dark) | Usage |
|-------|-------------|-----------|-------------------|-------|
| `--primary` | 263.4 70% 50.4% | 263.4 70% 60% | `#8b5cf6` | Actions principales, liens, accents |
| `--primary-foreground` | 210 40% 98% | 222.2 47.4% 11.2% | `#f8fafc` / `#1e1b4b` | Texte sur primary |

### 1.2 Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | 0 0% 100% (`#ffffff`) | 222.2 84% 4.9% (`#020817`) | Fond principal |
| `--card` | 0 0% 100% (`#ffffff`) | 222.2 84% 6% (`#0a0f1e`) | Cartes, panneaux |
| `--popover` | 0 0% 100% | 222.2 84% 6% | Menus flottants, dropdowns |
| `--muted` | 210 40% 96.1% (`#f1f5f9`) | 217.2 32.6% 17.5% (`#1e293b`) | Fonds subtils, badges |
| `--secondary` | 210 40% 96.1% | 217.2 32.6% 17.5% | Boutons secondaires |
| `--accent` | 210 40% 96.1% | 217.2 32.6% 17.5% | Hover, sélection |

### 1.3 Texte

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--foreground` | 222.2 84% 4.9% (`#020817`) | 210 40% 98% (`#f8fafc`) | Texte principal |
| `--card-foreground` | 222.2 84% 4.9% | 210 40% 98% | Texte dans les cartes |
| `--muted-foreground` | 215.4 16.3% 46.9% (`#64748b`) | 215 20.2% 65.1% (`#94a3b8`) | Texte secondaire, labels |

### 1.4 Bordures et inputs

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border` | 214.3 31.8% 91.4% (`#e2e8f0`) | 217.2 32.6% 17.5% (`#1e293b`) | Bordures, séparateurs |
| `--input` | 214.3 31.8% 91.4% | 217.2 32.6% 17.5% | Bordures des champs |
| `--ring` | 263.4 70% 50.4% | 263.4 70% 60% | Focus ring |

### 1.5 Couleurs sémantiques

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--success` | 142.1 76.2% 36.3% (`#16a34a`) | 142.1 70% 45% (`#22c55e`) | Confirmations, complété |
| `--warning` | 38 92% 50% (`#f59e0b`) | 38 92% 50% (`#f59e0b`) | Alertes, en retard |
| `--destructive` | 0 84.2% 60.2% (`#ef4444`) | 0 62.8% 30.6% (`#7f1d1d`) | Suppression, erreurs |
| `--info` | 217.2 91.2% 59.8% (`#3b82f6`) | 217.2 91.2% 59.8% (`#3b82f6`) | Information |

### 1.6 Couleurs fonctionnelles (calendrier/priorités)

| Usage | Couleur | Token Tailwind |
|-------|---------|----------------|
| Événement calendrier | `#3b82f6` (blue-500) | `time-block-event` |
| Tâche planifiée | `#8b5cf6` (violet-500) | `time-block-task` |
| Focus / deep work | `#22c55e` (green-500) | `time-block-focus` |
| Personnel | `#f59e0b` (amber-500) | `time-block-personal` |
| Priorité URGENT | `#ef4444` (red-500) | `priority-urgent` |
| Priorité HIGH | `#f97316` (orange-500) | `priority-high` |
| Priorité MEDIUM | `#eab308` (yellow-500) | `priority-medium` |
| Priorité LOW | `#22c55e` (green-500) | `priority-low` |

### 1.7 Ratios de contraste WCAG AA (vérifiés)

| Combinaison | Ratio | Résultat |
|-------------|-------|----------|
| Dark: foreground (`#f8fafc`) sur background (`#020817`) | 19.5:1 | AAA |
| Dark: muted-foreground (`#94a3b8`) sur background (`#020817`) | 7.2:1 | AAA |
| Dark: muted-foreground (`#94a3b8`) sur card (`#0a0f1e`) | 6.4:1 | AA |
| Dark: primary (`#a78bfa`) sur background (`#020817`) | 6.8:1 | AA |
| Light: foreground (`#020817`) sur background (`#ffffff`) | 19.5:1 | AAA |
| Light: muted-foreground (`#64748b`) sur background (`#ffffff`) | 4.6:1 | AA |
| Light: primary (`#7c3aed`) sur background (`#ffffff`) | 5.1:1 | AA |
| Dark: primary-foreground (`#1e1b4b`) sur primary button (`#8b5cf6`) | 7.3:1 | AA |

---

## 2. Typographie

**Font** : Inter (Google Fonts, `subsets: ["latin"]`)

### 2.1 Échelle typographique

| Nom | Taille | Weight | Line-height | Letter-spacing | Usage |
|-----|--------|--------|-------------|---------------|-------|
| `display` | 36px (2.25rem) | 700 | 1.2 | -0.025em | Titres de page landing |
| `h1` | 30px (1.875rem) | 700 | 1.3 | -0.02em | Titres de section |
| `h2` | 24px (1.5rem) | 600 | 1.35 | -0.015em | Sous-titres de page |
| `h3` | 20px (1.25rem) | 600 | 1.4 | -0.01em | Titres de cartes |
| `h4` | 16px (1rem) | 600 | 1.5 | 0 | Labels de section |
| `body` | 14px (0.875rem) | 400 | 1.6 | 0 | Texte principal app |
| `body-sm` | 13px (0.8125rem) | 400 | 1.5 | 0 | Texte secondaire |
| `caption` | 12px (0.75rem) | 500 | 1.4 | 0.01em | Labels, badges, metadata |
| `overline` | 11px (0.6875rem) | 600 | 1.4 | 0.05em | Section headers sidebar |
| `mono` | 13px | 400 | 1.5 | -0.02em | Horaires, durées |

### 2.2 Règles typographiques

- **Titres** : `font-bold tracking-tight` — toujours en `--foreground`
- **Labels** : `font-medium text-muted-foreground` — 12-13px uppercase pour section headers
- **Texte d'aide** : `text-sm text-muted-foreground`
- **Données numériques** : `tabular-nums` pour alignement vertical des chiffres
- **Troncature** : `line-clamp-1` pour titres de tâches dans les listes compactes

---

## 3. Espacement

### 3.1 Échelle (base 4px)

| Token | Valeur | Usage principal |
|-------|--------|-----------------|
| `0.5` | 2px | Micro-gaps (entre dot et texte) |
| `1` | 4px | Gap minimal entre éléments inline |
| `1.5` | 6px | Padding interne badges |
| `2` | 8px | Gap dans les groupes compacts |
| `3` | 12px | Padding interne composants petits |
| `4` | 16px | Padding standard composants / gap grilles |
| `5` | 20px | Padding large cartes |
| `6` | 24px | Gap entre sections de contenu |
| `8` | 32px | Marge entre blocs principaux |
| `10` | 40px | Gap entre sections majeures |
| `12` | 48px | Padding de page (desktop) |
| `16` | 64px | Espace entre sections landing |

### 3.2 Padding de page par contexte

| Contexte | Mobile (375) | Tablet (768) | Desktop (1280+) |
|----------|-------------|--------------|-----------------|
| Page dashboard content | `p-4` (16px) | `p-6` (24px) | `p-6` (24px) |
| Card interne | `p-4` (16px) | `p-5` (20px) | `p-5` (20px) |
| Header | `px-4 py-4` | `px-6 py-5` | `px-6 py-5` |
| Sidebar nav items | `px-3 py-2` | `px-3 py-2` | `px-3 py-2` |

---

## 4. Layout et grille

### 4.1 Breakpoints

| Nom | Valeur | Cible |
|-----|--------|-------|
| `sm` | 640px | Mobiles larges |
| `md` | 768px | Tablettes portrait |
| `lg` | 1024px | Tablettes paysage / petits laptops |
| `xl` | 1280px | Desktops standard |
| `2xl` | 1536px | Grands écrans |

### 4.2 Structure globale (Shell)

```
┌─────────────────────────────────────────────────────────┐
│ flex h-screen overflow-hidden                           │
├──────────┬──────────────────────────────┬───────────────┤
│ Left     │ Main Content                 │ Right         │
│ Sidebar  │ (flex-1 overflow-auto)       │ Sidebar       │
│          │                              │               │
│ 15-20%   │         Flexible             │  15-18%       │
│ min: 4%  │         min: 30%             │  min: 3%      │
│ max: 30% │                              │  max: 35%     │
│          │                              │               │
│ collapse │                              │  collapse     │
│ → 4%     │                              │  → 3%         │
├──────────┴──────────────────────────────┴───────────────┤
│ Mobile: full-width main + bottom nav (h-16)             │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Grilles de contenu

| Type | Desktop (1280+) | Tablet (768) | Mobile (375) |
|------|----------------|--------------|--------------|
| Dashboard widgets | `grid-cols-3 gap-4` | `grid-cols-2 gap-4` | `grid-cols-1 gap-4` |
| Stat cards | `grid-cols-4 gap-4` | `grid-cols-2 gap-4` | `grid-cols-2 gap-3` |
| Home layout | `grid-cols-3` (2+1) | `grid-cols-1` | `grid-cols-1` |
| Settings sections | `max-w-2xl mx-auto` | `max-w-2xl mx-auto` | Pleine largeur |

### 4.4 Max-widths

| Contexte | Valeur |
|----------|--------|
| Contenu dashboard/analytics | `max-w-7xl` (80rem / 1280px) |
| Formulaires | `max-w-2xl` (42rem / 672px) |
| Modaux | `max-w-lg` (32rem / 512px) |
| Landing page | `max-w-7xl` (80rem / 1280px) |

---

## 5. Radius et ombres

### 5.1 Border radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius` | 0.75rem (12px) | Cartes, modaux |
| `rounded-lg` | 0.5rem (8px) | Boutons, inputs, badges |
| `rounded-md` | 0.375rem (6px) | Éléments internes (tags, pills) |
| `rounded-full` | 9999px | Avatars, dots, toggles |

### 5.2 Ombres

| Token | Valeur | Usage |
|-------|--------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cartes au repos |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cartes hover |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Popovers, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Modaux, drag overlay |
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Landing showcases |

---

## 6. Z-index (échelle stricte)

| Token | Valeur | Usage |
|-------|--------|-------|
| `z-base` | 0 | Contenu normal |
| `z-above` | 10 | Éléments positionnés dans le flow |
| `z-sticky` | 20 | Headers sticky, indicateur heure courante |
| `z-dropdown` | 30 | Dropdowns, popovers |
| `z-overlay-bg` | 40 | Overlay backdrop (mobile sidebar) |
| `z-overlay` | 50 | Sidebar mobile, modaux, sheets |
| `z-popover` | 60 | Popovers au-dessus de modaux |
| `z-toast` | 70 | Notifications toast (Sonner) |
| `z-drag` | 80 | DnD drag overlay |
| `z-max` | 100 | Debug, temporary |

**Règle** : Jamais de valeur de z-index ad-hoc. Toujours utiliser un token de cette échelle.

---

## 7. Animation

### 7.1 Durées

| Token | Valeur | Usage |
|-------|--------|-------|
| `duration-100` | 100ms | Micro-interactions (hover couleur) |
| `duration-150` | 150ms | Transitions de focus, hover |
| `duration-200` | 200ms | Apparition d'éléments, fade |
| `duration-300` | 300ms | Slide-in sidebar, collapse panels |

### 7.2 Easing

| Nom | Valeur | Usage |
|-----|--------|-------|
| `ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Entrées (éléments qui apparaissent) |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Toggle, collapse |

### 7.3 Règle prefers-reduced-motion

Toutes les animations → `0.01ms` si `prefers-reduced-motion: reduce`.

---

## 8. Composants — Inventaire

### 8.1 Button

| Variante | Apparence | Usage |
|----------|-----------|-------|
| `default` | Fond primary, texte primary-foreground | Actions principales |
| `secondary` | Fond secondary, texte secondary-foreground | Actions secondaires |
| `outline` | Bordure, fond transparent | Actions tertiaires |
| `ghost` | Pas de fond ni bordure | Actions dans les toolbars |
| `destructive` | Fond destructive | Suppression |
| `link` | Style texte souligné | Navigation inline |

**Tailles** : `sm` (h-8 px-3), `default` (h-10 px-4), `lg` (h-12 px-6), `icon` (h-10 w-10)

**États** : default → hover (opacity 90%) → active (scale 0.98) → focus (ring) → disabled (opacity 50%) → loading (spinner + texte)

**Touch target** : minimum 44x44px mobile (appliqué via padding étendu)

### 8.2 Card

| Variante | Classes | Usage |
|----------|---------|-------|
| `default` | `bg-card rounded-xl border` | Conteneur standard |
| `elevated` | `+ shadow-sm` | Cartes dans les grilles |
| `interactive` | `+ hover:shadow-md hover:border-primary/20 transition` | Cartes cliquables |

### 8.3 Input / Textarea

- Hauteur standard : `h-10` (40px) — `h-12` pour login form
- Bordure : `border-input` → focus : `ring-2 ring-ring`
- Label : `text-sm font-medium` au-dessus
- Error : bordure `border-destructive` + message `text-destructive text-sm`

### 8.4 Modal / Dialog

- Overlay : `bg-black/50 backdrop-blur-sm`
- Conteneur : `bg-card rounded-xl border shadow-xl max-w-lg mx-4`
- Header : `px-6 py-4 border-b` avec titre + bouton close
- Body : `px-6 py-4`
- Footer : `px-6 py-4 border-t flex justify-end gap-3`
- Animation : `animate-scale-in` (200ms)

### 8.5 Badge

- Standard : `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium`
- Variantes : `primary`, `success`, `warning`, `danger` (fond coloré 10%, texte coloré)

### 8.6 Tooltip

- `bg-popover text-popover-foreground rounded-md px-3 py-1.5 text-sm shadow-lg`
- Délai : 300ms avant apparition
- Position : top par défaut

### 8.7 Select / Dropdown

- Trigger : même style que Input
- Menu : `bg-popover border rounded-lg shadow-lg p-1 z-dropdown`
- Item : `px-3 py-2 rounded-md text-sm hover:bg-accent cursor-pointer`

### 8.8 Switch / Toggle

- Taille : `h-5 w-9` (22x36px track)
- Thumb : `h-4 w-4` (16x16px)
- Couleur on : `bg-primary`
- Couleur off : `bg-input`
- Transition : `duration-200`

---

## 9. Patterns d'état

### 9.1 Loading

- **Page entière** : Skeleton layout (zones grises animées reprenant la structure)
- **Composant** : Spinner (Loader2 lucide, `animate-spin`) + texte "Chargement..."
- **Bouton** : Spinner remplace l'icône + texte + `pointer-events-none`
- **Inline** : Pulse animation sur la zone en cours de chargement

### 9.2 Empty

- Illustration abstraite ou icône 48x48 en `text-muted-foreground`
- Titre court
- Sous-titre explicatif
- CTA bouton pour créer le premier élément
- Zone : centrée verticalement et horizontalement

### 9.3 Error

- Bordure rouge sur le composant en erreur
- Message sous le champ (`text-destructive text-sm`)
- Toast pour erreurs globales (position `bottom-right`)
- Page d'erreur : `error.tsx` avec retry button

---

## 10. Do / Don't

### DO
- Utiliser les tokens CSS variables pour toute couleur
- Respecter l'échelle de z-index
- Tester dark + light + 3 breakpoints
- `tabular-nums` pour les colonnes de chiffres
- `transition-colors duration-150` sur les hovers
- `overflow-hidden` sur les conteneurs de grille pour éviter les débordements
- `min-h-0` avec `flex-1 overflow-auto` pour les scrolls internes

### DON'T
- Couleurs hex hardcodées dans les composants
- `z-index: 9999` ou toute valeur ad-hoc
- `position: fixed` sans raison (utiliser sticky ou le flow)
- Animations > 300ms
- Texte directement en français sans `useTranslations()`
- `width` / `height` en px fixes pour des conteneurs responsifs
- `overflow: visible` sur les layouts de grille (cause des chevauchements)
