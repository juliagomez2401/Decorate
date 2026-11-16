# ImÃ¡genes extra para la versiÃ³n 2 (los originales de fotos\ no se tocan).
#  - Fotos del inicio a resoluciÃ³n original y calidad alta.
#  - Fondo de cuero para la pantalla de entrada (de la foto del logo).
#  - Logo real recortado de la foto 45, en blanco con fondo transparente.
# Uso: powershell -ExecutionPolicy Bypass -File herramientas\preparar-extra.ps1
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class LogoCut {
  // Convierte lo claro en blanco opaco y lo oscuro en transparente.
  public static Bitmap Cut(Bitmap src, Rectangle r, int lo, int hi) {
    Bitmap dst = new Bitmap(r.Width, r.Height, PixelFormat.Format32bppArgb);
    for (int y = 0; y < r.Height; y++) {
      for (int x = 0; x < r.Width; x++) {
        Color c = src.GetPixel(r.X + x, r.Y + y);
        int l = (int)(0.299 * c.R + 0.587 * c.G + 0.114 * c.B);
        int a = l <= lo ? 0 : (l >= hi ? 255 : (int)(255.0 * (l - lo) / (hi - lo)));
        dst.SetPixel(x, y, Color.FromArgb(a, 255, 255, 255));
      }
    }
    return dst;
  }
  // Recorta al rectÃ¡ngulo mÃ­nimo con pÃ­xeles visibles (+ margen).
  public static Rectangle Bounds(Bitmap b, int minA, int pad) {
    int x0 = b.Width, y0 = b.Height, x1 = 0, y1 = 0;
    for (int y = 0; y < b.Height; y++) for (int x = 0; x < b.Width; x++) {
      if (b.GetPixel(x, y).A > minA) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    }
    x0 = Math.Max(0, x0 - pad); y0 = Math.Max(0, y0 - pad);
    x1 = Math.Min(b.Width - 1, x1 + pad); y1 = Math.Min(b.Height - 1, y1 + pad);
    return new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }
}
"@

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'fotos'
$out = Join-Path $root 'img'
$files = Get-ChildItem $src -Filter *.jpeg | Sort-Object Name
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Q([long]$q) { $p = New-Object System.Drawing.Imaging.EncoderParameters 1; $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $q; $p }

function Save-Crop($img, $sx, $sy, $sw, $sh, [int]$maxSide, [string]$path, [long]$q) {
  $s = [math]::Min(1.0, $maxSide / [math]::Max($sw, $sh))
  $w = [int]($sw * $s); $h = [int]($sh * $s)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $sx, $sy, $sw, $sh, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $bmp.Save($path, $codec, (Q $q)); $bmp.Dispose()
}

# Inicio: fotos verticales de cintos puestos, sin achicar
$hero = [ordered]@{ 48='hero-1'; 27='hero-2'; 3='hero-3'; 23='hero-4'; 17='hero-5'; 18='hero-6' }
foreach ($e in $hero.GetEnumerator()) {
  $img = [System.Drawing.Image]::FromFile($files[[int]$e.Key - 1].FullName)
  Save-Crop $img 0 0 $img.Width $img.Height 2000 (Join-Path $out "$($e.Value).jpg") 90
  Save-Crop $img 0 0 $img.Width $img.Height 900 (Join-Path $out "$($e.Value)-sm.jpg") 84
  $img.Dispose()
}

# Cuero de fondo (franja superior de la foto del logo, sin letras)
$img = [System.Drawing.Image]::FromFile($files[44].FullName)
$k = $img.Width / 1600  # medidas tomadas sobre la vista de 1600 px; el original es mas grande
Save-Crop $img 0 0 (1600*$k) (640*$k) 2000 (Join-Path $out 'fondo-cuero.jpg') 86
Save-Crop $img (500*$k) 0 (600*$k) (640*$k) 1000 (Join-Path $out 'fondo-cuero-alto.jpg') 86

# Logo real: blanco sobre transparente
$bmp = New-Object System.Drawing.Bitmap $img
$cut = [LogoCut]::Cut($bmp, ([System.Drawing.Rectangle]::new([int](60*$k), [int](640*$k), [int](1480*$k), [int](360*$k))), 150, 225)
$r = [LogoCut]::Bounds($cut, 40, 4)
$logo = $cut.Clone($r, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$logo.Save((Join-Path $out 'logo.png'), [System.Drawing.Imaging.ImageFormat]::Png)
"logo: $($r.Width)x$($r.Height)"
$logo.Dispose(); $cut.Dispose(); $bmp.Dispose(); $img.Dispose()
'listo'


