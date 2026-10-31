[CmdletBinding()]
param([string]$ArchivePath)

$ErrorActionPreference = 'Stop'
$ConfigPath = Join-Path $env:LOCALAPPDATA 'TEXTUM\Backup\config.json'
if (-not $ArchivePath) {
  if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { throw 'Backup is not configured; pass -ArchivePath or run setup.ps1.' }
  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  $root = [Environment]::ExpandEnvironmentVariables([string]$config.backupDirectory)
  $ArchivePath = Get-ChildItem -LiteralPath $root -Filter 'textum-supabase-backup-*.zip' -File |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $ArchivePath -or -not (Test-Path -LiteralPath $ArchivePath -PathType Leaf)) { throw 'No backup archive was found.' }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ArchivePath).Path)
try {
  $required = @('roles.sql', 'schema.sql', 'data.sql', 'manifest.json')
  $entries = @{}
  foreach ($entry in $zip.Entries) { $entries[$entry.FullName.Replace('\', '/')] = $entry }
  foreach ($name in $required) {
    if (-not $entries.ContainsKey($name) -or $entries[$name].Length -eq 0) { throw "Archive is missing a non-empty $name." }
    $stream = $entries[$name].Open()
    try { $stream.CopyTo([System.IO.Stream]::Null) } finally { $stream.Dispose() }
  }

  $manifestStream = $entries['manifest.json'].Open()
  try {
    $reader = New-Object System.IO.StreamReader($manifestStream)
    $manifest = $reader.ReadToEnd() | ConvertFrom-Json
    $reader.Dispose()
  }
  finally { $manifestStream.Dispose() }
  if ($manifest.storageBucket -ne 'blog-images' -or $manifest.supabaseProjectRef -notmatch '^[a-z0-9-]+$') { throw 'Archive manifest has unexpected project or Storage values.' }

  $storageEntries = @($zip.Entries | Where-Object { $_.FullName.Replace('\', '/') -match '^Storage/blog-images/.+' -and -not $_.FullName.EndsWith('/') })
  if ($storageEntries.Count -ne [int]$manifest.storageObjectCount) {
    throw "Storage file count mismatch: manifest=$($manifest.storageObjectCount), archive=$($storageEntries.Count)."
  }
  $storageBytes = [long](($storageEntries | Measure-Object -Property Length -Sum).Sum)
  if ($null -eq $storageBytes) { $storageBytes = 0 }
  if ($storageBytes -ne [long]$manifest.storageBytes) { throw 'Storage byte total does not match the manifest.' }
  foreach ($entry in $storageEntries) {
    $stream = $entry.Open()
    try { $stream.CopyTo([System.IO.Stream]::Null) } finally { $stream.Dispose() }
  }
  Write-Output "Backup archive is readable: $ArchivePath"
  Write-Output "Project: $($manifest.supabaseProjectRef); objects: $($manifest.storageObjectCount); bytes: $storageBytes; created UTC: $($manifest.createdAtUtc)"
}
finally { $zip.Dispose() }
