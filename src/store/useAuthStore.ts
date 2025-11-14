import { create } from 'zustand';

// JWT 디코딩 헬퍼 함수
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return null;
  }
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  userId: string | null; // userId 상태 추가
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  userId: null, // 초기 userId는 null

  login: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const decodedToken = decodeJwt(accessToken);
    const userId = decodedToken ? decodedToken.sub : null; // 'sub' 클레임에서 userId 추출

    set({ accessToken, refreshToken, isAuthenticated: true, userId });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, isAuthenticated: false, userId: null }); // userId도 null로 설정
  },
}));

// 스토어 초기화 시 localStorage에서 토큰을 로드하고 userId를 설정
const initializeAuthStore = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    const decodedToken = decodeJwt(accessToken);
    const userId = decodedToken ? decodedToken.sub : null;
    useAuthStore.setState({ userId });
  }
};
initializeAuthStore(); // 스토어 생성 시 한 번 호출

export default useAuthStore;
