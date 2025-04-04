@echo off
title Tales SelfBot - Güncelleyici
color 0a
cd /d "%~dp0"
node -e "require('./updater').checkUpdates().catch(err=>{console.error(err);process.exit(1)})"
pause