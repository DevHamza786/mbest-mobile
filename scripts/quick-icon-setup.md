# Quick Setup: MB App Icon

## Problem: Icon Not Showing

The app icon needs to be in **specific system folders**, not just in `src/assets/images/`.

## Solution: Generate and Replace Icons

### Step 1: Generate MB Icon Image

**Option A: Use Online Tool (Easiest)**
1. Go to: https://www.appicon.co/
2. Create a 1024x1024 PNG with:
   - Background: Green (#00C853)
   - Text: "MB" in white, bold, centered
   - Rounded corners (optional)
3. Upload and download **all Android sizes**

**Option B: Use HTML Tool**
1. Open `scripts/create-mb-icon.html` in browser
2. Click "Generate All Icons"
3. Right-click each icon → Save Image As

### Step 2: Replace Android Icons

Copy the generated icons to these exact locations:

```
android/app/src/main/res/
  ├── mipmap-mdpi/ic_launcher.png (48x48)
  ├── mipmap-mdpi/ic_launcher_round.png (48x48)
  ├── mipmap-hdpi/ic_launcher.png (72x72)
  ├── mipmap-hdpi/ic_launcher_round.png (72x72)
  ├── mipmap-xhdpi/ic_launcher.png (96x96)
  ├── mipmap-xhdpi/ic_launcher_round.png (96x96)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144)
  ├── mipmap-xxhdpi/ic_launcher_round.png (144x144)
  ├── mipmap-xxxhdpi/ic_launcher.png (192x192)
  └── mipmap-xxxhdpi/ic_launcher_round.png (192x192)
```

**Important:** Replace BOTH `ic_launcher.png` AND `ic_launcher_round.png` in each folder.

### Step 3: Clean and Rebuild

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Uninstall old app
adb uninstall com.mynewproject

# Rebuild
npm run android
```

### Step 4: Verify

1. Check that icon files are actually replaced (check file sizes/dates)
2. Uninstall the app completely from device
3. Rebuild and install fresh
4. Check home screen - icon should show "MB"

## Troubleshooting

**Icon still not showing?**
- ✅ Verify files are actually replaced (check file modification dates)
- ✅ Make sure file names are EXACTLY `ic_launcher.png` (case-sensitive)
- ✅ Uninstall app completely before rebuilding
- ✅ Clear app data: Settings → Apps → M Best → Clear Data
- ✅ Restart device/emulator
- ✅ Check AndroidManifest.xml has correct icon reference

**Still not working?**
Try manually:
1. Delete `android/app/build` folder
2. Delete `android/.gradle` folder  
3. Run `./gradlew clean` again
4. Rebuild
