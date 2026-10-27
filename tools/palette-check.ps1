# Palette check: WCAG contrast of every token colour against the backgrounds, and colour-blind
# distinguishability of every categorical pair (Machado 2009 simulation, CIEDE2000 distance).
# Usage: pwsh tools/palette-check.ps1 [-Out docs/palette-report.txt]   Exit code 1 if a hard check fails.
param([string]$Tokens = "$PSScriptRoot/../kit/tokens.css", [string]$Out = "$PSScriptRoot/../docs/palette-report.txt")
$ErrorActionPreference = 'Stop'
$css = Get-Content $Tokens -Raw
$tok = @{}
foreach($m in [regex]::Matches($css, '--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})')){ $tok[$m.Groups[1].Value] = $m.Groups[2].Value.ToUpper() }
# resolve var() aliases one level for the backgrounds/text we test
foreach($m in [regex]::Matches($css, '--([a-z0-9-]+)\s*:\s*var\(--([a-z0-9-]+)\)')){ if($tok[$m.Groups[2].Value]){ $tok[$m.Groups[1].Value] = $tok[$m.Groups[2].Value] } }

function Lin([double]$c){ $c/=255; if($c -le 0.04045){ $c/12.92 } else { [math]::Pow(($c+0.055)/1.055,2.4) } }
function Rgb($hex){ @([convert]::ToInt32($hex.Substring(1,2),16),[convert]::ToInt32($hex.Substring(3,2),16),[convert]::ToInt32($hex.Substring(5,2),16)) }
function LumL($l){ 0.2126*$l[0]+0.7152*$l[1]+0.0722*$l[2] }
function Contrast($a,$b){ $la=LumL (Rgb $a | % { Lin $_ }); $lb=LumL (Rgb $b | % { Lin $_ }); $hi=[math]::Max($la,$lb); $lo=[math]::Min($la,$lb); ($hi+0.05)/($lo+0.05) }
$MAT = @{
  protan = @(@(0.152286,1.052583,-0.204868),@(0.114503,0.786281,0.099216),@(-0.003882,-0.048116,1.051998));
  deutan = @(@(0.367322,0.860646,-0.227968),@(0.280085,0.672501,0.047413),@(-0.011820,0.042940,0.968881));
  tritan = @(@(1.255528,-0.076749,-0.178779),@(-0.078411,0.930809,0.147602),@(0.004733,0.691367,0.303900)) }
function Sim($hex,$kind){ $l = Rgb $hex | % { Lin $_ }; if($kind -eq 'normal'){ return $l }; $mx=$MAT[$kind]; @(0..2 | % { [math]::Min([double]1,[math]::Max([double]0, [double]$mx[$_][0]*$l[0]+$mx[$_][1]*$l[1]+$mx[$_][2]*$l[2])) }) }
function Lab($l){ $x=(0.4124*$l[0]+0.3576*$l[1]+0.1805*$l[2])/0.95047; $y=(0.2126*$l[0]+0.7152*$l[1]+0.0722*$l[2]); $z=(0.0193*$l[0]+0.1192*$l[1]+0.9505*$l[2])/1.08883
  $f={ param($t) if($t -gt 0.008856){ [math]::Pow($t,1/3) } else { 7.787*$t+16/116 } }; $fx=& $f $x; $fy=& $f $y; $fz=& $f $z; @((116*$fy-16),(500*($fx-$fy)),(200*($fy-$fz))) }
function DE00($a,$b){ # CIEDE2000
  $L1,$a1,$b1=$a; $L2,$a2,$b2=$b; $rad=[math]::PI/180
  $C1=[math]::Sqrt($a1*$a1+$b1*$b1); $C2=[math]::Sqrt($a2*$a2+$b2*$b2); $Cb=($C1+$C2)/2
  $G=0.5*(1-[math]::Sqrt([math]::Pow($Cb,7)/([math]::Pow($Cb,7)+[math]::Pow(25,7))))
  $a1p=(1+$G)*$a1; $a2p=(1+$G)*$a2; $C1p=[math]::Sqrt($a1p*$a1p+$b1*$b1); $C2p=[math]::Sqrt($a2p*$a2p+$b2*$b2)
  $h1p= if($b1 -eq 0 -and $a1p -eq 0){0}else{ ([math]::Atan2($b1,$a1p)/$rad+360)%360 }; $h2p= if($b2 -eq 0 -and $a2p -eq 0){0}else{ ([math]::Atan2($b2,$a2p)/$rad+360)%360 }
  $dL=$L2-$L1; $dC=$C2p-$C1p; $dh=$h2p-$h1p; if($C1p*$C2p -eq 0){$dh=0}elseif($dh -gt 180){$dh-=360}elseif($dh -lt -180){$dh+=360}
  $dH=2*[math]::Sqrt($C1p*$C2p)*[math]::Sin($dh/2*$rad); $Lb=($L1+$L2)/2; $Cbp=($C1p+$C2p)/2
  $hb= if($C1p*$C2p -eq 0){$h1p+$h2p}elseif([math]::Abs($h1p-$h2p) -le 180){($h1p+$h2p)/2}elseif($h1p+$h2p -lt 360){($h1p+$h2p+360)/2}else{($h1p+$h2p-360)/2}
  $T=1-0.17*[math]::Cos(($hb-30)*$rad)+0.24*[math]::Cos(2*$hb*$rad)+0.32*[math]::Cos((3*$hb+6)*$rad)-0.20*[math]::Cos((4*$hb-63)*$rad)
  $dth=30*[math]::Exp(-[math]::Pow(($hb-275)/25,2)); $Rc=2*[math]::Sqrt([math]::Pow($Cbp,7)/([math]::Pow($Cbp,7)+[math]::Pow(25,7)))
  $Sl=1+0.015*[math]::Pow($Lb-50,2)/[math]::Sqrt(20+[math]::Pow($Lb-50,2)); $Sc=1+0.045*$Cbp; $Sh=1+0.015*$Cbp*$T; $Rt=-[math]::Sin(2*$dth*$rad)*$Rc
  [math]::Sqrt([math]::Pow($dL/$Sl,2)+[math]::Pow($dC/$Sc,2)+[math]::Pow($dH/$Sh,2)+$Rt*($dC/$Sc)*($dH/$Sh)) }

$lines = New-Object System.Collections.ArrayList; $fail = 0
function W($s){ [void]$lines.Add($s) }
W "PALETTE REPORT  (generated $(Get-Date -Format 'yyyy-MM-dd HH:mm') from kit/tokens.css)"
W "Backgrounds: bg $($tok['bg'])  surface $($tok['surface'])  surface-sunk $($tok['surface-sunk'])"
W ""
W "1. TEXT CONTRAST (WCAG AA: 4.5:1 body text, 3:1 large text)"
$texts = 'text','text-muted','text-subtle','link','positive','negative','warning','info','brand-primary','brand-secondary'
foreach($t in $texts){ foreach($bg in 'surface','bg','surface-sunk'){ $c=Contrast $tok[$t] $tok[$bg]; $ok= if($c -ge 4.5){'AA'}elseif($c -ge 3){'AA-large only'}else{'FAIL'}; if($ok -eq 'FAIL' -or ($ok -ne 'AA' -and $t -notin 'text-subtle')){ $fail++ }; W ("   {0,-16} on {1,-13} {2,6:N2}:1  {3}" -f $t,$bg,$c,$ok) } }
foreach($p in @(@('positive','positive-bg'),@('negative','negative-bg'),@('warning','warning-bg'),@('info','info-bg'),@('text-on-brand','brand-primary'))){ $c=Contrast $tok[$p[0]] $tok[$p[1]]; $ok= if($c -ge 4.5){'AA'}else{'FAIL'}; if($ok -eq 'FAIL'){$fail++}; W ("   {0,-16} on {1,-13} {2,6:N2}:1  {3}" -f $p[0],$p[1],$c,$ok) }
W ""
W ""
W "1b. TEXT ON BRAND DARK SURFACES (hero bands, navy sidebar, presentation mode; AA 4.5:1)"
foreach($t2 in 'on-dark','on-dark-muted','on-dark-subtle','positive-on-dark','negative-on-dark','warning-on-dark','side-text','side-accent','brand-accent'){ foreach($bg in 'hero-from','hero-mid','hero-to','side-bg'){ if(-not $tok[$t2] -or -not $tok[$bg]){ continue }; $c=Contrast $tok[$t2] $tok[$bg]; $ok= if($c -ge 4.5){'AA'}elseif($c -ge 3){'AA-large only'}else{'FAIL'}; if($ok -ne 'AA' -and $t2 -ne 'on-dark-subtle'){ $fail++ }; if($ok -eq 'FAIL'){ $fail++ }; W ("   {0,-17} on {1,-10} {2,6:N2}:1  {3}" -f $t2,$bg,$c,$ok) } }
W ""
W "2. DATA-VIZ MARK CONTRAST (WCAG 1.4.11 non-text: 3:1 against the chart background)"
$viz = 1..8 | % { "viz-$_" }
foreach($v in $viz + @('seq-4','seq-5','seq-6','seq-7','div-n3','div-n2','div-p2','div-p3')){ foreach($bg in 'surface','bg'){ $c=Contrast $tok[$v] $tok[$bg]; $ok= if($c -ge 3){'pass'}else{'below 3:1 (fill only with outline)'}; if($c -lt 3 -and $v -like 'viz-*'){ $fail++ }; W ("   {0,-8} {1}  on {2,-8} {3,6:N2}:1  {4}" -f $v,$tok[$v],$bg,$c,$ok) } }
W "   (seq-1..3 and div-n1/0/p1 are light fills for heat shading behind text; text on them is checked below)"
foreach($v in 'seq-1','seq-2','seq-3','div-n1','div-0','div-p1'){ $c=Contrast $tok['text'] $tok[$v]; W ("   text on {0,-7} {1,6:N2}:1  {2}" -f $v,$c,$(if($c -ge 4.5){'AA'}else{'FAIL'})); if($c -lt 4.5){$fail++} }
W ""
W "3. COLOUR-BLIND DISTINGUISHABILITY, categorical pairs (CIEDE2000 after Machado 2009 simulation, severity 1.0)"
W "   >= 20 clearly distinct | 10-20 distinct | 6-10 close: rely on the shape cue | < 6 confusable: shape cue mandatory"
$kinds='normal','protan','deutan','tritan'
$labs=@{}; foreach($k in $kinds){ foreach($v in $viz){ $labs["$k|$v"] = Lab (Sim $tok[$v] $k) } }
$minBy=@{}; $close=@()
W ("   {0,-12}" -f 'pair' + (($kinds | % { "{0,9}" -f $_ }) -join ''))
for($i=0;$i -lt 8;$i++){ for($j=$i+1;$j -lt 8;$j++){ $row=@(); foreach($k in $kinds){ $d=DE00 $labs["$k|$($viz[$i])"] $labs["$k|$($viz[$j])"]; $row+=$d; if(-not $minBy[$k] -or $d -lt $minBy[$k][0]){ $minBy[$k]=@($d,"$($viz[$i])/$($viz[$j])") }; if($d -lt 10){ $close += ("{0}/{1} {2} {3:N1}" -f $viz[$i],$viz[$j],$k,$d) } }
  W (("   {0,-12}" -f "$($i+1)-$($j+1)") + (($row | % { "{0,9:N1}" -f $_ }) -join '')) } }
W ""
foreach($k in $kinds){ W ("   minimum {0,-7} {1,5:N1}  ({2})" -f $k,$minBy[$k][0],$minBy[$k][1]) }
if($minBy['normal'][0] -lt 15){ $fail++ }
W ""
W "   Pairs under 10 (charts must add the shape cue - every series also gets its own marker shape):"
if($close.Count){ $close | % { W "     $_" } } else { W "     none" }
W ""
W "4. SEQUENTIAL / DIVERGING monotonic lightness check"
foreach($set in @(@('seq-1','seq-2','seq-3','seq-4','seq-5','seq-6','seq-7'),@('div-n3','div-n2','div-n1','div-0'),@('div-0','div-p1','div-p2','div-p3'))){ $Ls=$set | % { (Lab (Sim $tok[$_] 'normal'))[0] }; $mono=$true; for($i=1;$i -lt $Ls.Count;$i++){ if([math]::Abs($Ls[$i]-$Ls[$i-1]) -lt 4){ $mono=$false } }; W ("   {0}: L* = {1}  {2}" -f ($set -join ' > '),(($Ls | % { "{0:N0}" -f $_ }) -join ' / '),$(if($mono){'ok (steps >= 4 L*)'}else{'STEP TOO SMALL'})); if(-not $mono){$fail++} }
W ""
W "RESULT: $(if($fail){"$fail hard check(s) failed"}else{'all hard checks pass'})"
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
[IO.File]::WriteAllLines($Out, [string[]]$lines)
$lines -join "`n"
if($fail){ exit 1 } else { exit 0 }
