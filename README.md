# SG 50 — Singapore Cocktail Bars (iPhone PWA)

An Airbnb-inspired Progressive Web App (PWA) to explore and track all **34 active Singapore cocktail bars** from [the50.com](https://www.the50.com/) (2026 World's 50 Best Bars, Asia's 50 Best Bars 1–100, and The 50 Discovery) with full Google Maps integration.

## Design Highlights
- **Photo-first Airbnb layout**: Borderless rounded-2xl editorial photography cards, top-left white ranking ribbons, floating heart wishlist buttons, and clean 4-line typography.
- **Floating search pill & monochrome icon rail**: Filter instantly across *All bars*, *50 Best*, *World's Best*, *Speakeasy*, *Hotel bars*, *Ginza*, *Listening*, *Heritage*, *Rooftop*, and *Sustainable*.
- **Full-screen interactive map**: Floating dark **Show map** pill toggles a crisp Singapore map (**OneMap Singapore by SLA** via Leaflet — 100% free, zero API key, with **Default / Night** mode toggle and live **GPS blue-dot** location) with Airbnb-style white pill markers (`#9`, `#12`, `S$28`) and floating photo preview cards.
- **Full-screen listing detail sheet**: Hero photography, Airbnb-style laurel ranking callout, embedded Google Maps preview, one-tap native Google Maps & walking directions, tasting log, and a sticky bottom **Check in** bar.
- **Bar Crawl Planner**: Pre-built and custom multi-stop Singapore bar crawls with shortest-walk optimization and one-tap launch into Google Maps walking directions.
- **Google My Maps Export**: Export all 34 bars organized into folders (`2026 Ranked`, `Visited`, `Wishlists`, `50 Discovery`) as `.kml`.

## Installing on Your iPhone (PWA)

Because iOS Safari requires **HTTPS** to install a Progressive Web App on your Home Screen:

1. Host this `singapore-cocktail-tracker/` folder on any free static HTTPS host — **GitHub Pages**, **Cloudflare Pages**, **Netlify**, or **Vercel** (zero build step needed!).
2. Open the HTTPS URL in **Safari** on your iPhone.
3. Tap the **Share** button (square with upward arrow) → **Add to Home Screen** → **Add**.
4. Launch **SG 50 Bars** from your Home Screen — it opens full-screen with a custom coral-crimson coupe app icon, iOS safe-area bottom tab bar, and full offline caching via `sw.js`.

## Project Files
- `index.html` — iOS PWA shell (`apple-mobile-web-app-capable`, safe-area viewport, manifest & icon links)
- `manifest.webmanifest` — Standalone PWA manifest + maskable/standard icons
- `sw.js` — Offline service worker caching app shell and all 12 editorial photographs
- `styles.css` — Airbnb-inspired responsive CSS
- `bars-data.js` — Verified 2026 `the50.com` Singapore bar catalog
- `app.js` — App logic, Leaflet/Google Maps integration, crawl optimizer, and KML/JSON/CSV exports
- `assets/photos/` — 12 custom editorial cocktail bar photographs
- `assets/icons/` — Full-bleed iPhone `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png`
