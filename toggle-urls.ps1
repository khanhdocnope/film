# =====================================================
# FilmXem - URL Toggle Script
# =====================================================
# Usage:
#   .\toggle-urls.ps1 local        -> Add .html  (for Live Server)
#   .\toggle-urls.ps1 production   -> Remove .html (for Apache + .htaccess)
# =====================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "production")]
    [string]$Mode
)

$projectRoot = $PSScriptRoot

$jsFiles = @(
    "$projectRoot\js\home.js",
    "$projectRoot\js\detail.js",
    "$projectRoot\js\watch.js",
    "$projectRoot\js\core.js",
    "$projectRoot\js\Privacy-policy.js",
    "$projectRoot\detail.html",
    "$projectRoot\index.html",
    "$projectRoot\Privacy-policy.html"
)

# Each pair: [CleanURL, HtmlURL]
# Hỗ trợ cả nháy đơn và nháy kép
$pairs = @(
    @{ Clean = '"detail?id=';  Html = '"detail.html?id='  }
    @{ Clean = '"watch?id=';   Html = '"watch.html?id='   }
    @{ Clean = "'detail?id=";  Html = "'detail.html?id="  }
    @{ Clean = "'watch?id=";   Html = "'watch.html?id="   }
    @{ Clean = '"./?focus=genres"';  Html = '"index.html?focus=genres"'  }
    @{ Clean = "'./?focus=genres'";  Html = "'index.html?focus=genres'"  }
    @{ Clean = '"./?view=saved"';   Html = '"index.html?view=saved"'   }
    @{ Clean = "'./?view=saved'";   Html = "'index.html?view=saved'"   }
    @{ Clean = '"./"';              Html = '"index.html"'              }
    @{ Clean = "'./'";              Html = "'index.html'"              }
    @{ Clean = '"Privacy-policy"';              Html = '"Privacy-policy.html"'              }
    @{ Clean = "'Privacy-policy'";              Html = "'Privacy-policy.html'"              }
)

$totalChanges = 0

Write-Host ""
Write-Host "=== FilmXem URL Toggle: $($Mode.ToUpper()) mode ===" -ForegroundColor White
Write-Host ""

foreach ($file in $jsFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "  [SKIP] Not found: $file" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $file -Raw -Encoding UTF8
    $original = $content
    $fileChanges = 0

    foreach ($pair in $pairs) {
        if ($Mode -eq "local") {
            # production -> local: insert .html
            if ($content.Contains($pair.Clean)) {
                $content = $content.Replace($pair.Clean, $pair.Html)
                $fileChanges++
            }
        } else {
            # local -> production: remove .html
            if ($content.Contains($pair.Html)) {
                $content = $content.Replace($pair.Html, $pair.Clean)
                $fileChanges++
            }
        }
    }

    $fileName = Split-Path $file -Leaf
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
        $totalChanges += $fileChanges
        Write-Host "  [OK]  $fileName  ($fileChanges replacements)" -ForegroundColor Green
    } else {
        Write-Host "  [--]  $fileName  (no changes)" -ForegroundColor DarkGray
    }
}

Write-Host ""
if ($Mode -eq "local") {
    Write-Host "  Done! Ready for Live Server." -ForegroundColor Cyan
    Write-Host "  URL format: detail.html?id=...  /  watch.html?id=..." -ForegroundColor DarkCyan
    Write-Host "  Open: http://127.0.0.1:5500/index.html" -ForegroundColor White
} else {
    Write-Host "  Done! Ready for Apache hosting." -ForegroundColor Magenta
    Write-Host "  URL format: detail?id=...  /  watch?id=..." -ForegroundColor DarkMagenta
    Write-Host "  Deploy with .htaccess for clean URLs." -ForegroundColor White
}
Write-Host "  Total replacements: $totalChanges" -ForegroundColor White
Write-Host ""