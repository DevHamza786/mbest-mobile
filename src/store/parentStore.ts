import { create } from 'zustand';
import type { Child } from '../services/api/parent';

interface ParentState {
  selectedChildId: number | null;
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;
  setSelectedChildId: (id: number | null) => void;
  clearSelectedChild: () => void;
}

export const useParentStore = create<ParentState>((set) => ({
  selectedChildId: null,
  selectedChild: null,

  setSelectedChild: (child) =>
    set({
      selectedChild: child,
      selectedChildId: child?.id ?? null,
    }),

  setSelectedChildId: (id) =>
    set({
      selectedChildId: id,
      selectedChild: id ? { id } : null,
    }),

  clearSelectedChild: () =>
    set({ selectedChildId: null, selectedChild: null }),
}));
