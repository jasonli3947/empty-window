# 在项目目录中右键「使用 PowerShell 运行」或在终端执行: .\run-setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> npm install" -ForegroundColor Cyan
& npm.cmd install
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit $LASTEXITCODE" }

Write-Host "==> npm run update-data (Google Trends)" -ForegroundColor Cyan
& npm.cmd run update-data
if ($LASTEXITCODE -ne 0) { throw "update-data failed with exit $LASTEXITCODE" }

Write-Host "==> 完成。启动开发服务器请执行: npm run dev" -ForegroundColor Green
