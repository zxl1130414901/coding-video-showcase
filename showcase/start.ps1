# 代码转视频对比站 · 一键启动（Windows PowerShell）
# 用法：在 showcase 目录执行
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$App = Join-Path $Root 'app'
$DistIndex = Join-Path $App 'dist\index.html'
$PreviewUrl = 'http://127.0.0.1:4173/'
$Port = 4173

function Show-Menu {
  Clear-Host
  Write-Host ''
  Write-Host '  代码转视频 · 65 个开源项目横评' -ForegroundColor Cyan
  Write-Host '  ---------------------------------------------------'
  Write-Host '  [1] 直接打开离线版（无需 Node.js，双击式体验）'
  Write-Host '  [2] 启动本地预览服务（视频走 public\samples 目录联接）'
  Write-Host '  [0] 退出'
  Write-Host ''
}

function Pause-Menu {
  Write-Host ''
  Read-Host '按回车返回菜单' | Out-Null
}

function Assert-DistReady {
  if (-not (Test-Path -LiteralPath $DistIndex)) {
    Write-Host "[失败] 未找到构建产物：$DistIndex" -ForegroundColor Red
    Write-Host '       请先在 app 目录执行 npm ci 与 npm run build。' -ForegroundColor Yellow
    return $false
  }
  return $true
}

function Open-Offline {
  if (-not (Assert-DistReady)) { return }
  Write-Host '[启动] 正在用默认浏览器打开离线版…'
  Start-Process -FilePath $DistIndex
  Write-Host '[完成] 已打开 app\dist\index.html' -ForegroundColor Green
  Write-Host '       缩略图来自 dist\thumbs；视频来自 ../../../_samples。'
  Write-Host '       请保持 dist 目录在 app 下原位，不要只拷走 index.html。'
}

function Ensure-SampleLink {
  $PublicDir = Join-Path $App 'public'
  $Link = Join-Path $PublicDir 'samples'
  $Target = Join-Path (Split-Path -Parent $Root) '_samples'

  if (-not (Test-Path -LiteralPath $Target)) {
    throw "未找到样例目录：$Target（请确认 _samples 与 showcase 同级）"
  }
  if (-not (Test-Path -LiteralPath $PublicDir)) {
    New-Item -ItemType Directory -Path $PublicDir | Out-Null
  }

  $item = Get-Item -LiteralPath $Link -Force -ErrorAction SilentlyContinue
  if ($item) {
    if ($item.LinkType -eq 'Junction' -and ([string]$item.Target) -eq $Target) {
      Write-Host "[跳过] 目录联接已就绪：$Link → $Target" -ForegroundColor DarkGray
      return
    }
    if ($item.LinkType -in @('Junction', 'SymbolicLink')) {
      Write-Host "[重建] 现有联接指向不正确，正在重建：$Link" -ForegroundColor Yellow
      Remove-Item -LiteralPath $Link -Force
    } else {
      throw "public\samples 已存在且不是目录联接，请手动删除后重试：$Link"
    }
  }

  New-Item -ItemType Junction -Path $Link -Target $Target | Out-Null
  Write-Host "[完成] 已建立目录联接：$Link → $Target" -ForegroundColor Green
}

function Open-Preview {
  if (-not (Assert-DistReady)) { return }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Write-Host '[失败] 未检测到 Node.js。' -ForegroundColor Red
    Write-Host '       方案 A：返回菜单选择 [1] 直接打开离线版（无需 Node.js）。' -ForegroundColor Yellow
    Write-Host '       方案 B：安装 Node.js 18+ 后重试：https://nodejs.org/' -ForegroundColor Yellow
    return
  }

  $vite = Join-Path $App 'node_modules\vite\bin\vite.js'
  if (-not (Test-Path -LiteralPath $vite)) {
    Write-Host '[失败] 未找到本地依赖 vite。' -ForegroundColor Red
    Write-Host "       请先在 app 目录执行：npm ci" -ForegroundColor Yellow
    Write-Host "       目录：$App" -ForegroundColor Yellow
    return
  }

  try {
    Ensure-SampleLink
  } catch {
    Write-Host "[失败] $($_.Exception.Message)" -ForegroundColor Red
    return
  }

  $busy = $false
  try {
    $busy = Test-NetConnection -ComputerName '127.0.0.1' -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
  } catch {
    $busy = $false
  }
  if ($busy) {
    Write-Host "[提示] 端口 $Port 已有服务在监听，直接打开页面。" -ForegroundColor Yellow
    Start-Process -FilePath $PreviewUrl
    return
  }

  Write-Host "[启动] 预览服务：$PreviewUrl" -ForegroundColor Cyan
  Write-Host '       服务在后台运行，关闭本窗口不会停止它。'
  $proc = Start-Process -FilePath $node.Source `
    -ArgumentList @("`"$vite`"", 'preview', '--host', '127.0.0.1', '--port', "$Port", '--strictPort') `
    -WorkingDirectory $App -WindowStyle Hidden -PassThru

  $ready = $false
  $deadline = (Get-Date).AddSeconds(25)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
    try {
      $response = Invoke-WebRequest -Uri $PreviewUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {
      # 服务尚未就绪，继续等待
    }
  }

  if (-not $ready) {
    Write-Host '[失败] 预览服务启动超时。' -ForegroundColor Red
    Write-Host "       请手动在 app 目录执行 npm run preview 查看报错。"
    Write-Host "       若端口被占用，可先结束进程：Stop-Process -Id $($proc.Id) -ErrorAction SilentlyContinue"
    return
  }

  Start-Process -FilePath $PreviewUrl
  Write-Host '[完成] 已在浏览器打开预览页。' -ForegroundColor Green
  Write-Host "       停止服务：Stop-Process -Id $($proc.Id)" -ForegroundColor DarkGray
}

while ($true) {
  Show-Menu
  $choice = Read-Host '请输入序号'
  switch ($choice.Trim()) {
    '1' {
      try {
        Open-Offline
      } catch {
        Write-Host "[失败] $($_.Exception.Message)" -ForegroundColor Red
      }
      Pause-Menu
    }
    '2' {
      try {
        Open-Preview
      } catch {
        Write-Host "[失败] $($_.Exception.Message)" -ForegroundColor Red
      }
      Pause-Menu
    }
    '0' {
      Write-Host '已退出。'
      break
    }
    default {
      Write-Host '请输入 0、1 或 2。' -ForegroundColor Yellow
      Start-Sleep -Milliseconds 800
    }
  }
  if ($choice.Trim() -eq '0') { break }
}
