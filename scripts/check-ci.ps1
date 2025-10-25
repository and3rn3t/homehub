<#
.SYNOPSIS
    Check GitHub Actions CI/CD workflow status with rich formatting

.DESCRIPTION
    PowerShell script to check the status of GitHub Actions workflows with
    real-time updates, desktop notifications, and detailed job information.

.PARAMETER Watch
    Continuously monitor the workflow until completion

.PARAMETER All
    Show the last 5 workflow runs instead of just the latest

.PARAMETER Notify
    Show desktop notification when workflow completes (Windows only)

.PARAMETER Open
    Open the workflow run in the default browser

.EXAMPLE
    .\scripts\check-ci.ps1
    Check the latest workflow run

.EXAMPLE
    .\scripts\check-ci.ps1 -Watch
    Watch the workflow until completion

.EXAMPLE
    .\scripts\check-ci.ps1 -All
    Show the last 5 workflow runs

.EXAMPLE
    .\scripts\check-ci.ps1 -Watch -Notify
    Watch and show notification when complete
#>

param(
  [switch]$Watch,
  [switch]$All,
  [switch]$Notify,
  [switch]$Open,
  [switch]$Verbose
)

# Configuration
$Owner = "and3rn3t"
$Repo = "homehub"
$ApiBase = "https://api.github.com"
$Token = $env:GITHUB_TOKEN

# Status emoji mapping
$StatusEmoji = @{
  completed   = "✅"
  in_progress = "⏳"
  queued      = "⏸️"
  waiting     = "⏸️"
  requested   = "⏸️"
  pending     = "⏸️"
}

$ConclusionEmoji = @{
  success         = "✅"
  failure         = "❌"
  cancelled       = "⚫"
  skipped         = "⏭️"
  timed_out       = "⏱️"
  action_required = "⚠️"
  neutral         = "⚪"
}

# Helper function to make GitHub API requests
function Invoke-GitHubApi {
  param(
    [string]$Path
  )

  $headers = @{
    "User-Agent" = "HomeHub-CI-Checker"
    "Accept"     = "application/vnd.github.v3+json"
  }

  if ($Token) {
    $headers["Authorization"] = "token $Token"
  }

  try {
    $response = Invoke-RestMethod -Uri "$ApiBase$Path" -Headers $headers -Method Get
    return $response
  }
  catch {
    Write-Host "❌ GitHub API Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response.StatusCode -eq 401) {
      Write-Host "⚠️  Authentication failed. Check your GITHUB_TOKEN." -ForegroundColor Yellow
    }
    elseif ($_.Exception.Response.StatusCode -eq 404) {
      Write-Host "⚠️  Repository not found. Check owner/repo values." -ForegroundColor Yellow
    }

    exit 1
  }
}

# Helper function to format duration
function Format-Duration {
  param([DateTime]$Start, [DateTime]$End)

  $duration = $End - $Start

  if ($duration.TotalHours -ge 1) {
    return "{0}h {1}m {2}s" -f [math]::Floor($duration.TotalHours), $duration.Minutes, $duration.Seconds
  }
  elseif ($duration.TotalMinutes -ge 1) {
    return "{0}m {1}s" -f [math]::Floor($duration.TotalMinutes), $duration.Seconds
  }
  else {
    return "{0}s" -f [math]::Floor($duration.TotalSeconds)
  }
}

# Helper function to format relative time
function Format-RelativeTime {
  param([DateTime]$Date)

  $now = Get-Date
  $diff = $now - $Date

  if ($diff.TotalDays -ge 1) {
    $days = [math]::Floor($diff.TotalDays)
    return "$days day$(if($days -gt 1){'s'}) ago"
  }
  elseif ($diff.TotalHours -ge 1) {
    $hours = [math]::Floor($diff.TotalHours)
    return "$hours hour$(if($hours -gt 1){'s'}) ago"
  }
  elseif ($diff.TotalMinutes -ge 1) {
    $minutes = [math]::Floor($diff.TotalMinutes)
    return "$minutes minute$(if($minutes -gt 1){'s'}) ago"
  }
  else {
    return "just now"
  }
}

# Helper function to display a workflow run
function Show-WorkflowRun {
  param(
    [object]$Run,
    [int]$Index = -1
  )

  $status = $Run.status
  $conclusion = $Run.conclusion
  $emoji = $StatusEmoji[$status]
  $conclusionEmoji = if ($conclusion) { $ConclusionEmoji[$conclusion] } else { "" }

  # Calculate duration
  $startTime = [DateTime]::Parse($Run.created_at)
  $endTime = if ($Run.updated_at) { [DateTime]::Parse($Run.updated_at) } else { Get-Date }
  $duration = Format-Duration -Start $startTime -End $endTime

  # Header
  if ($Index -ge 0) {
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "Run #$($Index + 1)" -ForegroundColor White
  }

  # Status line
  $statusColor = if ($status -eq "completed") {
    if ($conclusion -eq "success") { "Green" } else { "Red" }
  }
  elseif ($status -eq "in_progress") {
    "Yellow"
  }
  else {
    "Gray"
  }

  Write-Host "$emoji $($status.ToUpper())" -ForegroundColor $statusColor -NoNewline
  if ($conclusionEmoji) {
    Write-Host " $conclusionEmoji $conclusion" -ForegroundColor $statusColor
  }
  else {
    Write-Host ""
  }

  # Details
  Write-Host "Commit:   " -ForegroundColor Cyan -NoNewline
  Write-Host ($Run.head_commit.message -split "`n")[0]

  Write-Host "Branch:   " -ForegroundColor Cyan -NoNewline
  Write-Host "$($Run.head_branch) ($($Run.head_sha.Substring(0, 7)))"

  Write-Host "Started:  " -ForegroundColor Cyan -NoNewline
  Write-Host "$(Format-RelativeTime $startTime) ($($startTime.ToString('yyyy-MM-dd HH:mm:ss')))"

  Write-Host "Duration: " -ForegroundColor Cyan -NoNewline
  Write-Host $duration

  if ($Run.html_url) {
    Write-Host "URL:      " -ForegroundColor Cyan -NoNewline
    Write-Host $Run.html_url -ForegroundColor Blue
  }

  # Fetch and display jobs if verbose
  if ($Verbose -and $Run.jobs_url) {
    try {
      $jobsPath = $Run.jobs_url -replace "https://api.github.com", ""
      $jobsData = Invoke-GitHubApi -Path $jobsPath

      Write-Host "`nJobs:" -ForegroundColor White
      foreach ($job in $jobsData.jobs) {
        $jobEmoji = $StatusEmoji[$job.status]
        $jobConclusionEmoji = if ($job.conclusion) { $ConclusionEmoji[$job.conclusion] } else { "" }
        Write-Host "  $jobEmoji $($job.name) - $($job.status)" -NoNewline
        if ($jobConclusionEmoji) {
          Write-Host " $jobConclusionEmoji" -NoNewline
        }
        Write-Host ""
      }
    }
    catch {
      if ($Verbose) {
        Write-Host "  Failed to fetch jobs: $($_.Exception.Message)" -ForegroundColor Red
      }
    }
  }
}

# Show desktop notification (Windows only)
function Show-Notification {
  param(
    [string]$Title,
    [string]$Message,
    [string]$Type = "Info"  # Info, Warning, Error
  )

  if ($IsWindows -or $env:OS -match "Windows") {
    Add-Type -AssemblyName System.Windows.Forms
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipIcon = $Type
    $notification.BalloonTipText = $Message
    $notification.BalloonTipTitle = $Title
    $notification.Visible = $true
    $notification.ShowBalloonTip(5000)

    Start-Sleep -Seconds 1
    $notification.Dispose()
  }
}

# Main function to check CI status
function Check-CI {
  Write-Host "Checking CI/CD status for $Owner/$Repo...`n" -ForegroundColor White

  # Fetch workflow runs
  $perPage = if ($All) { 5 } else { 1 }
  $runsData = Invoke-GitHubApi -Path "/repos/$Owner/$Repo/actions/runs?per_page=$perPage"

  if (-not $runsData.workflow_runs -or $runsData.workflow_runs.Count -eq 0) {
    Write-Host "⚠️  No workflow runs found" -ForegroundColor Yellow
    Write-Host "`nTip: Make sure you've pushed commits and the workflow has been triggered."
    return $null
  }

  $runs = $runsData.workflow_runs

  if ($All) {
    Write-Host "Last $($runs.Count) workflow runs:" -ForegroundColor White
    for ($i = 0; $i -lt $runs.Count; $i++) {
      Show-WorkflowRun -Run $runs[$i] -Index $i
    }
  }
  else {
    $latestRun = $runs[0]
    Write-Host "Latest workflow run:`n" -ForegroundColor White
    Show-WorkflowRun -Run $latestRun

    if ($Open) {
      Write-Host "`nOpening in browser..." -ForegroundColor Cyan
      Start-Process $latestRun.html_url
    }

    return $latestRun
  }

  Write-Host "`n───────────────────────────────────────────────────────" -ForegroundColor DarkGray

  if (-not $Token) {
    Write-Host "`n💡 Tip: Set GITHUB_TOKEN environment variable for higher rate limits" -ForegroundColor Yellow
  }

  return $runs[0]
}

# Watch mode - poll until completion
function Watch-CI {
  Write-Host "👀 Watching CI/CD status (Ctrl+C to stop)...`n" -ForegroundColor White

  $lastStatus = $null
  $iteration = 0

  while ($true) {
    $iteration++

    if ($iteration -gt 1) {
      Write-Host "`n" # Add spacing between checks
    }

    $run = Check-CI

    if (-not $run) {
      Write-Host "No runs to watch" -ForegroundColor Yellow
      return
    }

    if ($run.status -ne $lastStatus) {
      $lastStatus = $run.status
      Write-Host "`n⏱️  Status changed: $($run.status)" -ForegroundColor Cyan
    }

    if ($run.status -eq "completed") {
      $success = $run.conclusion -eq "success"
      $message = "Workflow completed with status: $($run.conclusion)"

      if ($success) {
        Write-Host "`n✅ $message" -ForegroundColor Green
      }
      else {
        Write-Host "`n❌ $message" -ForegroundColor Red
      }

      if ($Notify) {
        Show-Notification -Title "CI/CD Complete" -Message $message -Type $(if ($success) { "Info" }else { "Error" })
      }

      if ($Open) {
        Start-Process $run.html_url
      }

      exit $(if ($success) { 0 }else { 1 })
    }
    else {
      Write-Host "`n⏳ Still running... Checking again in 10 seconds" -ForegroundColor DarkGray
      Start-Sleep -Seconds 10
    }
  }
}

# Main execution
try {
  if ($Watch) {
    Watch-CI
  }
  else {
    $run = Check-CI

    if ($run -and $Open) {
      Write-Host "`nOpening in browser..." -ForegroundColor Cyan
      Start-Process $run.html_url
    }
  }
}
catch {
  Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
