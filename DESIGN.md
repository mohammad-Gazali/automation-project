---
name: Technical Precision Light
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#005474'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e95'
  on-tertiary-container: '#caeaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin: 32px
---

## Brand & Style

The design system focuses on clinical clarity, engineering-grade accuracy, and high-performance utility. It is designed for users who require information density without cognitive overload. The brand personality is intellectual, transparent, and rigorous. 

The aesthetic leverages a **High-Contrast Minimalist** style with a "blue-lab" influence. It utilizes stark white surfaces and rhythmic structural lines to evoke the feeling of a blueprint or a high-end technical instrument. Every element is intentional, stripping away decorative fluff in favor of functional aesthetics and vibrant focal points.

## Colors

The palette is anchored by a pure white background to maximize readability and "air." The primary accent is a vibrant, high-energy blue used sparingly for interactive elements and critical paths.

- **Primary:** An electric blue that signifies action and precision.
- **Secondary/Neutral:** A deep slate used for primary text and structural borders to provide weight without the harshness of pure black.
- **Surface Tiers:** Subtle shifts from white to off-white distinguish between the canvas and nested containers.
- **Status:** Standardized semantic colors (Green for Success, Red for Error) are desaturated slightly to maintain the technical, professional tone.

## Typography

This design system exclusively uses **Space Grotesk** to maintain a cohesive, technical identity across all levels of the hierarchy. 

Headlines utilize tight letter-spacing and heavy weights to command attention. Body copy is set with generous line heights to ensure long-form data remains digestible. For metadata and technical specs, use the "label-caps" style to create a clear visual distinction from standard prose. Vertical rhythm should be strictly maintained to reinforce the grid-based feel of the interface.

## Layout & Spacing

The system follows a **Fixed-Fluid Hybrid Grid**. Content is housed in a 12-column grid with a maximum width of 1440px for desktop, centering the focus on the data. 

- **The 4px Rule:** All spacing, padding, and margins must be multiples of 4px to ensure mathematical alignment.
- **Data Density:** Use 16px (md) padding for standard cards, but 8px (sm) for dense data tables or sidebars.
- **Negative Space:** Use 40px (xl) or greater to separate distinct sections or "modules" of the application to prevent visual clutter.

## Elevation & Depth

Depth is conveyed through **Low-Contrast Outlines** and **Tonal Layering** rather than heavy shadows.

- **Level 0 (Canvas):** Pure white background.
- **Level 1 (Cards/Panels):** Surface-colored containers (#F8FAFC) with a 1px slate border (#E2E8F0).
- **Level 2 (Modals/Overlays):** White surfaces with a very subtle, sharp shadow (0px 4px 12px, 5% opacity slate) to differentiate from the background.
- **Interactive state:** On hover, borders should transition from slate to the primary blue to provide immediate, precise feedback.

## Shapes

To reinforce the "Technical Precision" narrative, the design system utilizes **Sharp (0px)** corners for all primary UI elements. 

The absence of roundedness emphasizes a rigid, engineered structure. This applies to buttons, input fields, cards, and dropdown menus. The only exception is for circular avatars or status indicators (dots), which provide a soft counterpoint to the otherwise rectangular ecosystem.

## Components

- **Buttons:** Primary buttons are solid Blue (#0052FF) with white text. Secondary buttons use a 1px Slate border with a white background. All buttons are sharp-edged.
- **Input Fields:** Use a 1px Slate border that turns Blue on focus. Labels should be in the "label-caps" typography style, positioned strictly above the field.
- **Chips:** Small, rectangular tags with a light slate background and Slate text. Used for status or categorization without drawing attention away from primary actions.
- **Data Tables:** High-density layouts with horizontal dividers only. Header rows should use a light grey tint and bolded "mono-data" typography.
- **Cards:** White or light-surface containers with a subtle 1px border. Avoid inner shadows. Group related information with internal 1px dividers.
- **Icons:** Use thin-stroke, geometric icons (2px stroke width). Icons should be monochromatic (Slate) unless they are being used to indicate a specific active state in Blue.