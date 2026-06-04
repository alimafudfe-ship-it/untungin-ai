@echo off
echo ====================================================
echo   MEMBERSIHKAN TOTAL CACHE KORUP UNTUNGIN.AI
echo ====================================================
taskkill /f /im node.exe >nul 2>&1
echo [*] Berhasil menghentikan semua proses Node.js yang tersangkut.

echo [*] Menghapus folder .next lokal proyek...
if exist .next rmdir /s /q .next

echo [*] Menghapus folder .turbo...
if exist .turbo rmdir /s /q .turbo

echo [*] Menghapus sisa dump berkas panik Next di Windows Temp...
del /q /f /s "%TEMP%\next-panic-*" >nul 2>&1

echo [*] Membersihkan cache npm secara paksa...
call npm cache clean --force

echo ====================================================
echo   PEMBERSIHAN SELESAI! SILAKAN JALANKAN SERVER BARU
echo ====================================================
pause