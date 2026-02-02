# Images Folder

This folder contains all image assets used in the application.

## Usage

### Local Images
```typescript
import logoImage from '../assets/images/logo.png';
import backgroundImage from '../assets/images/background.jpg';

// In your component
<Image source={logoImage} style={styles.logo} />
```

### Remote Images
```typescript
<Image 
  source={{ uri: 'https://example.com/image.png' }} 
  style={styles.image}
/>
```

## Image Formats Supported
- PNG (recommended for logos, icons with transparency)
- JPG/JPEG (recommended for photos)
- GIF (for animations)
- WebP (supported on Android and iOS 14+)

## Best Practices
1. Use PNG for logos and icons that need transparency
2. Use JPG for photos and complex images
3. Optimize images before adding them (reduce file size)
4. Use appropriate resolutions:
   - @1x: Base resolution
   - @2x: 2x resolution (for retina displays)
   - @3x: 3x resolution (for high-DPI displays)
5. Name files descriptively: `logo.png`, `background-login.jpg`, etc.
