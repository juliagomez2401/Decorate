# Cambia el fondo liso (de Canva) de una foto por un fondo de la marca, con sombra suave.
# Uso como prueba: powershell -ExecutionPolicy Bypass -File herramientas\fondo-nuevo.ps1 -prueba <salida.jpg>
# Convertir: ... -convertir <carpeta>  (cada .PNG de la carpeta pasa a <nombre>-tabaco.jpg al lado)
param([string]$prueba, [string]$convertir)
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class Fondo {
  static byte[] Px(Bitmap b, out int stride){ var d=b.LockBits(new Rectangle(0,0,b.Width,b.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb); stride=d.Stride; var a=new byte[stride*b.Height]; Marshal.Copy(d.Scan0,a,0,a.Length); b.UnlockBits(d); return a; }
  public static Bitmap Cambiar(Bitmap src, Bitmap fondo, int sombraX, int sombraY, float sombraOp){
    int w=src.Width,h=src.Height,st; var s=Px(src,out st); int st2; var f=Px(fondo,out st2);
    byte bR=s[2],bG=s[1],bB=s[0];
    var al=new float[w*h];
    for(int y=0;y<h;y++)for(int x=0;x<w;x++){int i=y*st+x*4; double d=Math.Sqrt(Math.Pow(s[i+2]-bR,2)+Math.Pow(s[i+1]-bG,2)+Math.Pow(s[i]-bB,2)); al[y*w+x]=(float)Math.Max(0,Math.Min(1,(d-22)/38.0));}
    var sh=(float[])al.Clone(); int r=22; var tmp=new float[w*h];
    for(int p=0;p<3;p++){
      for(int y=0;y<h;y++){float acc=0;for(int x=-r;x<=r;x++)acc+=sh[y*w+Math.Max(0,Math.Min(w-1,x))];for(int x=0;x<w;x++){tmp[y*w+x]=acc/(2*r+1);int a=Math.Min(w-1,x+r+1),b=Math.Max(0,x-r);acc+=sh[y*w+a]-sh[y*w+b];}}
      for(int x=0;x<w;x++){float acc=0;for(int y=-r;y<=r;y++)acc+=tmp[Math.Max(0,Math.Min(h-1,y))*w+x];for(int y=0;y<h;y++){sh[y*w+x]=acc/(2*r+1);int a=Math.Min(h-1,y+r+1),b=Math.Max(0,y-r);acc+=tmp[a*w+x]-tmp[b*w+x];}}
    }
    var o=new Bitmap(w,h,PixelFormat.Format32bppArgb); var od=o.LockBits(new Rectangle(0,0,w,h),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb); var ob=new byte[od.Stride*h];
    for(int y=0;y<h;y++)for(int x=0;x<w;x++){
      int i=y*st+x*4, j=y*st2+x*4, k=y*od.Stride+x*4;
      int sx=x-sombraX, sy=y-sombraY; float sv=(sx>=0&&sy>=0&&sx<w&&sy<h)?sh[sy*w+sx]*sombraOp:0;
      float a=al[y*w+x];
      for(int c=0;c<3;c++){ float bg=f[j+c]*(1-sv); ob[k+c]=(byte)Math.Round(a*s[i+c]+(1-a)*bg); }
      ob[k+3]=255; }
    Marshal.Copy(ob,0,od.Scan0,ob.Length); o.UnlockBits(od); return o;
  }
}
'@
function FondoRadial($w,$h,$c1,$c2){ $b=New-Object System.Drawing.Bitmap $w,$h; $g=[System.Drawing.Graphics]::FromImage($b); $g.Clear($c2); $p=New-Object System.Drawing.Drawing2D.GraphicsPath; $p.AddEllipse(-$w*0.3,-$h*0.25,$w*1.6,$h*1.4); $br=New-Object System.Drawing.Drawing2D.PathGradientBrush $p; $br.CenterColor=$c1; $br.SurroundColors=@($c2); $g.FillRectangle($br,0,0,$w,$h); $g.Dispose(); $b }
function FondoCuero($w,$h){ $b=New-Object System.Drawing.Bitmap $w,$h; $g=[System.Drawing.Graphics]::FromImage($b); $i=[System.Drawing.Image]::FromFile((Join-Path $root 'img\fondo-cuero-alto.jpg')); $s=[Math]::Max($w/$i.Width,$h/$i.Height); $g.DrawImage($i,0,0,[int]($i.Width*$s),[int]($i.Height*$s)); $i.Dispose(); $ov=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(110,28,20,16)); $g.FillRectangle($ov,0,0,$w,$h); $g.Dispose(); $b }
$FONDOS = @(
  @('Tabaco', { param($w,$h) FondoRadial $w $h ([System.Drawing.Color]::FromArgb(110,74,50)) ([System.Drawing.Color]::FromArgb(52,32,21)) }, 0.55),
  @('Arena',  { param($w,$h) FondoRadial $w $h ([System.Drawing.Color]::FromArgb(240,231,216)) ([System.Drawing.Color]::FromArgb(214,196,168)) }, 0.35),
  @('Cuero',  { param($w,$h) FondoCuero $w $h }, 0.6)
)
if ($prueba) {
  $srcs = @(Get-ChildItem (Join-Path $root 'fotos\portafuegos') -Filter '*.PNG' | Where-Object { $_.Name -match '(16|20)\.PNG$' } | Sort-Object Name)
  $TW=300;$TH=375; $sheet=New-Object System.Drawing.Bitmap ($TW*3+40),($TH*$srcs.Count+70); $gs=[System.Drawing.Graphics]::FromImage($sheet); $gs.Clear([System.Drawing.Color]::FromArgb(28,20,16)); $gs.InterpolationMode='HighQualityBicubic'; $font=New-Object System.Drawing.Font 'Arial',13,([System.Drawing.FontStyle]::Bold)
  for($c=0;$c -lt 3;$c++){ $gs.DrawString("$($c+1)  $($FONDOS[$c][0])",$font,[System.Drawing.Brushes]::Wheat,$c*($TW+20)+4,8) }
  for($r=0;$r -lt $srcs.Count;$r++){
    $src=[System.Drawing.Bitmap]::FromFile($srcs[$r].FullName); $s32=$src.Clone((New-Object System.Drawing.Rectangle 0,0,$src.Width,$src.Height),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for($c=0;$c -lt 3;$c++){ $bg=& $FONDOS[$c][1] $s32.Width $s32.Height; $out=[Fondo]::Cambiar($s32,$bg,18,30,[float]$FONDOS[$c][2]); $gs.DrawImage($out,$c*($TW+20),36+$r*($TH+14),$TW,$TH); $bg.Dispose(); $out.Dispose() }
    $src.Dispose(); $s32.Dispose()
  }
  $sheet.Save($prueba,[System.Drawing.Imaging.ImageFormat]::Jpeg); "prueba: $prueba"
}

if ($convertir) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]90)
  foreach ($f in Get-ChildItem $convertir -Filter '*.PNG') {
    $src=[System.Drawing.Bitmap]::FromFile($f.FullName); $s32=$src.Clone((New-Object System.Drawing.Rectangle 0,0,$src.Width,$src.Height),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bg=& $FONDOS[0][1] $s32.Width $s32.Height; $out=[Fondo]::Cambiar($s32,$bg,18,30,[float]$FONDOS[0][2])
    $dest = Join-Path $f.DirectoryName ($f.BaseName + '-tabaco.jpg'); $out.Save($dest, $codec, $ep); $dest
    $bg.Dispose(); $out.Dispose(); $src.Dispose(); $s32.Dispose()
  }
}
