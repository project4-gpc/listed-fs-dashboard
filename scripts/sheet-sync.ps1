# Reads ONE named tab of a workbook (the shared Google Sheet's published .xlsx link, or a local .xlsx) and writes
# ems/data.js in the exact format the EMS dashboard uses. No other tab is ever read. Numbers are copied as stored
# (rounded to 3 decimals, as the original sync did); nothing is recomputed. When the tab looks broken (missing
# columns, no rows, or most rows gone) it writes nothing and exits with an error, so a bad edit never reaches the
# dashboard. Logs name rows and columns only, never companies or figures (Actions logs of a public repo are public).
#
# Usage: pwsh scripts/sheet-sync.ps1 -Source <url or path> [-Out ems/data.js] [-Sheet 'Consol Target Outreach List']
#        [-Label 'Google Sheet'] [-HeartbeatHours 20] [-Force]
# Writes "changed=true|false" to $GITHUB_OUTPUT when run in GitHub Actions.
param(
  [Parameter(Mandatory)][string]$Source,
  [string]$Out = 'ems/data.js',
  [string]$Sheet = 'Consol Target Outreach List',
  [string]$Label = 'Google Sheet',
  [double]$HeartbeatHours = 20,
  [switch]$Force
)
$ErrorActionPreference = 'Stop'
$inv = [Globalization.CultureInfo]::InvariantCulture
$root = Split-Path $PSScriptRoot
if(-not [IO.Path]::IsPathRooted($Out)){ $Out = Join-Path $root $Out }
$tzId = if($IsLinux -or $IsMacOS){ 'Asia/Kolkata' } else { 'India Standard Time' }
$ist = [TimeZoneInfo]::FindSystemTimeZoneById($tzId)
$now = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $ist)
function Fmt($d){ $d.ToString('d MMM yyyy, HH:mm', $inv) }
function Say($m){ Write-Output $m }
function Stop-Sync($m){ Write-Output "NOT PUBLISHED: $m"; if($env:GITHUB_OUTPUT){ Add-Content -Path $env:GITHUB_OUTPUT -Value 'changed=false' }; exit 1 }

# ---- 1. get the workbook ----
$fromUrl = $Source -match '^https?://'
$tmp = Join-Path ([IO.Path]::GetTempPath()) ('sheet_' + [guid]::NewGuid().ToString('N') + '.xlsx')
try {
  if($fromUrl){ Invoke-WebRequest -Uri $Source -OutFile $tmp -UseBasicParsing -MaximumRedirection 10 | Out-Null }
  else { Copy-Item -LiteralPath $Source -Destination $tmp }
} catch { Stop-Sync "could not download the sheet ($($_.Exception.Message.Split([char]10)[0]))" }
$head = [IO.File]::ReadAllBytes($tmp) | Select-Object -First 2
if(-not ($head.Count -eq 2 -and $head[0] -eq 0x50 -and $head[1] -eq 0x4B)){
  Remove-Item $tmp -ErrorAction SilentlyContinue
  Stop-Sync "the link did not return an Excel file. In Google Sheets use File > Share > Publish to web, pick the tab, choose Microsoft Excel (.xlsx) and copy that link."
}

# ---- 2. read only the named tab ----
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($tmp)
function Get-Xml($name){ $e = $zip.GetEntry($name); if(-not $e){ return $null }; $r = New-Object System.IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close(); [xml]$t }
try {
  $wb = Get-Xml 'xl/workbook.xml'
  $sh = $wb.workbook.sheets.sheet | Where-Object { $_.name.Trim() -eq $Sheet }
  if(-not $sh){ Stop-Sync "no tab named '$Sheet' in the published file. Rename the tab back, or publish the right tab." }
  $rid = $sh.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $rels = Get-Xml 'xl/_rels/workbook.xml.rels'
  $target = (($rels.Relationships.Relationship | Where-Object { $_.Id -eq $rid }).Target) -replace '^/xl/','' -replace '^/',''
  $sst = New-Object System.Collections.ArrayList
  $ss = Get-Xml 'xl/sharedStrings.xml'; if($ss){ foreach($si in $ss.sst.si){ [void]$sst.Add((($si.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join '')) } }
  $ws = Get-Xml ('xl/' + $target)
  function CellVal($c){ if($c.t -eq 's'){ return $sst[[int]$c.v] } elseif($c.t -eq 'inlineStr'){ return $c.is.InnerText } elseif($c.t -eq 'b'){ if("$($c.v)" -eq '1'){ return 'TRUE' } else { return 'FALSE' } } else { return $c.v } }
  function Num($v){ if($v -eq $null -or "$v".Trim() -eq ''){ return $null }; $d=0.0; if([double]::TryParse("$v",[Globalization.NumberStyles]::Float,$inv,[ref]$d)){ return [math]::Round($d,3) }; return $null }
  $hdr=@{}; $recs = New-Object System.Collections.ArrayList; $warn = New-Object System.Collections.ArrayList
  foreach($row in $ws.worksheet.sheetData.row){
    $h=@{}; foreach($c in $row.c){ $h[($c.r -replace '\d','')] = CellVal $c }
    if(-not $hdr.Count){ foreach($k in $h.Keys){ $t = "$($h[$k])".ToLower()
        if($t -match '^company'){ $hdr.n=$k } elseif($t -match '^segment'){ $hdr.seg=$k } elseif($t -match 'business desc'){ $hdr.d=$k }
        elseif($t -match '^revenue'){ $hdr.r=$k } elseif($t -match '^ebitda'){ $hdr.e=$k } elseif($t -match '^net profit'){ $hdr.p=$k } elseif($t -match 'evaluated'){ $hdr.ev=$k } }
      if($hdr.n -and $hdr.seg){ continue } else { $hdr=@{}; continue } }
    $name = "$($h[$hdr.n])".Trim() -replace '\s*\r?\n\s*',' '
    if(-not $name){ continue }
    foreach($k in 'r','e','p'){ $raw = "$($h[$hdr[$k]])".Trim(); if($raw -and $null -eq (Num $raw)){ [void]$warn.Add("row $($row.r): '$k' column is not a number") } }
    $seg = "$($h[$hdr.seg])".Trim(); if(-not $seg){ $seg='Unclassified' }
    [void]$recs.Add([ordered]@{ n=$name; seg=$seg; d=("$($h[$hdr.d])".Trim() -replace '\s+',' '); r=(Num $h[$hdr.r]); e=(Num $h[$hdr.e]); p=(Num $h[$hdr.p]); ev=("$($h[$hdr.ev])".Trim() -match '^(y|true)') })
  }
} finally { $zip.Dispose(); Remove-Item $tmp -ErrorAction SilentlyContinue }

# ---- 3. checks: never publish a broken tab ----
$names = @{ n='Company'; seg='Segment'; d='Business description'; r='Revenue'; e='EBITDA'; p='Net profit'; ev='Whether evaluated?' }
if(-not $hdr.Count){ Stop-Sync "no header row with 'Company' and 'Segment' columns in '$Sheet'." }
$missing = @('d','r','e','p','ev' | Where-Object { -not $hdr[$_] } | ForEach-Object { $names[$_] })
if($missing.Count){ Stop-Sync ("column(s) not found: " + ($missing -join ', ') + ". Column headings must start with these words.") }
if($recs.Count -eq 0){ Stop-Sync "the tab has no company rows." }
$old = if(Test-Path $Out){ [IO.File]::ReadAllText($Out, [Text.Encoding]::UTF8) } else { '' }
$oldCount = ([regex]::Matches($old, '\{"n":')).Count
if($oldCount -gt 0 -and $recs.Count -lt [math]::Ceiling($oldCount * 0.5) -and -not $Force){
  Stop-Sync "only $($recs.Count) companies in the tab, down from $oldCount. If that is intended, run the sync again with 'force'."
}
$dups = @($recs | Group-Object { $_.n } | Where-Object { $_.Count -gt 1 }).Count
if($dups){ [void]$warn.Add("$dups company name(s) appear more than once") }
foreach($w in ($warn | Select-Object -First 12)){ Say "  warning: $w" }
if($warn.Count -gt 12){ Say "  ... and $($warn.Count - 12) more warnings" }

# ---- 4. serialise exactly as before (same escaping as the original sync: & ' < > as \u00xx) ----
function JStr([string]$s){
  $sb = New-Object Text.StringBuilder; [void]$sb.Append('"')
  foreach($ch in $s.ToCharArray()){ $c = [int]$ch
    if($c -eq 34){ [void]$sb.Append('\"') } elseif($c -eq 92){ [void]$sb.Append('\\') }
    elseif($c -eq 8){ [void]$sb.Append('\b') } elseif($c -eq 12){ [void]$sb.Append('\f') } elseif($c -eq 10){ [void]$sb.Append('\n') } elseif($c -eq 13){ [void]$sb.Append('\r') } elseif($c -eq 9){ [void]$sb.Append('\t') }
    elseif($c -lt 32 -or $c -eq 38 -or $c -eq 39 -or $c -eq 60 -or $c -eq 62){ [void]$sb.Append('\u' + $c.ToString('x4')) }
    else { [void]$sb.Append($ch) } }
  [void]$sb.Append('"'); $sb.ToString()
}
function JNum($v){ if($null -eq $v){ return 'null' }; $d = [double]$v; if($d -eq 0){ return '0' }; $d.ToString('R', $inv) }
$items = foreach($r in $recs){ '{"n":' + (JStr $r.n) + ',"seg":' + (JStr $r.seg) + ',"d":' + (JStr $r.d) + ',"r":' + (JNum $r.r) + ',"e":' + (JNum $r.e) + ',"p":' + (JNum $r.p) + ',"ev":' + $(if($r.ev){'true'}else{'false'}) + '}' }
$rawLine = 'window.RAW_BASE = [' + ($items -join ',') + '];'

# ---- 5. write only when the data changed (or once a day, so the dashboard shows the sheet is still being checked) ----
$oldRaw = ($old -split "`n" | Where-Object { $_ -like 'window.RAW_BASE = *' } | Select-Object -First 1)
$oldMeta = $null; $m = [regex]::Match($old, 'window\.DATA_META = (\{.*?\});'); if($m.Success){ try { $oldMeta = $m.Groups[1].Value | ConvertFrom-Json } catch { } }
$same = $oldRaw -and ($oldRaw.TrimEnd("`r") -eq $rawLine)
$oldAsof = $null; if($oldMeta -and $oldMeta.asof){ try { $oldAsof = [DateTime]::ParseExact($oldMeta.asof, 'd MMM yyyy, HH:mm', $inv) } catch { } }
$sourceKind = if($fromUrl){ 'google-sheet' } else { 'file' }
$file = if($fromUrl){ $Label } else { Split-Path $Source -Leaf }
if($same -and $oldMeta -and $oldMeta.source -eq $sourceKind -and $oldAsof -and ($now - $oldAsof).TotalHours -lt $HeartbeatHours){
  Say "No change: $($recs.Count) companies, same as the dashboard."
  if($env:GITHUB_OUTPUT){ Add-Content -Path $env:GITHUB_OUTPUT -Value 'changed=false' }
  exit 0
}
$modified = if($same -and $oldMeta -and $oldMeta.source -eq $sourceKind -and $oldMeta.modified){ $oldMeta.modified } else { Fmt $now }
$meta = '{"asof":' + (JStr (Fmt $now)) + ',"file":' + (JStr $file) + ',"modified":' + (JStr $modified) + ',"sheet":' + (JStr $Sheet) + ',"source":' + (JStr $sourceKind) + '}'
$js = "// Generated from the '$Sheet' sheet only. Regenerated on each sync; do not edit by hand.`nwindow.DATA_META = $meta;`n$rawLine`n"
[IO.File]::WriteAllText($Out, $js, (New-Object Text.UTF8Encoding $false))
Say $(if($same){ "Checked: $($recs.Count) companies, data unchanged (daily check-in written)." } else { "Updated: $($recs.Count) companies (was $oldCount)." })
if($env:GITHUB_OUTPUT){ Add-Content -Path $env:GITHUB_OUTPUT -Value 'changed=true' }
