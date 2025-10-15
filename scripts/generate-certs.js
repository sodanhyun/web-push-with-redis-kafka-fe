import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// certs 디렉토리 생성
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

console.log('🔐 SSL 인증서 생성 중...');

try {
  // OpenSSL을 사용하여 자체 서명 인증서 생성
  const keyPath = path.join(certsDir, 'localhost-key.pem');
  const certPath = path.join(certsDir, 'localhost.pem');

  // 개인키 생성
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

  // 인증서 생성 (365일 유효)
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/OU=IT/CN=localhost"`, { stdio: 'inherit' });

  console.log('✅ SSL 인증서가 성공적으로 생성되었습니다!');
  console.log(`📁 인증서 위치: ${certsDir}`);
  console.log('🔑 개인키: localhost-key.pem');
  console.log('📜 인증서: localhost.pem');
  console.log('');
  console.log('⚠️  주의: 이 인증서는 개발용으로만 사용하세요.');
  console.log('   브라우저에서 "고급" → "localhost로 이동(안전하지 않음)"을 클릭하여 진행하세요.');

} catch (error) {
  console.error('❌ SSL 인증서 생성 실패:', error.message);
  console.log('');
  console.log('💡 해결 방법:');
  console.log('1. OpenSSL이 설치되어 있는지 확인하세요.');
  console.log('2. Windows: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('3. macOS: brew install openssl');
  console.log('4. Linux: sudo apt-get install openssl');
  process.exit(1);
}
