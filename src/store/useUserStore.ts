import { create } from 'zustand';

/**
 * @file useUserStore.ts
 * @description 전역 사용자 ID(userId) 상태를 관리하는 Zustand 스토어입니다.
 *              애플리케이션 전반에서 userId를 쉽게 접근하고 업데이트할 수 있도록 하여
 *              컴포넌트 간의 불필요한 prop drilling을 제거하고 결합도를 낮춥니다.
 */

interface UserState {
  userId: string;
  setUserId: (id: string) => void;
}

const useUserStore = create<UserState>((set) => ({
  userId: `user_${Date.now()}`, // Initial userId, similar to App.tsx
  setUserId: (id: string) => set({ userId: id }),
}));

export default useUserStore;