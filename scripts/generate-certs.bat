@echo off
echo 🔐 SSL 인증서 생성 중...

REM certs 디렉토리 생성
if not exist "certs" mkdir certs

REM OpenSSL 명령어 실행
echo 개인키 생성 중...
openssl genrsa -out certs\localhost-key.pem 2048

if %errorlevel% neq 0 (
    echo ❌ OpenSSL이 설치되어 있지 않습니다.
    echo 💡 https://slproweb.com/products/Win32OpenSSL.html 에서 OpenSSL을 다운로드하세요.
    pause
    exit /b 1
)

echo 인증서 생성 중...
openssl req -new -x509 -key certs\localhost-key.pem -out certs\localhost.pem -days 365 -subj "/C=KR/ST=Seoul/L=Seoul/O=Development/OU=IT/CN=localhost"

if %errorlevel% neq 0 (
    echo ❌ 인증서 생성 실패
    pause
    exit /b 1
)

echo ✅ SSL 인증서가 성공적으로 생성되었습니다!
echo 📁 인증서 위치: certs\
echo 🔑 개인키: localhost-key.pem
echo 📜 인증서: localhost.pem
echo.
echo ⚠️  주의: 이 인증서는 개발용으로만 사용하세요.
echo    브라우저에서 "고급" → "localhost로 이동(안전하지 않음)"을 클릭하여 진행하세요.
echo.
pause
