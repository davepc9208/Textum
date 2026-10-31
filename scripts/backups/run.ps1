[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ConfigPath = Join-Path $env:LOCALAPPDATA 'TEXTUM\Backup\config.json'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$SupabaseCli = Join-Path $ProjectRoot 'node_modules\.bin\supabase.cmd'
$databaseUrl = $null
$accessToken = $null
$secretsToRedact = @()
$staging = $null
$archiveTemp = $null
$archiveFinal = $null
$success = $false

function Convert-ProtectedToPlainText([string]$Value) {
  $secure = ConvertTo-SecureString $Value
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Invoke-Supabase([string[]]$Arguments, [string]$Step, [string[]]$Secrets) {
  $output = & $script:SupabaseCli @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    foreach ($line in $output) {
      $safeLine = [string]$line
      foreach ($secret in $Secrets) {
        if ($secret) { $safeLine = $safeLine.Replace($secret, '[redacted]') }
      }
      Write-Output "$Step failed: $safeLine"
    }
    throw "$Step failed with exit code $exitCode. Check Docker Desktop, connectivity and the saved Supabase credentials."
  }
}

function Set-PrivateDirectoryAcl([string]$Path) {
  $acl = Get-Acl -LiteralPath $Path
  $acl.SetAccessRuleProtection($true, $false)
  foreach ($rule in @($acl.Access)) { [void]$acl.RemoveAccessRule($rule) }
  $userSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
  $acl.SetOwner($userSid)
  $systemSid = New-Object System.Security.Principal.SecurityIdentifier('S-1-5-18')
  foreach ($sid in @($userSid, $systemSid)) {
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      $sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'
    )
    [void]$acl.AddAccessRule($rule)
  }
  Set-Acl -LiteralPath $Path -AclObject $acl
}

try {
  if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { throw 'Backup is not configured. Run scripts\backups\setup.ps1 first.' }
  if (-not (Test-Path -LiteralPath $SupabaseCli -PathType Leaf)) { throw "Pinned Supabase CLI was not found at $SupabaseCli. Run npm ci in the project folder." }

  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  if ($config.version -ne 1) { throw 'Unsupported backup configuration version.' }
  $databaseUrl = Convert-ProtectedToPlainText $config.databaseUrlProtected
  $accessToken = Convert-ProtectedToPlainText $config.accessTokenProtected
  if (-not $databaseUrl -or -not $accessToken -or -not $config.projectRef) { throw 'Backup configuration is incomplete. Run setup.ps1 again.' }
  $secretsToRedact = @($databaseUrl, $accessToken)

  $backupRoot = [Environment]::ExpandEnvironmentVariables([string]$config.backupDirectory)
  if (-not [System.IO.Path]::IsPathRooted($backupRoot)) { throw 'Backup directory must be an absolute local path.' }
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  Set-PrivateDirectoryAcl $backupRoot

  $timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
  $staging = Join-Path $env:TEMP ('textum-supabase-backup-' + [guid]::NewGuid().ToString('N'))
  $archiveTemp = Join-Path $backupRoot ('.textum-supabase-backup-' + [guid]::NewGuid().ToString('N') + '.zip.tmp')
  $archiveFinal = Join-Path $backupRoot ('textum-supabase-backup-' + $timestamp + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.zip')
  $storagePath = Join-Path $staging 'Storage\blog-images'
  New-Item -ItemType Directory -Path $storagePath -Force | Out-Null

  $env:SUPABASE_ACCESS_TOKEN = $accessToken
  $pushedLocation = $false
  Push-Location $ProjectRoot
  $pushedLocation = $true
  try {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) { throw 'Docker Desktop is required by supabase db dump but was not found. Install/start Docker Desktop and rerun the backup.' }
    $null = & $docker.Source info 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is installed but not running or unavailable. Start it and retry.' }

    Invoke-Supabase @('db', 'dump', '--db-url', $databaseUrl, '--file', (Join-Path $staging 'roles.sql'), '--role-only') 'Database roles dump' $secretsToRedact
    Invoke-Supabase @('db', 'dump', '--db-url', $databaseUrl, '--file', (Join-Path $staging 'schema.sql')) 'Database schema dump' $secretsToRedact
    Invoke-Supabase @('db', 'dump', '--db-url', $databaseUrl, '--file', (Join-Path $staging 'data.sql'), '--data-only', '--use-copy', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes') 'Database data dump' $secretsToRedact
    Invoke-Supabase @('storage', 'cp', '--project-ref', [string]$config.projectRef, '--recursive', 'ss:///blog-images/', $storagePath) 'Storage blog-images copy' $secretsToRedact
  }
  finally {
    if ($pushedLocation) { Pop-Location }
  }

  $dumpNames = @('roles.sql', 'schema.sql', 'data.sql')
  foreach ($name in $dumpNames) {
    $path = Join-Path $staging $name
    if (-not (Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -eq 0) { throw "Required database dump $name is missing or empty; archive not created." }
  }
  $objects = @(Get-ChildItem -LiteralPath $storagePath -File -Recurse)
  $objectBytes = ($objects | Measure-Object -Property Length -Sum).Sum
  if ($null -eq $objectBytes) { $objectBytes = 0 }
  $manifest = [ordered]@{
    createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    supabaseProjectRef = [string]$config.projectRef
    databaseFiles = $dumpNames
    storageBucket = 'blog-images'
    storageObjectCount = $objects.Count
    storageBytes = [long]$objectBytes
    note = 'Logical DB dumps plus Storage objects. Supabase project settings and Auth provider secrets are not included.'
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $staging 'manifest.json') -Encoding UTF8

  Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $archiveTemp -CompressionLevel Optimal
  if ((Get-Item -LiteralPath $archiveTemp).Length -lt 1024) { throw 'Backup archive is unexpectedly small; refusing to keep it.' }
  Move-Item -LiteralPath $archiveTemp -Destination $archiveFinal
  Set-PrivateDirectoryAcl $backupRoot
  $success = $true

  $retentionDays = [Math]::Max(1, [int]$config.retentionDays)
  $cutoff = (Get-Date).AddDays(-$retentionDays)
  Get-ChildItem -LiteralPath $backupRoot -Filter 'textum-supabase-backup-*.zip' -File |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force

  Write-Output "TEXTUM backup complete: $archiveFinal"
  Write-Output "Storage objects copied: $($objects.Count)"
}
finally {
  Remove-Item Env:\SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
  $databaseUrl = $null
  $accessToken = $null
  $secretsToRedact = @()
  if ($staging -and (Test-Path -LiteralPath $staging)) { Remove-Item -LiteralPath $staging -Recurse -Force }
  if ($archiveTemp -and (Test-Path -LiteralPath $archiveTemp)) { Remove-Item -LiteralPath $archiveTemp -Force }
  if (-not $success -and $archiveFinal -and (Test-Path -LiteralPath $archiveFinal)) { Remove-Item -LiteralPath $archiveFinal -Force }
}
