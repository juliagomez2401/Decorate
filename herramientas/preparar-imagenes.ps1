# Genera copias livianas para la web a partir de fotos\ (los originales no se tocan).
# Uso: powershell -ExecutionPolicy Bypass -File herramientas\preparar-imagenes.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'fotos'
$out = Join-Path $root 'img'
New-Item -ItemType Directory -Force $out | Out-Null
$files = Get-ChildItem $src -Filter *.jpeg | Sort-Object Name

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]80)

function Save-Resized($img, [int]$maxSide, [string]$path, $crop) {
  if ($crop) { $sx = $crop[0]; $sy = $crop[1]; $sw = $crop[2]; $sh = $crop[2] } else { $sx = 0; $sy = 0; $sw = $img.Width; $sh = $img.Height }
  $s = [math]::Min(1.0, $maxSide / [math]::Max($sw, $sh))
  $w = [int]($sw * $s); $h = [int]($sh * $s)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $sx, $sy, $sw, $sh, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $bmp.Save($path, $codec, $params)
  $bmp.Dispose()
}

# numero de foto (orden alfabetico, 1..51) -> nombre en la web
$fotos = [ordered]@{
  48='hero-1'; 27='hero-2'; 3='hero-3'; 23='hero-4';
  1='cinto-cebra-bordo'; 17='cinto-suela-tachas'; 26='cinto-pelo'; 2='cinto-faja-leopardo'; 11='cinto-turquesa'; 18='cinto-rojo'; 32='cinto-chocolate'; 28='cinto-blanco';
  38='portalentes-par'; 43='portalentes-cebra'; 40='portalentes-leopardo'; 42='portalentes-croco'; 35='portalentes-chocolate';
  9='tarjetero-cebra'; 19='tarjetero-croco'; 22='tarjeteros-varios'; 8='tarjetero-turquesa';
  14='llaveros-estrella'; 13='collar'; 12='pulsera'; 47='pulseras-puestas';
  49='taller-cueros'; 50='taller-rollos'; 51='taller-herramientas'; 46='taller-mesa'; 37='taller-cinto'; 45='logo-cuero'
}
foreach ($e in $fotos.GetEnumerator()) { $k = [int]$e.Key; $name = $e.Value
  $img = [System.Drawing.Image]::FromFile($files[$k - 1].FullName)
  Save-Resized $img 1600 (Join-Path $out "$name.jpg") $null
  Save-Resized $img 800 (Join-Path $out "$name-sm.jpg") $null
  $img.Dispose()
}

# Muestras de cuero recortadas de fotos reales: numero, x, y, lado (px del original)
$cueros = [ordered]@{
  'cuero-cebra'          = @(9, 430, 750, 230);
  'cuero-leopardo'       = @(40, 640, 900, 280);
  'cuero-croco-turquesa' = @(42, 450, 450, 450);
  'cuero-croco-chocolate'= @(45, 200, 1350, 600);
  'cuero-bordo'          = @(39, 380, 600, 340);
  'cuero-rojo'           = @(21, 860, 800, 380);
  'cuero-azul-charol'    = @(20, 225, 640, 195);
  'cuero-plateado'       = @(24, 430, 800, 340);
  'cuero-azul-lavado'    = @(44, 340, 700, 380)
}
foreach ($n in $cueros.Keys) {
  $c = $cueros[$n]
  $img = [System.Drawing.Image]::FromFile($files[$c[0] - 1].FullName)
  Save-Resized $img 600 (Join-Path $out "$n.jpg") @($c[1], $c[2], $c[3])
  $img.Dispose()
}
'listo'
