# 푸시 알림 설정 가이드

## 환경 변수 설정

프로젝트 루트에 `.env.development` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 개발 환경 설정
NODE_ENV=development

# API 설정
VITE_API_BASE_URL=http://localhost:3001
VITE_PUSH_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# VAPID 키 (개발용)
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa40HI8p8KJguxQn4X4VXH9B8wP3ZWhN36yK10Mxhm0V8FId0U8nXjWQ9XNSHg

# HTTPS 설정
VITE_HTTPS_PORT=5173
VITE_HTTP_PORT=5174
```

## HTTPS 로컬 개발 환경 설정

### 1. SSL 인증서 생성

#### 🎯 권장: mkcert 사용 (정상적인 인증서)

```bash
# mkcert 설치 후 실행 (브라우저 경고 없음)
npm run setup:https:mkcert

# Windows 사용자
npm run setup:https:mkcert:win
```

**mkcert 설치 방법:**
- **Windows**: `choco install mkcert` 또는 [수동 다운로드](https://github.com/FiloSottile/mkcert/releases)
- **macOS**: `brew install mkcert`
- **Linux**: `sudo apt install libnss3-tools` 후 [수동 설치](https://github.com/FiloSottile/mkcert/releases)

#### 🔧 대안: 자체 서명 인증서

```bash
# 자동 생성 (node-forge 사용, 브라우저 경고 있음)
npm run setup:https

# OpenSSL 사용 (OpenSSL이 설치된 경우)
npm run setup:https:openssl

# Windows 사용자 (OpenSSL 설치 필요)
npm run setup:https:win

# 수동 생성 (OpenSSL 설치 필요)
mkdir certs
openssl genrsa -out certs/localhost-key.pem 2048
openssl req -new -x509 -key certs/localhost-key.pem -out certs/localhost.pem -days 365 -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/OU=IT/CN=localhost"
```

### 2. HTTPS 개발 서버 실행

```bash
# HTTPS로 개발 서버 실행
npm run dev:https

# 또는 일반 HTTP로 실행
npm run dev
```

### 3. 브라우저에서 인증서 허용

#### mkcert 사용 시
- **정상적인 인증서**: 브라우저에서 경고 없이 바로 접속 가능
- **자동으로 신뢰됨**: mkcert CA가 시스템에 설치되어 있음

#### 자체 서명 인증서 사용 시
- **브라우저 경고**: "고급" → "localhost로 이동(안전하지 않음)" 클릭
- **매번 경고**: 새로고침할 때마다 경고 메시지 표시

### 4. mkcert 상세 설치 가이드

#### Windows
```bash
# Chocolatey 사용
choco install mkcert

# Scoop 사용
scoop bucket add extras
scoop install mkcert

# 수동 설치
# 1. https://github.com/FiloSottile/mkcert/releases 에서 다운로드
# 2. mkcert-v1.4.4-windows-amd64.exe를 mkcert.exe로 이름 변경
# 3. PATH에 추가하거나 프로젝트 폴더에 복사
```

#### macOS
```bash
# Homebrew 사용
brew install mkcert

# MacPorts 사용
sudo port install mkcert
```

#### Linux (Ubuntu/Debian)
```bash
# 의존성 설치
sudo apt install libnss3-tools

# mkcert 다운로드 및 설치
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# 의존성 설치
sudo yum install nss-tools
# 또는
sudo dnf install nss-tools

# mkcert 다운로드 및 설치
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

## VAPID 키 생성

실제 프로덕션 환경에서는 새로운 VAPID 키를 생성해야 합니다:

```bash
# web-push 라이브러리를 사용하여 VAPID 키 생성
npm install -g web-push
web-push generate-vapid-keys
```

## 백엔드 API 엔드포인트

다음 API 엔드포인트들이 구현되어야 합니다:

### 1. 푸시 구독 등록
```
POST /api/push-subscription
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-key",
    "auth": "base64-encoded-key"
  },
  "userId": "user123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "ko-KR",
    "timezone": "Asia/Seoul"
  }
}
```

### 2. 푸시 토큰 등록
```
POST /api/push-token
Content-Type: application/json

{
  "token": "push-token-string",
  "userId": "user123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32"
  }
}
```

### 3. 푸시 토큰 삭제
```
DELETE /api/push-token/:tokenId
```

### 4. 사용자 푸시 토큰 조회
```
GET /api/push-tokens/:userId
```

### 5. 테스트 푸시 알림 전송
```
POST /api/push-test
Content-Type: application/json

{
  "userId": "user123",
  "message": "테스트 메시지",
  "title": "테스트 알림"
}
```

## 사용법

1. **권한 요청**: "권한 요청" 버튼을 클릭하여 브라우저 알림 권한을 허용합니다.

2. **푸시 구독**: 권한이 허용되면 "푸시 알림 구독" 버튼을 클릭하여 푸시 알림을 구독합니다.

3. **토큰 전송**: 구독이 완료되면 자동으로 서버에 구독 정보가 전송됩니다.

4. **알림 테스트**: 
   - "UI 알림 테스트": 화면 내 알림을 테스트합니다.
   - "브라우저 알림 테스트": 실제 브라우저 알림을 테스트합니다.

## 주요 기능

### 1. 서비스워커 (`public/sw.js`)
- 푸시 이벤트 처리
- 알림 표시 및 클릭 이벤트 처리
- 캐시 관리

### 2. 푸시 알림 Hook (`src/hooks/usePushNotification.ts`)
- 서비스워커 등록
- 권한 요청 및 관리
- 푸시 구독/해제
- 에러 처리

### 3. 알림 UI 컴포넌트 (`src/components/NotificationToast.tsx`)
- 화면 내 알림 표시
- 푸시 알림 설정 UI
- 알림 컨테이너

### 4. API 클라이언트 (`src/api/pushApi.ts`)
- axios 기반 HTTP 클라이언트
- 푸시 관련 API 호출 함수들
- 에러 처리 및 인터셉터

## 브라우저 지원

- Chrome 42+
- Firefox 44+
- Safari 16+
- Edge 17+

## 보안 고려사항

1. **HTTPS 필수**: 푸시 알림은 HTTPS 환경에서만 작동합니다.
2. **VAPID 키 보안**: VAPID 키는 안전하게 관리되어야 합니다.
3. **사용자 동의**: 푸시 알림은 사용자 명시적 동의 후에만 전송해야 합니다.
4. **토큰 관리**: 구독 토큰은 안전하게 저장하고 관리해야 합니다.

## 문제 해결

### 서비스워커 등록 실패
- HTTPS 환경에서 실행하고 있는지 확인
- 브라우저 개발자 도구의 Application 탭에서 서비스워커 상태 확인

### 푸시 알림이 표시되지 않음
- 브라우저 알림 권한이 허용되었는지 확인
- VAPID 키가 올바른지 확인
- 서버에서 올바른 형식으로 푸시 메시지를 전송하는지 확인

### 구독 실패
- 네트워크 연결 상태 확인
- 서버 API 엔드포인트가 올바르게 구현되었는지 확인
