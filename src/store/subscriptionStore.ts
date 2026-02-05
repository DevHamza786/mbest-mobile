import { create } from 'zustand';
import type { SubscriptionPackage, MySubscription } from '../services/api/subscription';

interface SubscriptionState {
  subscription: MySubscription | null;
  setSubscription: (sub: MySubscription | null) => void;
  selectedPackage: SubscriptionPackage | null;
  setSelectedPackage: (pkg: SubscriptionPackage | null) => void;
  subscriptionRequired: boolean;
  setSubscriptionRequired: (v: boolean) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  setSubscription: (subscription) => set({ subscription }),
  selectedPackage: null,
  setSelectedPackage: (selectedPackage) => set({ selectedPackage }),
  subscriptionRequired: false,
  setSubscriptionRequired: (subscriptionRequired) => set({ subscriptionRequired }),
  clearSubscription: () =>
    set({ subscription: null, selectedPackage: null, subscriptionRequired: false }),
}));
