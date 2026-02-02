// Color Palette for MBEST Mobile App - Based on Logo Colors
// Logo: "MATHEMATICS BEYOND TUTORING"
// Primary: Vibrant Green (from logo's green A's and "BEYOND TUTORING")
// Secondary: Dark Deep Blue (from "MATHEMATICS" letters)
export const colors = {
  // Primary Colors - Logo Green
  primary: '#00C853',           // Vibrant green from logo
  primaryLight: '#4CAF50',      // Lighter green
  primaryDark: '#00A844',       // Darker green
  secondary: '#1565C0',          // Dark deep blue from logo
  secondaryLight: '#1976D2',     // Lighter blue
  secondaryDark: '#0D47A1',     // Darker blue
  
  // Status Colors - Adjusted to match logo theme
  success: '#00C853',            // Green (matches primary)
  successLight: '#4CAF50',       // Light green
  warning: '#FF9800',            // Orange
  warningLight: '#FFB74D',       // Light orange
  error: '#D32F2F',              // Red
  errorLight: '#E57373',         // Light red
  info: '#1565C0',               // Blue (matches secondary)
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC', // Very light gray
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text Colors
  text: '#1F2937',               // Dark gray (almost black)
  textSecondary: '#6B7280',      // Medium gray
  textTertiary: '#9CA3AF',       // Light gray
  textInverse: '#FFFFFF',        // White text
  
  // Border & Divider
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  // Gradient Colors (for gradient backgrounds) - Logo inspired
  gradientStart: '#00C853',      // Green (primary)
  gradientEnd: '#1565C0',       // Blue (secondary)
  gradientSecondaryStart: '#00C853', // Green
  gradientSecondaryEnd: '#4CAF50',   // Light green
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

// Gradient Presets - Logo Color Inspired
export const gradients = {
  primary: ['#00C853', '#1565C0'], // Green to Blue (logo colors)
  secondary: ['#00C853', '#4CAF50'], // Green gradient
  success: ['#00C853', '#4CAF50'], // Green success
  sunset: ['#FF9800', '#D32F2F'], // Orange to Red
  ocean: ['#1565C0', '#1976D2', '#00C853'], // Blue to Green (logo theme)
};

