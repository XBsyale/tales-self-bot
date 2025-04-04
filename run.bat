@echo off
title Tales SelfBot - Otomatik Güncelleyici
color 0a
set RESTART_FLAG=0

:start
echo.
echo [~] Tales SelfBot başlatılıyor...

if "%RESTART_FLAG%"=="1" (
    echo [~] Güncelleme sonrası yeniden başlatılıyor...
    set RESTART_FLAG=0
) else (
    echo [~] Güncellemeler kontrol ediliyor...
)

:: Güncelleme kontrolü yap
node -e "require('./updater').checkUpdates().then(updated=>{process.exit(updated?1:0)})"

:: Güncelleme yapıldıysa (exit code 1) flag'i ayarla ve yeniden başlat
if %errorlevel% equ 1 (
    set RESTART_FLAG=1
    echo [~] Güncelleme tamamlandı, yeniden başlatılıyor...
    timeout /t 3 /nobreak >nul
    goto start
)

:: Ana uygulamayı başlat
echo [~] Ana uygulama başlatılıyor...
node main.js

:: Hata durumunda konsolu açık tut
if %errorlevel% neq 0 (
    echo.
    echo [!] Hata: Uygulamadan çıkış kodu %errorlevel%
    pause
)