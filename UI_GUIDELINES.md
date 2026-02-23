UI & Design System Guidelines: zZLean
🎨 Brand Identity & Color Palette
All UI components must strictly adhere to the following color tokens to maintain a "Hyper-Minimalist" aesthetic.

Primary (Action): #E4FF50 (Lime Yellow) — Use for high-emphasis call-to-actions, primary status indicators, and highlights.

Background: #FFFFFF (Pure White) — The core canvas.

Surface: #F6F8FC (Subtle Grey) — Use for Bento Grid tile backgrounds to create soft contrast against the white canvas.

Text (Main): #111827 (Deep Slate) — For headings and primary body text.

Text (Subtle): #6B7280 (Cool Grey) — For secondary info, timestamps, and labels.

Accent Black: #000000 — Use sparingly for icons, primary buttons, or dark-mode toggles.

📐 Layout: The "Bento-Glass" System
Design all screens using a modular grid system inspired by Apple's dashboard layouts.

Bento Tiles: Every feature (Revenue, Performance, Queue) should be encapsulated in a "Tile."

Radius: 24px or 32px (Extra Rounded).

Border: 1px solid #F0F0F0 (Almost invisible).

Shadow: box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); (Ultra-soft).

Padding: Use generous "Atmospheric" spacing. Standard container padding should be 24px.

Hierarchy: Use varying tile sizes (1x1, 2x1, 2x2) to emphasize important data like "Live Status."

💎 Component Aesthetics
Typography: Use "Inter" or "Space Grotesk".

Headings should be FontWeight.Bold (700) or FontWeight.ExtraBold (800) with negative letter spacing (-0.02em).

Progress Bars (Liquid Glass): * Track should be a very light grey or translucent.

Indicator should be a smooth gradient (e.g., Black to #E4FF50 or Deep Blue to Cyan).

Icons: Use minimalist, thick-stroke line icons (e.g., Lucide or HeroIcons). Set icon background containers to Surface with a 12px radius.

Buttons: * Primary: Black background with Lime Yellow text or vice-versa.

Secondary: Surface background with Black text.

🔄 Interaction & States
Elevated Hover: On interaction, tiles should subtly lift: transform: translateY(-4px);.

Micro-animations: Use Lottie or Rive for status changes (e.g., a "Sparkle" effect when a wash hits 100%).

Haptic Feel: Design buttons to feel "pressable" with active states that slightly shrink the scale (scale(0.98)).

📝 Rules for the AI (Vibecoding Instructions)
Always start with a #FFFFFF Scaffold/Background.

Never use harsh borders; use shadows and Surface colors to define boundaries.

Prioritize the "Live Status" bento tile at the top of the dashboard.

Incorporate high-quality isometric or 3D car assets where status is displayed.

Maintain a "Cleanliness" ratio: at least 30% of the screen should be white space.