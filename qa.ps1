# Static QA for the dashboard kit. Run after build.ps1.   pwsh ./qa.ps1   -> exit 1 on any failure.
# Browser checks (every page and company renders, numbers match the model) live in tools/qa-browser.js.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot; $fail = 0; $warn = 0
function Pass($m){ Write-Output "  PASS  $m" }
function Fail($m){ Write-Output "  FAIL  $m"; $script:fail++ }
function Warn($m){ Write-Output "  WARN  $m"; $script:warn++ }
function Txt($p){ [IO.File]::ReadAllText((Join-Path $root $p), [Text.Encoding]::UTF8) }

Write-Output "1. Design tokens: no literal colours, font sizes or spacing outside kit/tokens.css"
$src = @(Get-ChildItem (Join-Path $root 'kit') -File | Where-Object { $_.Extension -in '.css','.js' -and $_.Name -ne 'tokens.css' } | ForEach-Object { 'kit/' + $_.Name }) + (Get-ChildItem (Join-Path $root 'src') -Recurse -Filter *.js | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') })
foreach($f in $src){
  $t = Txt $f; $lines = $t -split "`n"
  for($i=0; $i -lt $lines.Count; $i++){ $l = $lines[$i]
    if($l -match '#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Za-z_-])' -and $l -notmatch 'href="#|"#/|`#/|#/|#\$\{|getElementById|querySelector|#(main|pack|sc|res|fp|tip|toast|search|side)') { Fail "${f}:$($i+1) literal hex colour: $($l.Trim().Substring(0,[Math]::Min(100,$l.Trim().Length)))" }
    if($l -match 'rgba?\(\s*\d') { Fail "${f}:$($i+1) literal rgb() colour" }
    if($f -like '*.css' -and $l -match 'font-size:\s*[0-9]') { Fail "${f}:$($i+1) literal font-size" }
    if($f -like '*.css' -and $l -match '(padding|margin|gap|row-gap|column-gap)[a-z-]*:\s*[^;]*\b[1-9][0-9.]*(px|rem|em)\b') { Fail "${f}:$($i+1) literal spacing: $($l.Trim().Substring(0,[Math]::Min(100,$l.Trim().Length)))" }
    if($f -like '*.js' -and $l -match 'font-size:\s*[0-9]') { Fail "${f}:$($i+1) literal font-size in JS" }
  }
}
if($fail -eq 0){ Pass "no literal colours / font sizes / spacing in $($src.Count) source files" }

Write-Output "2. Built files are self-contained and offline"
$outs = @('index.html','ems/index.html')
foreach($o in $outs){
  $p = Join-Path $root $o; if(-not (Test-Path $p)){ Fail "$o missing (run build.ps1)"; continue }
  $h = Txt $o
  if($h -match '<script[^>]+src=') { Fail "$o loads an external script" }
  if($h -match '<link[^>]+href="https?:') { Fail "$o loads an external stylesheet" }
  if($h -match 'url\((["'']?)https?:') { Fail "$o references an external url() resource" }
  if($h -match '@import') { Fail "$o uses @import" }
  if($h -match 'fonts\.googleapis|fonts\.gstatic|cdnjs|jsdelivr|unpkg') { Fail "$o references a CDN" }
  $kb = [math]::Round((Get-Item $p).Length/1KB)
  if($kb -gt 2048){ Warn "$o is $kb KB" } else { Pass "$o is self-contained ($kb KB)" }
}

Write-Output "3. Data files are embedded verbatim (no number touched by the build)"
$map = @{ 'index.html'=@('data.js','market.js','diligence.js','shortlist.js'); 'ems/index.html'=@('ems/data.js','ems/shortlist.js') }
foreach($o in $map.Keys){ $h = Txt $o
  foreach($d in $map[$o]){ $t = (Txt $d) -replace '</(script)', '<\/$1'; if($h.Contains($t)){ Pass "$d embedded verbatim in $o" } else { Fail "$d is not embedded verbatim in $o" } } }

Write-Output "4. Palette contrast and colour-blind report"
& (Join-Path $root 'tools/palette-check.ps1') *> $null
if($LASTEXITCODE -eq 0){ Pass "palette checks pass (docs/palette-report.txt)" } else { Fail "palette check failed (see docs/palette-report.txt)" }

Write-Output "5. Scripts are ASCII (Windows PowerShell 5.1 reads them as ANSI)"
Get-ChildItem $root -Recurse -Include *.ps1 | Where-Object { $_.FullName -notmatch '\\.git\\' } | ForEach-Object { $b=[IO.File]::ReadAllBytes($_.FullName); if(($b | Where-Object { $_ -gt 127 }).Count){ Fail "$($_.Name) has non-ASCII bytes" } else { Pass "$($_.Name) ASCII" } }

Write-Output "6. Nothing confidential in public metadata"
$issueTitle = Txt 'kit/app.js'
if($issueTitle -match 'title=\$\{encodeURIComponent\(`Diligence: \$\{'){ Fail "diligence issue title contains the company name" } else { Pass "diligence issue titles carry no company name" }

Write-Output ""
if($fail){ Write-Output "QA FAILED: $fail failure(s), $warn warning(s)"; exit 1 } else { Write-Output "QA PASSED ($warn warning(s))" }
