/**
 * ParentGate - Checks subscription status for parents
 * Shows Parent navigator if active, Subscription flow if not
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/api/subscription';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ParentNavigator } from '../navigation/AppNavigator';
import { SubscriptionNavigator } from '../navigation/SubscriptionNavigator';

export const ParentGate: React.FC = () => {
  const { token, user } = useAuthStore();
  const { setSubscription, subscriptionRequired, setSubscriptionRequired } = useSubscriptionStore();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<'SubscriptionPackages' | 'SubscriptionPending'>('SubscriptionPackages');

  const { data, isLoading, isSuccess, isError } = useQuery({
    queryKey: ['mySubscription', token],
    queryFn: () => subscriptionService.getMySubscription(),
    enabled: !!token && user?.role === 'parent',
    retry: false,
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    const sub = data?.data ?? data;
    const status = sub?.status ?? user?.subscription_status ?? null;
    setSubscription(sub);
    setSubscriptionStatus(status);

    if (status === 'pending') {
      setInitialRoute('SubscriptionPending');
    } else {
      setInitialRoute('SubscriptionPackages');
    }
  }, [isSuccess, data, user?.subscription_status, setSubscription]);

  if (user?.role !== 'parent') {
    return <ParentNavigator />;
  }

  useEffect(() => {
    if (isError && subscriptionStatus === null) {
      setSubscriptionStatus('none');
    }
  }, [isError, subscriptionStatus]);

  if (isLoading || (token && subscriptionStatus === null && !data && !isError)) {
    return <LoadingSpinner />;
  }

  if (subscriptionStatus === 'active' && !subscriptionRequired) {
    return <ParentNavigator />;
  }

  const route = subscriptionRequired ? 'SubscriptionPackages' : initialRoute;

  const handleApproved = () => {
    setSubscriptionStatus('active');
  };

  return (
    <SubscriptionNavigator
      initialRoute={route}
      onApproved={() => {
        setSubscriptionRequired(false);
        handleApproved();
      }}
    />
  );
};
