'use client';

import { create } from 'zustand';
import type { Member } from '@/types';
import { getMe, logout as logoutApi } from '@/lib/api';

interface AuthState {
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // PIN 입력 화면에서 멤버 선택 화면으로 전달하기 위한 임시 저장
  pendingPin: string | null;
  setMember: (member: Member) => void;
  setPendingPin: (pin: string) => void;
  clearPendingPin: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  member: null,
  isAuthenticated: false,
  isLoading: true,
  pendingPin: null,

  setMember: (member: Member) => {
    set({ member, isAuthenticated: true, isLoading: false });
  },

  setPendingPin: (pin: string) => {
    set({ pendingPin: pin });
  },

  clearPendingPin: () => {
    set({ pendingPin: null });
  },

  logout: async () => {
    await logoutApi();
    set({ member: null, isAuthenticated: false, pendingPin: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const result = await getMe();
    if (result.success && result.data) {
      set({ member: result.data, isAuthenticated: true, isLoading: false });
    } else {
      set({ member: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
