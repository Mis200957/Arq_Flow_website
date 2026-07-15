---
name: Architectural Monochrome
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1e'
  on-surface-variant: '#444748'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5d5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ec'
  on-secondary-container: '#63646c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1e'
  on-tertiary-container: '#838487'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#e2e2e5'
  tertiary-fixed-dim: '#c6c6c9'
  on-tertiary-fixed: '#1a1c1e'
  on-tertiary-fixed-variant: '#454749'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e6'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
This design system embodies a rigorous, architectural approach to minimalism. By stripping away all hues in favor of a strictly monochrome spectrum, the focus shifts entirely to form, proportion, and structural hierarchy. The brand personality is disciplined, premium, and sophisticated, targeting professional environments where clarity and authority are paramount.

The aesthetic leans into **Minimalism** with a nod to **Corporate Modernism**. It utilizes expansive white space to frame content as "art," using varying shades of gray to denote functional zones rather than decorative flair. The emotional response is one of calm, rhythmic precision and unwavering reliability.

## Colors
The palette is strictly achromatic. It relies on a high-contrast relationship between deep charcoal and bright white to ensure maximum readability and a premium feel.

- **Primary:** Deep Onyx (#121212), used for primary actions, headlines, and heavy structural elements.
- **Secondary:** Zinc Gray (#71717A), used for secondary information, icons, and inactive states.
- **Tertiary:** Platinum Soft (#E4E4E7), used for borders, dividers, and subtle background containment.
- **Neutral:** Pure White (#FFFFFF) and Off-White (#FAFAFA) for surfaces and canvas backgrounds.

Functional colors (Success, Warning, Error) should be handled via heavy iconography and distinct grayscale patterns or weight changes rather than introducing new hues, maintaining the strict monochrome constraint.

## Typography
Manrope is the sole typeface, chosen for its geometric balance and contemporary feel. To compensate for the lack of color, typography utilizes aggressive weight distribution and scale to establish hierarchy.

- **Display & Headlines:** Set in ExtraBold or Bold with tight letter spacing for a high-impact, editorial look.
- **Body Text:** Set with generous line heights to ensure long-form readability against high-contrast backgrounds.
- **Labels:** Small-scale labels utilize uppercase styling and increased tracking to provide a technical, architectural feel to UI controls.

## Layout & Spacing
The layout follows a strict 8px grid system. The philosophy is based on a **Fixed Grid** for desktop to maintain a controlled, gallery-like presentation of information, while transitioning to a **Fluid Grid** for mobile.

- **Desktop:** 12-column grid with wide 64px outer margins to create a sense of exclusivity and focus.
- **Tablet:** 8-column grid with 32px margins.
- **Mobile:** 4-column grid with 16px margins. 

Internal spacing should be generous; use `lg` and `xl` units to separate distinct content sections, preventing the monochrome interface from feeling cluttered or cramped.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows. 

- **Surfaces:** Use `#FFFFFF` for the base canvas. Use `#FAFAFA` for container backgrounds to create a subtle lift.
- **Borders:** Instead of shadows, use 1px solid borders in `#E4E4E7` or `#F4F4F5` to define boundaries.
- **Interactive Depth:** When an element is pressed or active, it should transition from a light gray background to a deep charcoal background, providing a clear "physical" state change through value inversion.
- **Shadows:** If absolutely required for high-floating elements (like modals), use a very faint, non-tilted, neutral gray shadow: `0px 10px 30px rgba(0,0,0,0.05)`.

## Shapes
The shape language is "Rounded," balancing the severity of the monochrome palette with approachable geometry. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Large Containers:** Cards and modals use a 1rem (16px) radius to create a distinct visual container.
- **Interactive Accents:** Small UI elements like tags or badges may use the "Pill" style (full rounding) to differentiate them from functional inputs.

## Components
- **Buttons:** Primary buttons are solid `#121212` with `#FFFFFF` text. Secondary buttons are outlined with `#E4E4E7` borders and `#121212` text. Tertiary buttons are text-only with a heavy underline on hover.
- **Inputs:** Fields use a light `#FAFAFA` background with a bottom-border-only or subtle 1px border. Focus states are indicated by a weight increase in the border or a shift to a solid black border.
- **Cards:** Cards should be minimal, using a 1px border of `#E4E4E7`. Avoid drop shadows; use white backgrounds against the `#FAFAFA` canvas to indicate hierarchy.
- **Lists:** Use 1px horizontal dividers in `#F4F4F5`. Iconography within lists must be uniform in weight (Regular or Medium) and strictly monochromatic.
- **Chips/Badges:** Use a light gray background (`#F4F4F5`) with `label-caps` typography. For "Active" status, invert the colors to white text on a black background.
- **Progress Indicators:** Use solid black for filled states and light gray for unfilled tracks, maintaining the high-contrast architectural look.