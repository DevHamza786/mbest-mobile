# App Icon Generation Guide

## Quick Method (Recommended)

Since generating icons programmatically requires additional dependencies, here are easier alternatives:

### Option 1: Online Icon Generator
1. Visit https://www.appicon.co/ or https://icon.kitchen/
2. Upload a 1024x1024 PNG image with "MB" text
3. Download the generated icon set
4. Replace the icons in:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `ios/MyNewProject/Images.xcassets/AppIcon.appiconset/`

### Option 2: Manual Creation
Create a 1024x1024 PNG image with:
- Background: Green (#00C853)
- Text: "MB" in white, bold, centered
- Rounded corners (optional)

Then use an online tool to generate all sizes.

### Option 3: Use Script (Requires canvas package)
```bash
npm install canvas --save-dev
node scripts/generate-app-icon.js
```

## Icon Specifications

### Android Icons
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

### iOS Icons
- 20pt (@2x: 40px, @3x: 60px)
- 29pt (@2x: 58px, @3x: 87px)
- 40pt (@2x: 80px, @3x: 120px)
- 60pt (@2x: 120px, @3x: 180px)
- 1024pt (App Store)

## Design
- Background: #00C853 (Green)
- Text: "MB" in white, bold
- Font: Arial or similar sans-serif
- Text size: ~50% of icon size
