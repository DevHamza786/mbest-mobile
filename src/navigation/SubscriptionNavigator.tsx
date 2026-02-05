/**
 * SubscriptionNavigator - Subscription flow for parents
 * Packages -> Payment -> Pending (waiting for approval)
 */

import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SubscriptionPackagesScreen } from '../screens/subscription/SubscriptionPackagesScreen';
import { SubscriptionPaymentScreen } from '../screens/subscription/SubscriptionPaymentScreen';
import { SubscriptionPendingScreen } from '../screens/subscription/SubscriptionPendingScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { Icon } from '../components/common/Icon';
import type { SubscriptionStackParamList } from '../types/navigation';

const Stack = createStackNavigator<SubscriptionStackParamList>();

interface SubscriptionNavigatorProps {
  initialRoute?: keyof SubscriptionStackParamList;
  onApproved?: () => void;
}

export const SubscriptionNavigator: React.FC<SubscriptionNavigatorProps> = ({
  initialRoute = 'SubscriptionPackages',
  onApproved,
}) => {
  const { logout } = useAuthStore();
  
  const PendingScreenWrapper = (props: any) => (
    <SubscriptionPendingScreen {...props} onApproved={onApproved} />
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const LogoutHeaderButton = () => (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        marginRight: spacing.md,
        padding: spacing.xs,
      }}
      activeOpacity={0.7}
    >
      <Icon name="log-out" size={24} color={colors.textInverse} />
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
          letterSpacing: 0.5,
          includeFontPadding: false,
          lineHeight: 26,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="SubscriptionPackages"
        component={SubscriptionPackagesScreen}
        options={{ 
          title: 'Choose Subscription',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <Stack.Screen
        name="SubscriptionPayment"
        component={SubscriptionPaymentScreen}
        options={{ 
          title: 'Upload Payment',
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
      <Stack.Screen
        name="SubscriptionPending"
        component={PendingScreenWrapper}
        options={{ 
          title: 'Waiting for Approval', 
          headerLeft: () => null,
          headerRight: () => <LogoutHeaderButton />,
        }}
      />
    </Stack.Navigator>
  );
};
