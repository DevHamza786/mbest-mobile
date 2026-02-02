# Image Usage Guide for React Native

## Folder Structure

```
src/
  assets/
    images/          # Store all image files here (PNG, JPG, etc.)
    icons/          # Store icon images here (if not using icon library)
```

## How to Use Images

### 1. Local Images (Recommended)

#### Step 1: Add your image file
Place your image in `src/assets/images/` folder:
- Example: `src/assets/images/logo.png`
- Example: `src/assets/images/background.jpg`

#### Step 2: Import and use in component
```typescript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// Import the image
import logoImage from '../assets/images/logo.png';
import backgroundImage from '../assets/images/background.jpg';

export const MyComponent = () => {
  return (
    <View style={styles.container}>
      {/* Using local image */}
      <Image 
        source={logoImage} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Background image */}
      <Image 
        source={backgroundImage} 
        style={styles.background}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 100,
  },
  background: {
    width: '100%',
    height: 300,
  },
});
```

### 2. Remote Images (from URL)

```typescript
import { Image } from 'react-native';

<Image 
  source={{ uri: 'https://example.com/image.png' }} 
  style={styles.image}
  resizeMode="cover"
/>
```

### 3. Image Resize Modes

- `contain`: Image fits within bounds, maintains aspect ratio
- `cover`: Image fills bounds, maintains aspect ratio (may crop)
- `stretch`: Image fills bounds, may distort
- `repeat`: Repeats image (iOS only)
- `center`: Centers image

## Image Formats Supported

- ✅ PNG (recommended for logos, icons with transparency)
- ✅ JPG/JPEG (recommended for photos)
- ✅ GIF (for animations)
- ✅ WebP (Android and iOS 14+)
- ✅ SVG (using react-native-svg library)

## Best Practices

1. **Optimize Images**: Compress images before adding to reduce app size
2. **Use Appropriate Formats**:
   - PNG for logos/icons with transparency
   - JPG for photos
3. **Naming Convention**: Use descriptive names
   - ✅ `logo.png`, `login-background.jpg`, `user-avatar.png`
   - ❌ `img1.png`, `photo.jpg`
4. **Resolution**: Consider using @2x and @3x versions for retina displays
   - `logo.png` (base)
   - `logo@2x.png` (2x resolution)
   - `logo@3x.png` (3x resolution)
5. **File Size**: Keep images under 1MB when possible

## Example: Using Logo Image

```typescript
// In your component file
import logo from '../assets/images/logo.png';

<Image 
  source={logo} 
  style={{ width: 150, height: 50 }}
  resizeMode="contain"
/>
```

## TypeScript Support

For TypeScript, you may need to add type declarations. Create `src/types/images.d.ts`:

```typescript
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.webp' {
  const value: any;
  export default value;
}
```
