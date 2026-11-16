# Copias livianas de las fotos del stock (fotos\imageNNNNN.jpeg) para la web: img\stock\NN.jpg y NN-sm.jpg.
# Respeta la orientación de la cámara. Los originales no se tocan.
# Uso: powershell -ExecutionPolicy Bypass -File herramientas\preparar-stock.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'fotos'
$out = Join-Path $root 'img\stock'
New-Item -ItemType Directory -Force $out | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Q([long]$q) { $p = New-Object System.Drawing.Imaging.EncoderParameters 1; $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $q; $p }
function Load($p){ $img=[System.Drawing.Image]::FromFile($p); if($img.PropertyIdList -contains 274){ $rf=@{2='RotateNoneFlipX';3='Rotate180FlipNone';4='RotateNoneFlipY';5='Rotate90FlipX';6='Rotate90FlipNone';7='Rotate270FlipX';8='Rotate270FlipNone'}[[int]$img.GetPropertyItem(274).Value[0]]; if($rf){$img.RotateFlip($rf)} }; $img }
function Save($img, [int]$maxSide, [string]$path, [long]$q) {
  $s = [math]::Min(1.0, $maxSide / [math]::Max($img.Width, $img.Height))
  $w = [int]($img.Width * $s); $h = [int]($img.Height * $s)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
  $bmp.Save($path, $codec, (Q $q)); $bmp.Dispose()
}
$files = Get-ChildItem $src -Filter 'image*.jpeg'
foreach ($f in $files) {
  $n = [int]($f.BaseName -replace 'image0*', '')
  $big = Join-Path $out "$n.jpg"
  if ((Test-Path $big) -and (Get-Item $big).LastWriteTime -gt $f.LastWriteTime) { continue }
  $img = Load $f.FullName
  Save $img 1600 $big 84
  Save $img 760 (Join-Path $out "$n-sm.jpg") 82
  $img.Dispose()
}
"listo: $($files.Count) fotos"
