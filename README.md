# SG 50 — Singapore Cocktail & Bar Guide (iPhone PWA)

An Airbnb-inspired Progressive Web App (PWA) to explore and track **79 curated Singapore Central Area bars** — all **34 active bars** from [the50.com](https://www.the50.com/) (2026 World's 50 Best Bars, Asia's 50 Best Bars 1–100, and The 50 Discovery) **plus 45 verified Central Area bars rated above 4.5★ (`4.6★–5.0★`) on Google Maps**, spanning champagne bars, wine lounges, whisky libraries, Japanese sake & umeshu bars, craft cocktail speakeasies, and rooftops.

## Design Highlights
- **Alcohol Search (List & Map Synced)**: Tap the dedicated **Alcohol** button in the top bar (mobile & desktop) to search any drink or spirit (e.g., *champagne*, *Japanese whisky*, *natural wine*, *mezcal*, *umeshu*, *negroni*) or pick from 12 one-tap spirit chips. Results rank **"★ Specializes in..."** venues first followed by **"Also serves..."**, showing venue-specific pour notes on Explore cards, Map preview cards, and Detail sheets — with gold specialist markers synced directly onto the map.
- **Photo-first Airbnb layout**: Borderless rounded-2xl real bar photography cards (all 79 verified real venue photos), top-left ranking & specialty ribbons, floating heart wishlist buttons, and clean typography.
- **Floating search pill & monochrome icon rail**: Filter instantly across *All bars*, *50 Best*, *4.6★+ Top*, *Speakeasy*, *Hotel bars*, *Ginza*, *Listening*, *Rooftop*, *Heritage*, *Sustainable*, and *World's Best*.
- **Full-screen interactive map**: Floating dark **Show map** pill toggles a crisp Singapore map (**OneMap Singapore by SLA** via Leaflet — 100% free, zero API key, with **Default / Night** mode toggle and live **GPS blue-dot** location) with toggleable overlays for **Crawl route**, **♥ Wishlist**, **✓ Visited**, and active **Alcohol Search** filtering.
- **Full-screen listing detail sheet**: Hero photography, ranking/Google rating laurel box, interactive **"What they pour"** drink pills (tap any spirit to search), embedded Google Maps preview, one-tap native Google Maps & walking directions, tasting log, and a sticky bottom **Check in** bar.
- **Combined Bar Passport & Crawl Planner**: Track your progress across all 79+ bars in one unified Passport, build custom or curated multi-stop Singapore bar crawls with shortest-walk optimization, and export to Google My Maps (`.kml`), CSV, or JSON backup from Settings.

## Installing on Your iPhone (PWA)

Because iOS Safari requires **HTTPS** to install a Progressive Web App on your Home Screen:

1. Open the live site (`https://howowi.github.io/sg-cocktail-tracker/`) in **Safari** on your iPhone.
2. Tap the **Share** button (square with upward arrow) → **Add to Home Screen** → **Add**.
3. Launch **SG 50 Bars** from your Home Screen — it opens full-screen with a custom coral-crimson coupe app icon, iOS safe-area bottom tab bar, and offline caching via `sw.js`.

## Project Files
- `index.html` — iOS PWA shell, header triggers, Alcohol Search & Filter sheets, and map overlay controls
- `manifest.webmanifest` — Standalone PWA manifest + maskable/standard icons
- `sw.js` — Offline service worker caching app shell, bar photographs, and OneMap tiles
- `styles.css` — Airbnb-inspired responsive CSS
- `bars-data.js` — Verified 2026 catalog of 79 Singapore bars with structured alcohol specialties & pour notes
- `app.js` — Alcohol Search engine, OneMap Singapore integration, crawl optimizer, and KML/JSON/CSV exports
- `assets/photos/` — 79 verified real photographs of the actual Singapore bars
- `assets/icons/` — Full-bleed iPhone `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png`
