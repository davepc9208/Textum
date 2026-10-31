[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'run.ps1')
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Backup runner failed with exit code $LASTEXITCODE." }
& (Join-Path $PSScriptRoot 'verify.ps1')
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Backup verification failed with exit code $LASTEXITCODE." }
