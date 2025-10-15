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

// 간단한 자체 서명 인증서 생성 (Node.js 내장 기능 사용)
let forge;
try {
  const forgeModule = await import('node-forge');
  forge = forgeModule.default;
} catch (error) {
  console.error('❌ node-forge 모듈 로드 실패:', error.message);
  console.log('');
  console.log('💡 대안 방법:');
  console.log('1. OpenSSL 설치: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('2. 또는 HTTP 모드로 개발: npm run dev');
  process.exit(1);
}

try {
  // 키 쌍 생성
  const keys = forge.pki.rsa.generateKeyPair(2048);
  
  // 인증서 생성
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
  const attrs = [{
    name: 'commonName',
    value: 'localhost'
  }, {
    name: 'countryName',
    value: 'KR'
  }, {
    shortName: 'ST',
    value: 'Seoul'
  }, {
    name: 'localityName',
    value: 'Seoul'
  }, {
    name: 'organizationName',
    value: 'Development'
  }];
  
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);
  
  // 파일로 저장
  const keyPath = path.join(certsDir, 'localhost-key.pem');
  const certPath = path.join(certsDir, 'localhost.pem');
  
  fs.writeFileSync(keyPath, forge.pki.privateKeyToPem(keys.privateKey));
  fs.writeFileSync(certPath, forge.pki.certificateToPem(cert));
  
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
  console.log('1. OpenSSL 설치: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('2. 또는 HTTP 모드로 개발: npm run dev');
  process.exit(1);
}
