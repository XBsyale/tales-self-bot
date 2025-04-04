@echo off
title Tales SelfBot - Otomatik Güncelleyici
color 0a
echo.
echo [~] Tales SelfBot baslatiliyor...
echo [~] Guncellemeler kontrol ediliyor...

:: Güncelleme işlemi için Node'u çalıştır
node -e "require('./updater').checkUpdates().then(updated=>{process.exit(updated?1:0)})"

:: Güncelleme yapıldıysa (exit code 1) scripti yeniden başlat
if %errorlevel% equ 1 (
    echo [~] Guncelleme tamamlandi, yeniden baslatiliyor...
    timeout /t 3 /nobreak >nul
    start "" "%~dp0run.bat"
    exit
)

:: Ana uygulamayı başlat
echo [~] Main uygulamasi baslatiliyor...
node main.js

:: Hata durumunda konsolu açık tut
if %errorlevel% neq 0 (
    echo.
    echo [!] Hata: Uygulamadan cikis kodu %errorlevel%
    pause
)