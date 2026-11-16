# Fotos en alta calidad (noviembre 2026): reemplaza en img\ las fotos que tienen versión nueva en fotos\.
# Respeta la orientación de la cámara (EXIF). Los archivos de fotos\ no se modifican.
# Uso: powershell -ExecutionPolicy Bypass -File herramientas\preparar-fotos-hd.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'fotos'
$out = Join-Path $root 'img'
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Q([long]$q) { $p = New-Object System.Drawing.Imaging.EncoderParameters 1; $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $q; $p }

function Load([string]$path) {
  $img = [System.Drawing.Image]::FromFile($path)
  if ($img.PropertyIdList -contains 274) {
    $o = $img.GetPropertyItem(274).Value[0]
    $rf = @{ 2 = 'RotateNoneFlipX'; 3 = 'Rotate180FlipNone'; 4 = 'RotateNoneFlipY'; 5 = 'Rotate90FlipX'; 6 = 'Rotate90FlipNone'; 7 = 'Rotate270FlipX'; 8 = 'Rotate270FlipNone' }[[int]$o]
    if ($rf) { $img.RotateFlip($rf) }
  }
  $img
}
function Save($img, $sx, $sy, $sw, $sh, [int]$maxSide, [string]$path, [long]$q) {
  $s = [math]::Min(1.0, $maxSide / [math]::Max($sw, $sh))
  $w = [int]($sw * $s); $h = [int]($sh * $s)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), [single]$sx, [single]$sy, [single]$sw, [single]$sh, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $bmp.Save($path, $codec, (Q $q)); $bmp.Dispose()
}

# nombre en la web -> archivo nuevo en fotos\
$map = [ordered]@{
  'hero-1' = 'IMG_4354.jpeg'; 'hero-2' = 'IMG_2835.jpeg'; 'hero-3' = 'IMG_1230.jpeg'; 'hero-4' = 'IMG_2828.jpeg'
  'hero-5' = 'IMG_2391.jpeg'; 'hero-6' = '40547CBD-D75B-4A21-B76A-24658771E844.JPEG'
  'cinto-blanco' = '1BAAFC81-59B8-4700-8719-4004C816635A.JPG'; 'cinto-rojo' = '40547CBD-D75B-4A21-B76A-24658771E844.JPEG'
  'cinto-pelo' = '9306CD1A-19FE-4E1B-8B61-CECA40CBCAEC.JPG'; 'cinto-cebra-bordo' = 'IMG_1220.jpeg'
  'cinto-faja-leopardo' = 'IMG_1236.jpeg'; 'cinto-turquesa' = 'IMG_2190.jpeg'; 'cinto-suela-tachas' = 'IMG_2391.jpeg'
  'portalentes-cebra' = 'IMG_0153.jpg'; 'portalentes-croco' = 'IMG_0170.jpg'
  'portalentes-chocolate' = 'IMG_4003.jpeg'; 'portalentes-leopardo' = 'IMG_4009.jpeg'
  'tarjetero-cebra' = 'IMG_1759.jpeg'; 'tarjeteros-varios' = 'IMG_2518.jpeg'; 'pulsera' = 'IMG_2225.jpeg'
  'taller-mesa' = 'B6D174C9-259C-461E-9DF2-3AD22019084E.JPG'; 'taller-herramientas' = 'IMG_1680.jpeg'; 'taller-cueros' = 'IMG_3196.jpeg'
}
foreach ($name in $map.Keys) {
  $img = Load (Join-Path $src $map[$name])
  if ($name -like 'hero-*') {
    Save $img 0 0 $img.Width $img.Height 2400 (Join-Path $out "$name.jpg") 86
    Save $img 0 0 $img.Width $img.Height 1200 (Join-Path $out "$name-sm.jpg") 84
  } else {
    Save $img 0 0 $img.Width $img.Height 2000 (Join-Path $out "$name.jpg") 86
    Save $img 0 0 $img.Width $img.Height 1000 (Join-Path $out "$name-sm.jpg") 84
  }
  "$name <- $($map[$name]) ($($img.Width)x$($img.Height))"
  $img.Dispose()
}

# Muestras de cuero que salen de estas fotos, recortadas de nuevo en alta.
# Coordenadas medidas sobre la versión anterior (ancho indicado) y escaladas al tamaño nuevo.
$cueros = [ordered]@{
  'cuero-cebra'          = @('IMG_1759.jpeg', 1356, 430, 750, 230)
  'cuero-leopardo'       = @('IMG_4009.jpeg', 1200, 640, 900, 280)
  'cuero-croco-turquesa' = @('IMG_0170.jpg', 1082, 450, 450, 450)
}
foreach ($n in $cueros.Keys) {
  $c = $cueros[$n]
  $img = Load (Join-Path $src $c[0])
  $k = $img.Width / $c[1]
  Save $img ($c[2] * $k) ($c[3] * $k) ($c[4] * $k) ($c[4] * $k) 600 (Join-Path $out "$n.jpg") 88
  "$n <- $($c[0])"
  $img.Dispose()
}
# Más muestras desde fotos nuevas. Coordenadas medidas sobre una vista de 800 px de ancho: x, y, lado.
$cueros800 = [ordered]@{
  'cuero-bordo'       = @('IMG_4144.jpeg', 300, 380, 200)
  'cuero-azul-lavado' = @('IMG_4143.jpeg', 220, 330, 250)
  'cuero-rojo'        = @('IMG_2518.jpeg', 85, 285, 140)
  'cuero-plateado'    = @('IMG_2518.jpeg', 305, 200, 80)
  'cuero-azul-charol' = @('IMG_2518.jpeg', 445, 560, 60)
  'cuero-vaca'        = @('IMG_3263.jpeg', 360, 320, 230)
}
foreach ($n in $cueros800.Keys) {
  $c = $cueros800[$n]
  $img = Load (Join-Path $src $c[0])
  $k = $img.Width / 800
  Save $img ($c[1] * $k) ($c[2] * $k) ($c[3] * $k) ($c[3] * $k) 600 (Join-Path $out "$n.jpg") 88
  "$n <- $($c[0])"
  $img.Dispose()
}
# Foto única del inicio (horizontal)
$img = Load (Join-Path $src 'IMG_0191.JPG')
Save $img 0 0 $img.Width $img.Height 2600 (Join-Path $out 'inicio.jpg') 86
Save $img 0 0 $img.Width $img.Height 1300 (Join-Path $out 'inicio-sm.jpg') 84
$img.Dispose()

# Logo en colores fijos (imagen común: se ve aunque se abra el archivo sin servidor)
$tintes = @{ 'logo-oscuro.png' = @(28, 20, 16); 'logo-claro.png' = @(239, 231, 218) }
$base = New-Object System.Drawing.Bitmap (Join-Path $out 'logo-palabra.png')
foreach ($n in $tintes.Keys) {
  $c = $tintes[$n]
  $bmp = New-Object System.Drawing.Bitmap $base.Width, $base.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix00 = 0; $cm.Matrix11 = 0; $cm.Matrix22 = 0
  $cm.Matrix40 = $c[0] / 255; $cm.Matrix41 = $c[1] / 255; $cm.Matrix42 = $c[2] / 255
  $ia = New-Object System.Drawing.Imaging.ImageAttributes; $ia.SetColorMatrix($cm)
  $g.DrawImage($base, (New-Object System.Drawing.Rectangle 0, 0, $base.Width, $base.Height), 0, 0, $base.Width, $base.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
  $g.Dispose(); $bmp.Save((Join-Path $out $n), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  "$n listo"
}
$base.Dispose()
'listo'
