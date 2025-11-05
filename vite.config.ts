import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// HTTPS 인증서 경로 (mkcert 우선, 자체 서명 인증서 대체)
let httpsOptions = undefined;
let certificateType = 'none';

try {
  const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem');
  const certPath = path.resolve(__dirname, 'certs/localhost.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    // mkcert 인증서인지 확인 (mkcert는 특정 주석을 포함)
    if (certContent.includes('mkcert') || certContent.includes('FiloSottile')) {
      certificateType = 'mkcert';
      console.log('🔐 mkcert 인증서를 찾았습니다. 정상적인 HTTPS 모드로 실행됩니다.');
      console.log('✅ 브라우저에서 "안전하지 않음" 경고가 나타나지 않습니다.');
    } else {
      certificateType = 'self-signed';
      console.log('🔐 자체 서명 인증서를 찾았습니다. HTTPS 모드로 실행됩니다.');
      console.log('⚠️  브라우저에서 "안전하지 않음" 경고가 나타날 수 있습니다.');
      console.log('💡 정상적인 인증서를 사용하려면: npm run setup:https:mkcert');
    }
    
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  } else {
    console.log('⚠️  HTTPS 인증서를 찾을 수 없습니다. HTTP 모드로 실행됩니다.');
    console.log('💡 HTTPS를 사용하려면:');
    console.log('   - 정상적인 인증서: npm run setup:https:mkcert');
    console.log('   - 자체 서명 인증서: npm run setup:https');
  }
} catch (error) {
  console.log('⚠️  HTTPS 인증서 로드 실패. HTTP 모드로 실행됩니다.');
  console.log('💡 인증서를 다시 생성하세요: npm run setup:https:mkcert');
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsOptions,
    port: 5173,
    host: "localhost", // 외부 접근 허용
    proxy: {
      // 백엔드 API 프록시 설정
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false, // HTTPS 백엔드가 아닌 경우
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // 푸시 알림 관련 API 프록시
      // '/push': {
      //   target: process.env.VITE_PUSH_API_URL || 'http://localhost:3001',
      //   changeOrigin: true,
      //   secure: false,
      //   rewrite: (path) => path.replace(/^\/push/, '/push'),
      // },
      // WebSocket 프록시 (실시간 알림용)
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  // preview: {
  //   https: httpsOptions,
  //   port: 4173,
  //   host: true,
  // },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
