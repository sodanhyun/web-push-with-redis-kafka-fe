import { create } from 'zustand';

/**
 * @file useUserStore.ts
 * @description 전역 사용자 ID(userId) 상태를 관리하는 Zustand 스토어입니다.
 *              localStorage와의 연동 로직은 App.tsx에서 처리합니다.
 */

interface UserState {
  userId: string;
  setUserId: (id: string) => void;
}

const useUserStore = create<UserState>((set) => ({
  // 초기 userId는 임시값이며, App.tsx에서 localStorage 값으로 덮어쓰여집니다.
  userId: '',
  setUserId: (id: string) => set({ userId: id }),
}));

export default useUserStore;