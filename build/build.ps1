Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $repoRoot 'build'
$outputRoot = Join-Path $buildRoot 'output'
$stageRoot = Join-Path $buildRoot 'stage'
$packageRoot = Join-Path $repoRoot 'package'
$pluginRoot = Join-Path $repoRoot 'plugins\editors-xtd\smartpaste'
$packageManifestPath = Join-Path $packageRoot 'pkg_smartpaste.xml'
$pluginManifestPath = Join-Path $pluginRoot 'smartpaste.xml'

function Ensure-CleanDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
    }

    New-Item -ItemType Directory -Path $Path | Out-Null
}

function New-ZipFromDirectoryContents {
    param(
        [Parameter(Mandatory = $true)]
        [string] $SourceDirectory,

        [Parameter(Mandatory = $true)]
        [string] $DestinationZip
    )

    if (Test-Path $DestinationZip) {
        Remove-Item -Path $DestinationZip -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $destinationStream = [System.IO.File]::Open($DestinationZip, [System.IO.FileMode]::Create)

    try {
        $archive = New-Object System.IO.Compression.ZipArchive(
            $destinationStream,
            [System.IO.Compression.ZipArchiveMode]::Create,
            $false
        )

        try {
            $rootPath = [System.IO.Path]::GetFullPath($SourceDirectory)

            Get-ChildItem -Path $SourceDirectory -Recurse -File | ForEach-Object {
                $filePath = [System.IO.Path]::GetFullPath($_.FullName)
                $entryPath = $filePath.Substring($rootPath.Length).TrimStart('\', '/').Replace('\', '/')

                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                    $archive,
                    $filePath,
                    $entryPath,
                    [System.IO.Compression.CompressionLevel]::Optimal
                ) | Out-Null
            }
        }
        finally {
            $archive.Dispose()
        }
    }
    finally {
        $destinationStream.Dispose()
    }
}

function Get-ManifestVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ManifestPath
    )

    if (-not (Test-Path $ManifestPath)) {
        throw "Manifest not found: $ManifestPath"
    }

    [xml] $manifest = Get-Content $ManifestPath -Raw
    $versionNode = $manifest.SelectSingleNode('/extension/version')
    $version = if ($null -ne $versionNode) { $versionNode.InnerText.Trim() } else { '' }

    if ([string]::IsNullOrWhiteSpace($version)) {
        throw "Version element not found in $ManifestPath"
    }

    return $version
}

$requiredPaths = @(
    $packageRoot,
    $pluginRoot,
    $packageManifestPath,
    $pluginManifestPath
)

foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required source path not found: $requiredPath"
    }
}

$manifestVersions = @(
    [pscustomobject]@{
        Name = 'Package'
        Path = $packageManifestPath
        Version = Get-ManifestVersion -ManifestPath $packageManifestPath
    }
    [pscustomobject]@{
        Name = 'Editors XTD plugin'
        Path = $pluginManifestPath
        Version = Get-ManifestVersion -ManifestPath $pluginManifestPath
    }
)

$packageVersion = ($manifestVersions | Where-Object { $_.Name -eq 'Package' } | Select-Object -First 1).Version
$mismatchedManifests = @($manifestVersions | Where-Object { $_.Version -ne $packageVersion })

if ($mismatchedManifests.Count -gt 0) {
    $details = ($manifestVersions | ForEach-Object { '{0}: {1}' -f $_.Path, $_.Version }) -join '; '
    throw "Manifest versions must stay in sync. Expected $packageVersion. Found: $details"
}

Ensure-CleanDirectory -Path $outputRoot
Ensure-CleanDirectory -Path $stageRoot

$pluginStageRoot = Join-Path $stageRoot 'plugins'
New-Item -ItemType Directory -Path $pluginStageRoot | Out-Null

$pluginZipName = 'plg_editors_xtd_smartpaste.zip'
$pluginZipStage = Join-Path $pluginStageRoot $pluginZipName
New-ZipFromDirectoryContents -SourceDirectory $pluginRoot -DestinationZip $pluginZipStage
Copy-Item -Path $pluginZipStage -Destination (Join-Path $outputRoot $pluginZipName) -Force

$packageStage = Join-Path $stageRoot 'package'
$packageFilesStage = Join-Path $packageStage 'packages'
New-Item -ItemType Directory -Path $packageStage | Out-Null
New-Item -ItemType Directory -Path $packageFilesStage | Out-Null

Copy-Item -Path $packageManifestPath -Destination $packageStage -Force
Copy-Item -Path $pluginZipStage -Destination $packageFilesStage -Force

$packageLanguageSource = Join-Path $packageRoot 'language'
if (Test-Path $packageLanguageSource) {
    Copy-Item -Path $packageLanguageSource -Destination $packageStage -Recurse -Force
}

$packageZip = Join-Path $outputRoot ("pkg_smartpaste_v{0}.zip" -f $packageVersion)
New-ZipFromDirectoryContents -SourceDirectory $packageStage -DestinationZip $packageZip

Write-Host ('Created: {0}' -f (Join-Path $outputRoot $pluginZipName))
Write-Host ('Created: {0}' -f $packageZip)
