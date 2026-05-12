import { create } from 'zustand';
import type { User } from '@/types';

const STORAGE_KEY = 'borrow_equipment_user';

interface AuthState {
  currentUser: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
}

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = localStorage.getItem(STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: readStoredUser(),
  signIn: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ currentUser: user });
  },
  signOut: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ currentUser: null });
  }
}));
