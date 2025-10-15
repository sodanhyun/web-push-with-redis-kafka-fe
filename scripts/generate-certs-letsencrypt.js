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

console.log('🔐 Let\'s Encrypt 로컬 개발용 인증서 생성 중...');

// certbot 설치 확인
function checkCertbotInstalled() {
  try {
    execSync('certbot --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// certbot 설치 안내
function showCertbotInstallInstructions() {
  console.log('❌ certbot이 설치되어 있지 않습니다.');
  console.log('');
  console.log('📦 certbot 설치 방법:');
  console.log('');
  console.log('Windows:');
  console.log('  1. https://certbot.eff.org/instructions?ws=other&os=windows 에서 다운로드');
  console.log('  2. 또는 pip install certbot');
  console.log('');
  console.log('macOS (Homebrew):');
  console.log('  brew install certbot');
  console.log('');
  console.log('Linux (Ubuntu/Debian):');
  console.log('  sudo apt install certbot');
  console.log('');
  console.log('Linux (CentOS/RHEL):');
  console.log('  sudo yum install certbot');
  console.log('');
  console.log('💡 대안: mkcert 사용을 권장합니다 (npm run setup:https:mkcert)');
}

// 로컬 개발용 인증서 생성 (실제 도메인 필요)
function generateLocalCertificates() {
  try {
    const keyPath = path.join(certsDir, 'localhost-key.pem');
    const certPath = path.join(certsDir, 'localhost.pem');
    
    console.log('📜 로컬 개발용 인증서를 생성하는 중...');
    console.log('⚠️  주의: 이 방법은 실제 도메인이 필요합니다.');
    console.log('');
    
    // 실제 도메인을 입력받아야 함
    const domain = 'localhost'; // 실제로는 사용자 입력 필요
    
    // certbot으로 인증서 생성 (실제 도메인 필요)
    console.log('실제 도메인을 사용한 Let\'s Encrypt 인증서 생성은 복잡합니다.');
    console.log('로컬 개발용으로는 mkcert를 사용하는 것을 권장합니다.');
    
    return false;
  } catch (error) {
    console.error('❌ 인증서 생성 실패:', error.message);
    return false;
  }
}

// 메인 실행
async function main() {
  // certbot 설치 확인
  if (!checkCertbotInstalled()) {
    showCertbotInstallInstructions();
    process.exit(1);
  }
  
  // 인증서 생성
  if (!generateLocalCertificates()) {
    console.log('');
    console.log('💡 권장사항:');
    console.log('로컬 개발용으로는 mkcert를 사용하세요:');
    console.log('  npm run setup:https:mkcert');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 예상치 못한 오류:', error);
  process.exit(1);
});
