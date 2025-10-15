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

console.log('🔐 mkcert를 사용한 SSL 인증서 생성 중...');

// mkcert 설치 확인
function checkMkcertInstalled() {
  try {
    execSync('mkcert -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// mkcert 설치 안내
function showMkcertInstallInstructions() {
  console.log('❌ mkcert가 설치되어 있지 않습니다.');
  console.log('');
  console.log('📦 mkcert 설치 방법:');
  console.log('');
  console.log('Windows (Chocolatey):');
  console.log('  choco install mkcert');
  console.log('');
  console.log('Windows (Scoop):');
  console.log('  scoop bucket add extras');
  console.log('  scoop install mkcert');
  console.log('');
  console.log('Windows (수동 설치):');
  console.log('  1. https://github.com/FiloSottile/mkcert/releases 에서 다운로드');
  console.log('  2. mkcert-v1.4.4-windows-amd64.exe를 mkcert.exe로 이름 변경');
  console.log('  3. PATH에 추가하거나 프로젝트 폴더에 복사');
  console.log('');
  console.log('macOS (Homebrew):');
  console.log('  brew install mkcert');
  console.log('');
  console.log('Linux (Ubuntu/Debian):');
  console.log('  sudo apt install libnss3-tools');
  console.log('  wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64');
  console.log('  chmod +x mkcert');
  console.log('  sudo mv mkcert /usr/local/bin/');
  console.log('');
  console.log('설치 후 다시 실행하세요: npm run setup:https:mkcert');
}

// mkcert CA 설치 확인
function checkMkcertCA() {
  try {
    execSync('mkcert -CAROOT', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// mkcert CA 설치
function installMkcertCA() {
  try {
    console.log('🔧 mkcert CA를 설치하는 중...');
    execSync('mkcert -install', { stdio: 'inherit' });
    console.log('✅ mkcert CA가 성공적으로 설치되었습니다!');
    return true;
  } catch (error) {
    console.error('❌ mkcert CA 설치 실패:', error.message);
    return false;
  }
}

// 인증서 생성
function generateCertificates() {
  try {
    const keyPath = path.join(certsDir, 'localhost-key.pem');
    const certPath = path.join(certsDir, 'localhost.pem');
    
    console.log('📜 localhost 인증서를 생성하는 중...');
    
    // mkcert로 인증서 생성
    execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, {
      stdio: 'inherit',
      cwd: certsDir
    });
    
    console.log('✅ mkcert 인증서가 성공적으로 생성되었습니다!');
    console.log(`📁 인증서 위치: ${certsDir}`);
    console.log('🔑 개인키: localhost-key.pem');
    console.log('📜 인증서: localhost.pem');
    console.log('');
    console.log('🎉 이제 브라우저에서 "안전하지 않음" 경고 없이 접속할 수 있습니다!');
    console.log('🌐 https://localhost:5173 에서 테스트하세요.');
    
    return true;
  } catch (error) {
    console.error('❌ 인증서 생성 실패:', error.message);
    return false;
  }
}

// 메인 실행
async function main() {
  // mkcert 설치 확인
  if (!checkMkcertInstalled()) {
    showMkcertInstallInstructions();
    process.exit(1);
  }
  
  // mkcert CA 설치 확인 및 설치
  if (!checkMkcertCA()) {
    if (!installMkcertCA()) {
      process.exit(1);
    }
  } else {
    console.log('✅ mkcert CA가 이미 설치되어 있습니다.');
  }
  
  // 인증서 생성
  if (!generateCertificates()) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 예상치 못한 오류:', error);
  process.exit(1);
});
