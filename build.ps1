# Builds each dashboard into ONE self-contained HTML file (fonts, logo, styles, scripts and data inlined; works offline).
# Usage:  pwsh ./build.ps1            (Windows PowerShell 5.1 or PowerShell 7; no other tools needed besides git)
# Data files are inlined verbatim; the previous snapshot (for "what changed") comes from git history.
param([string[]]$Only)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false
function ReadText($p){ [IO.File]::ReadAllText((Join-Path $root $p), [Text.Encoding]::UTF8) }
function B64($p){ [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $root $p))) }

$dashboards = @(
  @{ key='fs';  short='Listed FS';   out='index.html';     adapter='src/fs/adapter.js';  primary='market.js';
     files=@('data.js','market.js','diligence.js','shortlist.js','team.js') },
  @{ key='ems'; short='EMS targets'; out='ems/index.html'; adapter='src/ems/adapter.js'; primary='ems/data.js';
     files=@('ems/data.js','ems/shortlist.js','team.js') }
)

function GitBytes([string[]]$argList){
  $psi = New-Object Diagnostics.ProcessStartInfo 'git'
  $psi.Arguments = ($argList | ForEach-Object { if($_ -match '\s'){ '"' + $_ + '"' } else { $_ } }) -join ' '
  $psi.WorkingDirectory = $root; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true; $psi.UseShellExecute = $false
  $p = [Diagnostics.Process]::Start($psi); $ms = New-Object IO.MemoryStream; $p.StandardOutput.BaseStream.CopyTo($ms); $null = $p.StandardError.ReadToEnd(); $p.WaitForExit()
  $script:gitExit = $p.ExitCode; if($p.ExitCode -ne 0){ return $null }; return ,$ms.ToArray()
}
function GitText([string[]]$a){ $b = GitBytes $a; if($null -eq $b){ return $null }; return $utf8.GetString($b).Trim() }

$css = (ReadText 'kit/tokens.css') + "`n" + (ReadText 'kit/base.css') + "`n" + (ReadText 'kit/ui.css') + "`n" + (ReadText 'kit/pipeline.css')
$fonts = "@font-face{font-family:'Heebo';font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,$(B64 'kit/fonts/heebo-latin-var.woff2')) format('woff2')}`n" +
         "@font-face{font-family:'Martel';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,$(B64 'kit/fonts/martel-latin-400.woff2')) format('woff2')}`n" +
         "@font-face{font-family:'Martel';font-style:normal;font-weight:700;font-display:swap;src:url(data:font/woff2;base64,$(B64 'kit/fonts/martel-latin-700.woff2')) format('woff2')}"
$logo = "data:image/png;base64," + (B64 'brand/logo.png')
$favicon = "data:image/png;base64," + (B64 'brand/favicon.png')
$kitJs = @('kit/charts.js','kit/charts-x.js','kit/model.js','kit/xlsx.js','kit/pipeline.js','kit/pipeline-ui.js') | ForEach-Object { ReadText $_ }
$appJs = ReadText 'kit/app.js'

function Bundle($files, $getText){
  $sb = New-Object Text.StringBuilder
  [void]$sb.Append("(function(){var window={};`n")
  foreach($f in $files){ $t = & $getText $f; if($null -ne $t){ [void]$sb.Append("/* ---- $f ---- */`n").Append(($t -replace "</(script)", "<\/$1")).Append("`n;`n") } }
  [void]$sb.Append("return window;})()")
  $sb.ToString()
}

foreach($d in $dashboards){
  if($Only -and ($Only -notcontains $d.key)){ continue }
  $cur = Bundle $d.files { param($f) $p = Join-Path $root $f; if(Test-Path $p){ [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8) } else { $null } }
  # previous snapshot = parent of the last commit that changed the primary data file
  $prev = 'null'; $prevLabel = 'null'
  $last = GitText @('log','-n','1','--format=%H','--',$d.primary)
  if($last){
    $null = GitBytes @('cat-file','-e',"$last^:$($d.primary)"); if($script:gitExit -eq 0){
      $prev = Bundle $d.files { param($f) $b = GitBytes @('show',"$last^:$f"); if($null -eq $b){ $null } else { $utf8.GetString($b) } }
      $prevLabel = '"' + (GitText @('log','-1','--format=%cd','--date=format:%d %b %Y %H:%M',"$last^")) + '"'
    }
  }
  $built = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  # links to the other dashboards, relative to this output file
  $depth = ($d.out.Split('/').Count - 1); $up = ('../' * $depth)
  $sib = ($dashboards | ForEach-Object { '{"key":"' + $_.key + '","label":"' + $_.short + '","href":"' + $(if($_.key -eq $d.key){ (Split-Path $d.out -Leaf) } else { $up + $_.out }) + '"}' }) -join ','
  $html = @"
<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="generator" content="gpc-dashboard-kit $built">
<title>Greater Pacific - dashboard</title>
<link rel="icon" type="image/png" href="$favicon">
<style>$fonts
$css</style>
<script>window.__ERRORS=[];addEventListener("error",function(e){window.__ERRORS.push(String(e.message||e))});</script>
</head>
<body>
<noscript>This dashboard needs JavaScript.</noscript>
<script>window.DATA={logo:"$logo",built:"$built",prevLabel:$prevLabel,key:"$($d.key)",siblings:[$sib]};
window.DATA.cur=$cur;
window.DATA.prev=$prev;</script>
<script>$($kitJs -join "`n")</script>
<script>$(ReadText $d.adapter)</script>
<script>$appJs</script>
</body>
</html>
"@
  $outPath = Join-Path $root $d.out
  New-Item -ItemType Directory -Force (Split-Path $outPath) | Out-Null
  [IO.File]::WriteAllText($outPath, $html, $utf8)
  "{0,-4} -> {1,-15} {2,8:N0} KB  prev snapshot: {3}" -f $d.key, $d.out, ((Get-Item $outPath).Length/1KB), $(if($prev -eq 'null'){'none'}else{$prevLabel})
}
