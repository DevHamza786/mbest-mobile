/**
 * Script to generate "MB" app icon
 * This script generates app icons with "MB" text for Android and iOS
 * 
 * Requirements:
 * npm install canvas --save-dev
 * 
 * Usage:
 * node scripts/generate-app-icon.js
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let canvas, createCanvas, loadImage;
try {
  const canvasModule = require('canvas');
  createCanvas = canvasModule.createCanvas;
  loadImage = canvasModule.loadImage;
} catch (error) {
  console.error('Error: canvas module not found.');
  console.error('Please install it by running: npm install canvas --save-dev');
  console.error('\nAlternatively, you can use an online tool like:');
  console.error('https://www.appicon.co/');
  console.error('https://icon.kitchen/');
  process.exit(1);
}

// Icon sizes for Android (in pixels)
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Icon sizes for iOS (in points, will be generated at @2x and @3x)
const iosSizes = {
  '20pt': { '@2x': 40, '@3x': 60 },
  '29pt': { '@2x': 58, '@3x': 87 },
  '40pt': { '@2x': 80, '@3x': 120 },
  '60pt': { '@2x': 120, '@3x': 180 },
  '1024pt': { '@1x': 1024 },
};

// Colors
const backgroundColor = '#00C853'; // Green from logo
const textColor = '#FFFFFF'; // White text

function createIcon(size, text = 'MB') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Draw rounded corners (optional, for modern look)
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // Redraw background after clipping
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.floor(size * 0.5)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

function generateAndroidIcons() {
  console.log('Generating Android icons...');
  const androidResPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

  Object.entries(androidSizes).forEach(([folder, size]) => {
    const folderPath = path.join(androidResPath, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate regular icon
    const iconBuffer = createIcon(size);
    fs.writeFileSync(path.join(folderPath, 'ic_launcher.png'), iconBuffer);
    
    // Generate round icon (same for now, can be customized)
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_round.png'), iconBuffer);
    
    console.log(`✓ Generated ${folder}/ic_launcher.png (${size}x${size})`);
  });
}

function generateIOSIcons() {
  console.log('Generating iOS icons...');
  const iosIconsPath = path.join(__dirname, '..', 'ios', 'MyNewProject', 'Images.xcassets', 'AppIcon.appiconset');

  // Note: iOS icons need to be added manually to Contents.json
  // This script generates the images, but you'll need to update Contents.json
  console.log('Note: iOS icons need to be added to Contents.json manually.');
  console.log('Generated icons should be placed in:', iosIconsPath);
  
  // Generate 1024x1024 icon for App Store
  const icon1024 = createIcon(1024);
  const icon1024Path = path.join(iosIconsPath, 'icon-1024.png');
  fs.writeFileSync(icon1024Path, icon1024);
  console.log(`✓ Generated icon-1024.png (1024x1024)`);
}

// Main execution
console.log('🚀 Generating MB App Icons...\n');
console.log(`Background Color: ${backgroundColor}`);
console.log(`Text Color: ${textColor}`);
console.log(`Text: MB\n`);

try {
  generateAndroidIcons();
  console.log('');
  generateIOSIcons();
  console.log('\n✅ Icon generation complete!');
  console.log('\nNext steps:');
  console.log('1. For Android: Icons have been generated automatically');
  console.log('2. For iOS: Add the generated icons to Xcode project');
  console.log('3. Rebuild your app to see the new icons');
} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}
