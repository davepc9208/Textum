[CmdletBinding()]
param(
  [string]$BackupDirectory = (Join-Path $env:USERPROFILE 'TEXTUM-Backups'),
  [ValidateRange(1, 3650)][int]$RetentionDays = 30,
  [ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')][string]$DailyAt = '02:30'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ConfigDirectory = Join-Path $env:LOCALAPPDATA 'TEXTUM\Backup'
$ConfigPath = Join-Path $ConfigDirectory 'config.json'
$RunScript = Join-Path $PSScriptRoot 'run.ps1'
$CliPath = Join-Path $ProjectRoot 'node_modules\.bin\supabase.cmd'
$databaseUrl = $null
$accessToken = $null
$databaseUrlSecure = $null
$accessTokenSecure = $null

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
  if (-not (Test-Path -LiteralPath $CliPath -PathType Leaf)) {
    throw "Pinned Supabase CLI isn't installed. In the project folder run: npm ci"
  }
  $cliVersion = (& $CliPath --version).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $cliVersion) { throw 'Could not run the project-local Supabase CLI.' }

  $projectUrl = Read-Host 'Supabase project URL (https://<project-ref>.supabase.co)'
  $uri = $null
  if (-not [Uri]::TryCreate($projectUrl, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne 'https' -or $uri.Host -notmatch '^([a-z0-9-]+)\.supabase\.co$') {
    throw 'Enter a valid HTTPS Supabase project URL such as https://abcdefgh.supabase.co.'
  }
  $projectRef = $Matches[1]

  $databaseUrlSecure = Read-Host 'Supabase Postgres connection URL (password input is hidden)' -AsSecureString
  $databaseUrlPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($databaseUrlSecure)
  try { $databaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($databaseUrlPtr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($databaseUrlPtr) }
  if ($databaseUrl -notmatch '^postgres(ql)?://') { throw 'The database connection must start with postgresql:// or postgres://.' }

  $accessTokenSecure = Read-Host 'Supabase Personal Access Token for Storage CLI (input is hidden)' -AsSecureString
  $accessTokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($accessTokenSecure)
  try { $accessToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accessTokenPtr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accessTokenPtr) }
  if ($accessToken.Length -lt 20) { throw 'The Supabase access token appears too short.' }

  if (-not [System.IO.Path]::IsPathRooted($BackupDirectory)) { throw 'Backup directory must be an absolute local path.' }
  $resolvedBackupDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
  New-Item -ItemType Directory -Path $resolvedBackupDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $ConfigDirectory -Force | Out-Null
  Set-PrivateDirectoryAcl $ConfigDirectory

  $config = [ordered]@{
    version = 1
    projectRef = $projectRef
    cliVersion = $cliVersion
    backupDirectory = $resolvedBackupDirectory
    retentionDays = $RetentionDays
    databaseUrlProtected = (ConvertTo-SecureString -String $databaseUrl -AsPlainText -Force | ConvertFrom-SecureString)
    accessTokenProtected = (ConvertTo-SecureString -String $accessToken -AsPlainText -Force | ConvertFrom-SecureString)
  }
  $config | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
  Set-PrivateDirectoryAcl $ConfigDirectory

  $taskName = 'TEXTUM Supabase Daily Backup'
  $time = [DateTime]::ParseExact($DailyAt, 'HH:mm', [Globalization.CultureInfo]::InvariantCulture)
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$RunScript`"" -WorkingDirectory $ProjectRoot
  $trigger = New-ScheduledTaskTrigger -Daily -At $time
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 8)
  $principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Daily local database and Storage backup for Supabase project $projectRef." -Force | Out-Null

  Write-Output "Installed daily task '$taskName' at $DailyAt."
  Write-Output "Backup directory: $resolvedBackupDirectory (retention: $RetentionDays days)."
  Write-Output "Credentials are encrypted for this Windows user in $ConfigPath."
  Write-Output 'The task runs under this Windows user profile; Docker Desktop must be running when it executes. Check Windows Task Scheduler to confirm the account execution mode.'
  Write-Output 'Next, run scripts\backups\test.ps1 to create and verify the first backup.'
}
finally {
  $databaseUrl = $null
  $accessToken = $null
  if ($databaseUrlSecure) { $databaseUrlSecure.Dispose() }
  if ($accessTokenSecure) { $accessTokenSecure.Dispose() }
}
