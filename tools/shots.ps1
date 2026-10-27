# Screenshots of built dashboards with headless Edge/Chrome (no extra install on Windows).
# Usage: pwsh tools/shots.ps1 -Out ..\screens -Shots "fs|index.html#/overview|overview", "ems|ems/index.html#/screener|screener"
# Each shot is taken at 1440x900 and 390x844. Keep screenshots OUT of the repo (they show deal data).
param([Parameter(Mandatory)][string]$Out, [Parameter(Mandatory)][string[]]$Shots, [int[]]$Widths = @(1440,390), [int]$Height = 0)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$browser = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe","$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe","$env:ProgramFiles\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if(-not $browser){ throw "Edge or Chrome not found" }
New-Item -ItemType Directory -Force $Out | Out-Null; $Out = (Resolve-Path $Out).Path
$prof = Join-Path $env:TEMP ("gpc-shots-" + [guid]::NewGuid().ToString('N'))
foreach($s in $Shots){
  $parts = $s.Split('|'); $key=$parts[0]; $rel=$parts[1]; $name=$parts[2]
  $file, $hash = $rel.Split('#',2)
  $url = 'file:///' + ((Join-Path $root $file) -replace '\\','/') + $(if($hash){ '#' + $hash } else { '' })
  foreach($w in $Widths){
    $h = if($Height){ $Height } elseif($w -lt 600){ 844 } else { 900 }
    $png = Join-Path $Out ("{0}-{1}-{2}.png" -f $key,$name,$w)
    $target = $url; $win = $w
    if($w -lt 600){ # headless windows have a minimum width: render inside a $w-wide iframe, then crop
      $frame = Join-Path $env:TEMP ("gpc-frame-" + [guid]::NewGuid().ToString('N') + ".html")
      [IO.File]::WriteAllText($frame, "<!doctype html><html><body style='margin:0'><iframe src='$url' style='border:0;width:${w}px;height:${h}px;display:block'></iframe></body></html>")
      $target = 'file:///' + ($frame -replace '\\','/'); $win = 600 }
    $args = @('--headless=new','--disable-gpu','--hide-scrollbars',"--user-data-dir=$prof","--window-size=$win,$h",'--virtual-time-budget=4000',"--screenshot=$png",$target)
    $p = Start-Process -FilePath $browser -ArgumentList $args -Wait -PassThru -WindowStyle Hidden
    if($w -lt 600 -and (Test-Path $png)){ Add-Type -AssemblyName System.Drawing; $src=[Drawing.Bitmap]::FromFile($png); $crop=$src.Clone((New-Object Drawing.Rectangle 0,0,$w,$h),$src.PixelFormat); $src.Dispose(); $crop.Save($png,[Drawing.Imaging.ImageFormat]::Png); $crop.Dispose(); Remove-Item $frame -ErrorAction SilentlyContinue }
    if(Test-Path $png){ "{0,-40} {1,6:N0} KB" -f (Split-Path $png -Leaf), ((Get-Item $png).Length/1KB) } else { "FAILED $png" }
  }
}
Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
