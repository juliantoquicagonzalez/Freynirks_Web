$root = Split-Path -Parent $PSScriptRoot
$port = 8765
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript";
  ".json"="application/json"; ".webp"="image/webp"; ".jpg"="image/jpeg";
  ".png"="image/png"; ".svg"="image/svg+xml"; ".mp4"="video/mp4"; ".ico"="image/x-icon"
}

# Each request is handled on its own runspace so a large file (e.g. a
# background video) can't block every other concurrent request behind it —
# the previous single-threaded loop caused exactly that.
$handler = {
  param($context, $root, $mime)
  try {
    $req = $context.Request
    $res = $context.Response
    $path = $req.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))
    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $ct = $mime[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $stream = [System.IO.File]::OpenRead($filePath)
      try {
        $res.ContentLength64 = $stream.Length
        $buffer = New-Object byte[] 65536
        while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
          $res.OutputStream.Write($buffer, 0, $read)
        }
      } finally {
        $stream.Close()
      }
    } else {
      $res.StatusCode = 404
    }
  } catch {
  } finally {
    try { $context.Response.OutputStream.Close() } catch {}
  }
}

$pool = [runspacefactory]::CreateRunspacePool(1, 16)
$pool.Open()

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handler).AddArgument($context).AddArgument($root).AddArgument($mime)
  $ps.BeginInvoke() | Out-Null
}
