# PWA Icons Required

The PWA setup is complete, but placeholder icons are needed:

## Required Icons

Create the following icon files in `/public/`:

1. **icon-192.png** (192x192px)
   - Used for: Android home screen, PWA install prompt
   - Recommended: Square icon with padding, transparent or #0f172a background

2. **icon-512.png** (512x512px)
   - Used for: Android splash screens, larger displays
   - Same design as 192px, just larger

3. **screenshot-mobile.png** (390x844px)
   - Mobile app screenshot for app stores
   - Recommended: Dashboard or timeline view on mobile

4. **screenshot-desktop.png** (1920x1080px)
   - Desktop screenshot for app stores
   - Recommended: Full dashboard view

## Icon Design Guidelines

- **Theme**: Cosmic, mystical, oracle-themed
- **Colors**: 
  - Primary: Golden amber (#fcd34d)
  - Background: Deep space (#0f172a)
- **Style**: Minimalist, recognizable at small sizes
- **Suggestion**: Stylized "M" for Merlin, or constellation/star symbol

## Tools for Icon Generation

- Figma/Sketch for design
- ImageMagick for batch conversion:
  ```bash
  convert input.png -resize 192x192 icon-192.png
  convert input.png -resize 512x512 icon-512.png
  ```
- Online generators: https://realfavicongenerator.net/

## Current Status

✅ manifest.json configured
✅ Service worker installed (offline caching)
✅ PWA installer component active
✅ Meta tags for iOS/Android
⚠️  Icons pending (app will work but won't have custom icon)

## Testing PWA

1. Deploy to HTTPS (required for PWA)
2. Open in Chrome/Edge on Android or Safari on iOS
3. Look for "Install app" prompt
4. Test offline: Disable network in DevTools → reload page
5. Verify cached data persists

## Note

The PWA will function without icons, but users will see a generic placeholder. Add icons before production deployment for best user experience.
