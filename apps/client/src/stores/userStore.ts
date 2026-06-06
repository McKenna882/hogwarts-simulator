import { create } from "zustand";

export interface UserProfile {
  id?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  referralCode?: string;
  profile?: {
    nickname?: string;
    house?: string;
    houseLocked?: boolean;
    grade?: string;
    wizardTitle?: string;
    team?: string;
    bio?: string;
  };
  wallet?: {
    balanceGalleons: number;
  };
}

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateWalletBalance: (balance: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateWalletBalance: (balance) => set((state) => ({
    profile: state.profile ? { ...state.profile, wallet: { balanceGalleons: balance } } : null,
  })),
}));
