# 通过 NTFS 目录联接（Junction）把全局样例目录映射到 public\samples。
# 这样构建产物不需要复制视频文件，预览与开发环境都能直接播放。
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 目标路径由目录结构推导，避免脚本内出现中文路径字面量导致的编码问题。
$appRoot = Split-Path -Parent $PSScriptRoot
$videoRoot = Split-Path -Parent (Split-Path -Parent $appRoot)
$target = Join-Path $videoRoot '_samples'
$publicDir = Join-Path $appRoot 'public'
$linkPath = Join-Path $publicDir 'samples'

if (-not (Test-Path -LiteralPath $target)) {
  Write-Error "样例目录不存在：$target"
  exit 1
}

New-Item -ItemType Directory -Force -Path $publicDir | Out-Null

# 已存在联接时检查指向是否正确，正确则跳过，错误则先移除再重建。
if (Test-Path -LiteralPath $linkPath) {
  $item = Get-Item -LiteralPath $linkPath -Force
  if ($item.LinkType -eq 'Junction' -and $item.Target -eq $target) {
    Write-Host "已存在，跳过：$linkPath -> $target"
    exit 0
  }
  if ($item.LinkType -eq 'Junction') {
    Write-Host "发现指向错误的联接，正在重建：$linkPath"
    cmd /c rmdir "$linkPath" | Out-Null
  } else {
    Write-Error "public\samples 已存在且不是目录联接，请手动处理后重试：$linkPath"
    exit 1
  }
}

New-Item -ItemType Junction -Path $linkPath -Target $target | Out-Null
Write-Host "已创建 junction：$linkPath -> $target"
