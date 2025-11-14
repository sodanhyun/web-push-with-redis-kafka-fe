/**
 * @file Login.tsx
 * @description 사용자 로그인 기능을 제공하는 React 컴포넌트입니다.
 *              사용자 이름과 비밀번호를 입력받아 백엔드 API를 통해 인증을 시도하고,
 *              성공 시 JWT 토큰을 저장하고 메인 페이지로 리다이렉트합니다.
 */

import React, { useState } from 'react';
import axios from 'axios'; // HTTP 요청을 위한 axios 라이브러리
import useAuthStore from '../store/useAuthStore'; // 인증 상태를 관리하는 Zustand 스토어
import { useNavigate } from 'react-router-dom'; // 라우팅을 위한 훅

/**
 * @function Login
 * @description 사용자 로그인 폼을 렌더링하고 로그인 로직을 처리하는 컴포넌트입니다.
 */
const Login: React.FC = () => {
  // 사용자 이름(username) 입력 필드의 상태를 관리합니다.
  const [username, setUsername] = useState('');
  // 비밀번호(password) 입력 필드의 상태를 관리합니다.
  const [password, setPassword] = useState('');
  // useAuthStore에서 로그인 액션 함수를 가져옵니다.
  const login = useAuthStore((state) => state.login);
  // 페이지 이동을 위한 navigate 함수를 가져옵니다.
  const navigate = useNavigate();

  /**
   * @function handleLogin
   * @description 로그인 폼 제출 시 호출되는 이벤트 핸들러입니다.
   *              백엔드 API에 로그인 요청을 보내고, 성공 시 인증 정보를 저장 후 메인 페이지로 이동합니다.
   * @param {React.FormEvent} e - 폼 제출 이벤트 객체
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 방지합니다.
    try {
      // 백엔드의 로그인 API 엔드포인트로 POST 요청을 보냅니다.
      const response = await axios.post('/api/auth/login', { username, password });
      // 응답에서 accessToken과 refreshToken을 추출합니다.
      const { accessToken, refreshToken } = response.data;
      // useAuthStore의 login 액션을 호출하여 토큰을 저장하고 인증 상태를 업데이트합니다.
      login(accessToken, refreshToken);
      navigate('/'); // 로그인 성공 시 메인 페이지('/')로 이동합니다.
    } catch (error) {
      console.error('Login failed:', error); // 로그인 실패 시 에러 로깅
      alert('로그인 실패! 사용자 이름 또는 비밀번호를 확인하세요.'); // 사용자에게 알림
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h2>로그인</h2>
      {/* 로그인 폼 */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        {/* 사용자 이름 입력 필드 */}
        <input
          type="text"
          placeholder="사용자 이름"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        {/* 비밀번호 입력 필드 */}
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        {/* 로그인 제출 버튼 */}
        <button type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
          로그인
        </button>
      </form>
    </div>
  );
};

export default Login;