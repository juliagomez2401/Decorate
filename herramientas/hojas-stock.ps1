# Arma una hoja de revisión por categoría a partir de herramientas\stock.json.
# En los cintos decorativos muestra la foto del producto y una foto puesta en la modelo.
# Uso: powershell -ExecutionPolicy Bypass -File herramientas\hojas-stock.ps1
Add-Type -AssemblyName System.Drawing
$d = Split-Path $PSScriptRoot -Parent
$j = Get-Content "$d\herramientas\stock.json" -Raw -Encoding utf8 | ConvertFrom-Json
function Load($p){ $img=[System.Drawing.Image]::FromFile($p); if($img.PropertyIdList -contains 274){ $rf=@{2='RotateNoneFlipX';3='Rotate180FlipNone';4='RotateNoneFlipY';5='Rotate90FlipX';6='Rotate90FlipNone';7='Rotate270FlipX';8='Rotate270FlipNone'}[[int]$img.GetPropertyItem(274).Value[0]]; if($rf){$img.RotateFlip($rf)} }; $img }
function Cover($g, $n, $x, $y, $w, $h) {
  $nombre = if ([int]$n -gt 1000) { "tanda2-image{0:D5}.jpeg" -f ([int]$n - 1000) } else { "image{0:D5}.jpeg" -f [int]$n }
  $img = Load ((Get-ChildItem "$d\fotos" -Recurse -Filter $nombre | Select-Object -First 1).FullName)
  $sc = [math]::Max($w / $img.Width, $h / $img.Height); $sw = $w / $sc; $sh = $h / $sc
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle $x, $y, $w, $h), [single](($img.Width - $sw) / 2), [single](($img.Height - $sh) / 2), [single]$sw, [single]$sh, [System.Drawing.GraphicsUnit]::Pixel)
  $img.Dispose()
}
$out = "$d\revision-stock"; New-Item -ItemType Directory -Force $out | Out-Null
$k = 0
foreach ($c in $j.categorias) {
  $k++
  $ps = $c.productos; $cols = 4; $tw = 380; $th = 390; $head = 96; $rows = [math]::Ceiling($ps.Count / $cols)
  $b = New-Object System.Drawing.Bitmap ($cols * $tw), ($rows * $th + $head)
  $g = [System.Drawing.Graphics]::FromImage($b); $g.Clear([System.Drawing.Color]::FromArgb(236, 224, 206)); $g.InterpolationMode = 'HighQualityBicubic'; $g.TextRenderingHint = 'AntiAlias'
  $ft = New-Object System.Drawing.Font 'Georgia', 26; $fn = New-Object System.Drawing.Font 'Arial', 12, ([System.Drawing.FontStyle]::Bold); $fs = New-Object System.Drawing.Font 'Arial', 10
  $brown = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(94, 65, 48)); $dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 20, 16)); $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 60, 40))
  $g.DrawString("$($c.nombre)  ($($ps.Count))", $ft, $dark, 14, 12)
  if ($c.nota) { $g.DrawString($c.nota, $fs, $brown, 16, 60) }
  for ($i = 0; $i -lt $ps.Count; $i++) {
    $p = $ps[$i]; $x = ($i % $cols) * $tw + 10; $y = [math]::Floor($i / $cols) * $th + $head; $box = $tw - 20; $bh = 270
    if ($p.fotosModelo) {
      $half = [int](($box - 6) / 2)
      Cover $g $p.fotos[0] $x $y $half $bh
      Cover $g $p.fotosModelo[0] ($x + $half + 6) $y $half $bh
    } else { Cover $g $p.fotos[0] $x $y $box $bh }
    $g.DrawString("$($p.id)  $($p.nombre)", $fn, $dark, (New-Object System.Drawing.RectangleF $x, ($y + 276), $box, 36))
    $txt = "Producto: " + ($p.fotos -join ', ')
    if ($p.fotosModelo) { $txt += "   Puesta: " + ($p.fotosModelo -join ', ') }
    $g.DrawString($txt, $fs, $brown, (New-Object System.Drawing.RectangleF $x, ($y + 312), $box, 30))
    if ($p.duda) { $g.DrawString("Duda: $($p.duda)", $fs, $red, (New-Object System.Drawing.RectangleF $x, ($y + 342), $box, 44)) }
  }
  $g.Dispose(); $f = "$out\$k-$($c.id).jpg"; $b.Save($f, [System.Drawing.Imaging.ImageFormat]::Jpeg); $b.Dispose(); $f
}
