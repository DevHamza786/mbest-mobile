/**
 * Generate MB App Icons for Android
 * This script creates "MB" text icons in all required sizes
 */

const fs = require('fs');
const path = require('path');

// Icon sizes for Android
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Colors
const backgroundColor = '#00C853'; // Green
const textColor = '#FFFFFF'; // White

// Check if sharp is available (better for image generation)
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('Sharp not found. Trying alternative method...');
}

function createIconWithSharp(size) {
  if (!sharp) return null;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.2}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${Math.floor(size * 0.5)}" 
        font-weight="bold" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >MB</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

function createIconWithCanvas(size) {
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background with rounded corners
    const radius = size * 0.2;
    ctx.fillStyle = backgroundColor;
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
    ctx.fill();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.floor(size * 0.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MB', size / 2, size / 2);

    return canvas.toBuffer('image/png');
  } catch (error) {
    return null;
  }
}

async function generateIcons() {
  console.log('🚀 Generating MB App Icons...\n');
  console.log(`Background: ${backgroundColor}`);
  console.log(`Text: MB (${textColor})\n`);

  const androidResPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  let successCount = 0;
  let failCount = 0;

  for (const [folder, size] of Object.entries(androidSizes)) {
    const folderPath = path.join(androidResPath, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    let iconBuffer = null;

    // Try sharp first
    if (sharp) {
      try {
        iconBuffer = await createIconWithSharp(size);
      } catch (error) {
        console.log(`Sharp failed for ${size}, trying canvas...`);
      }
    }

    // Try canvas if sharp failed or not available
    if (!iconBuffer) {
      iconBuffer = createIconWithCanvas(size);
    }

    if (iconBuffer) {
      // Save regular icon
      fs.writeFileSync(path.join(folderPath, 'ic_launcher.png'), iconBuffer);
      
      // Save round icon (same for now)
      fs.writeFileSync(path.join(folderPath, 'ic_launcher_round.png'), iconBuffer);
      
      console.log(`✅ Generated ${folder}/ic_launcher.png (${size}x${size})`);
      successCount++;
    } else {
      console.log(`❌ Failed to generate ${size}x${size} icon`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} successful, ${failCount} failed`);

  if (failCount > 0) {
    console.log('\n⚠️  Some icons failed to generate.');
    console.log('Please install one of these packages:');
    console.log('  npm install sharp --save-dev');
    console.log('  OR');
    console.log('  npm install canvas --save-dev');
    console.log('\nOr use the HTML tool: scripts/create-mb-icon.html');
  } else {
    console.log('\n✨ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Clean build: cd android && ./gradlew clean && cd ..');
    console.log('2. Uninstall app: adb uninstall com.mynewproject');
    console.log('3. Rebuild: npm run android');
  }
}

// Run
generateIcons().catch(console.error);
