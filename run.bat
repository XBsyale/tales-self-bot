@echo off
title Tales SelfBot - Güncelleyici
color 0a
cd /d "%~dp0"
node -e "require('./updater')()"
pause