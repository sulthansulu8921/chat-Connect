import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Gender = 'male' | 'female' | 'non-binary';
type TargetGender = 'male' | 'female' | 'non-binary' | 'everyone';

interface UserState {
    id: string | null;
    name: string;
    age: number | null;
    gender: Gender | null;
    targetGender: TargetGender | null;
    instagramId: string;
    status: 'idle' | 'matching' | 'matched';
    partnerId: string | null;

    setUser: (user: Partial<UserState>) => void;
    resetUser: () => void;
    setMatch: (partnerId: string) => void;
    clearMatch: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            id: null,
            name: '',
            age: null,
            gender: null,
            targetGender: null,
            instagramId: '',
            status: 'idle',
            partnerId: null,

            setUser: (user) => set((state) => ({ ...state, ...user })),
            resetUser: () => set({
                id: null, name: '', age: null, gender: null, targetGender: null, instagramId: '', status: 'idle', partnerId: null
            }),
            setMatch: (partnerId) => set({ status: 'matched', partnerId }),
            clearMatch: () => set({ status: 'idle', partnerId: null }),
        }),
        {
            name: 'singles-storage',
        }
    )
);
