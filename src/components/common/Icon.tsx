/**
 * Icon Component - Reusable icon wrapper using lucide-react-native
 * Provides consistent icon styling and sizing across the app
 */

import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import {
  Home,
  Book,
  FileText,
  File,
  Video,
  Inbox,
  Star,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Users,
  GraduationCap,
  Bell,
  Settings,
  MessageCircle,
  MessageSquare,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  BarChart,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Zap,
  Menu,
  MoreVertical,
  Download,
  Upload,
  Share,
  Heart,
  Bookmark,
  Clipboard,
  Award,
  Target,
  Trophy,
  Activity,
  PieChart,
  DollarSign,
  Building,
  School,
  Link,
  PlayCircle,
  Tag,
  LogOut,
  Crown,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';

export type IconName = 
  | 'home'
  | 'book'
  | 'file-text'
  | 'file'
  | 'video'
  | 'inbox'
  | 'star'
  | 'check-circle'
  | 'calendar'
  | 'clock'
  | 'user'
  | 'users'
  | 'graduation-cap'
  | 'bell'
  | 'settings'
  | 'message-circle'
  | 'message-square'
  | 'search'
  | 'filter'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'mail'
  | 'phone'
  | 'map-pin'
  | 'credit-card'
  | 'bar-chart'
  | 'trending-up'
  | 'alert-circle'
  | 'check'
  | 'x'
  | 'zap'
  | 'menu'
  | 'more-vertical'
  | 'download'
  | 'upload'
  | 'share'
  | 'heart'
  | 'bookmark'
  | 'clipboard'
  | 'award'
  | 'target'
  | 'trophy'
  | 'activity'
  | 'pie-chart'
  | 'dollar-sign'
  | 'building'
  | 'school'
  | 'link'
  | 'play-circle'
  | 'tag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
  strokeWidth?: number;
}

// Icon name to Lucide component mapping
const iconMap: Record<IconName, React.ComponentType<any>> = {
  'home': Home,
  'book': Book,
  'file-text': FileText,
  'file': File,
  'video': Video,
  'inbox': Inbox,
  'star': Star,
  'check-circle': CheckCircle,
  'calendar': Calendar,
  'clock': Clock,
  'user': User,
  'users': Users,
  'graduation-cap': GraduationCap,
  'bell': Bell,
  'settings': Settings,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  'search': Search,
  'filter': Filter,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'plus': Plus,
  'minus': Minus,
  'edit': Edit,
  'trash': Trash2,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'mail': Mail,
  'phone': Phone,
  'map-pin': MapPin,
  'credit-card': CreditCard,
  'bar-chart': BarChart,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
  'check': Check,
  'x': X,
  'zap': Zap,
  'menu': Menu,
  'more-vertical': MoreVertical,
  'download': Download,
  'upload': Upload,
  'share': Share,
  'heart': Heart,
  'bookmark': Bookmark,
  'clipboard': Clipboard,
  'award': Award,
  'target': Target,
  'trophy': Trophy,
  'activity': Activity,
  'pie-chart': PieChart,
  'dollar-sign': DollarSign,
  'building': Building,
  'school': School,
  'link': Link,
  'play-circle': PlayCircle,
  'tag': Tag,
  'log-out': LogOut,
  'crown': Crown,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.text,
  style,
  strokeWidth = 2,
}) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

// Predefined icon sizes for consistency
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

