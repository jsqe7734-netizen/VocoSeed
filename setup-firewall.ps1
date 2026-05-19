# Vocoseed Firewall Setup
# 右键 -> 以管理员身份运行

Write-Host "正在添加防火墙规则..." -ForegroundColor Cyan

try {
    $rule = Get-NetFirewallRule -DisplayName "Vocoseed Dev" -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host "规则已存在，正在删除..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Vocoseed Dev"
    }
    
    New-NetFirewallRule -DisplayName "Vocoseed Dev" `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 5174 `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Host "防火墙规则已添加成功!" -ForegroundColor Green
    Write-Host "现在手机可以访问: http://10.22.66.36:5173" -ForegroundColor Cyan
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    Write-Host "请确保以管理员身份运行此脚本" -ForegroundColor Yellow
}

Read-Host "按 Enter 退出"
