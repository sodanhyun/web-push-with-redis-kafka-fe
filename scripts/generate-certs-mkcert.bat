@echo off
echo 🔐 mkcert를 사용한 SSL 인증서 생성 중...

REM certs 디렉토리 생성
if not exist "certs" mkdir certs

REM mkcert 설치 확인
mkcert -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ mkcert가 설치되어 있지 않습니다.
    echo.
    echo 📦 mkcert 설치 방법:
    echo.
    echo Windows (Chocolatey):
    echo   choco install mkcert
    echo.
    echo Windows (Scoop):
    echo   scoop bucket add extras
    echo   scoop install mkcert
    echo.
    echo Windows (수동 설치):
    echo   1. https://github.com/FiloSottile/mkcert/releases 에서 다운로드
    echo   2. mkcert-v1.4.4-windows-amd64.exe를 mkcert.exe로 이름 변경
    echo   3. PATH에 추가하거나 프로젝트 폴더에 복사
    echo.
    pause
    exit /b 1
)

echo ✅ mkcert가 설치되어 있습니다.

REM mkcert CA 설치 확인
mkcert -CAROOT >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 mkcert CA를 설치하는 중...
    mkcert -install
    if %errorlevel% neq 0 (
        echo ❌ mkcert CA 설치 실패
        pause
        exit /b 1
    )
    echo ✅ mkcert CA가 성공적으로 설치되었습니다!
) else (
    echo ✅ mkcert CA가 이미 설치되어 있습니다.
)

REM 인증서 생성
echo 📜 localhost 인증서를 생성하는 중...
mkcert -key-file certs\localhost-key.pem -cert-file certs\localhost.pem localhost 127.0.0.1 ::1

if %errorlevel% neq 0 (
    echo ❌ 인증서 생성 실패
    pause
    exit /b 1
)

echo ✅ mkcert 인증서가 성공적으로 생성되었습니다!
echo 📁 인증서 위치: certs\
echo 🔑 개인키: localhost-key.pem
echo 📜 인증서: localhost.pem
echo.
echo 🎉 이제 브라우저에서 "안전하지 않음" 경고 없이 접속할 수 있습니다!
echo 🌐 https://localhost:5173 에서 테스트하세요.
echo.
pause
