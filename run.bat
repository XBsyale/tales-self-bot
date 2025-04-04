@echo off
title Tales SelfBot - Güncelleyici
color 0a
setlocal enabledelayedexpansion

:: Güncelleme kontrolü için özel bir dosya kullan
set UPDATE_FLAG_FILE=update_flag.tmp

:: Eğer güncelleme yapıldıysa bu dosya oluşur
if exist "%UPDATE_FLAG_FILE%" (
    del "%UPDATE_FLAG_FILE%"
    echo [~] Güncelleme sonrası ana uygulama başlatılıyor...
    goto start_app
)

echo.
echo [~] Tales SelfBot başlatılıyor...
echo [~] Güncellemeler kontrol ediliyor...

:: Güncelleme kontrolü yap
node -e "const updater = require('./updater'); updater().then(updated => process.exit(updated ? 1 : 0));"

if %errorlevel% equ 1 (
    echo [~] Güncelleme tamamlandı, yeniden başlatılıyor...
    echo 1 > "%UPDATE_FLAG_FILE%"
    timeout /t 3 /nobreak >nul
    start "" "%~dp0run.bat"
    exit
)

:start_app
echo [~] Ana uygulama başlatılıyor...
node main.js

if %errorlevel% neq 0 (
    echo.
    echo [!] Hata: Uygulamadan çıkış kodu %errorlevel%
    pause
)