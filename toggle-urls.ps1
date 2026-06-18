# =====================================================
# FilmXem - URL Toggle Script
# =====================================================
# Usage:
#   .\toggle-urls.ps1 local        -> Add .html  (for Live Server)
#   .\toggle-urls.ps1 production   -> Remove .html (for Apache + .htaccess)
#   .\toggle-urls.ps1              -> Auto-toggle between modes based on current files
# =====================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "production", "toggle")]
    [string]$Mode = "toggle"
)

$projectRoot = $PSScriptRoot

# Dynamic file discovery (finds all .html and .js files recursively)
$targetFiles = Get-ChildItem -Path $projectRoot -Recurse -Include *.html, *.js | Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" -and $_.FullName -notlike "*\.github\*"
}

# Each pair: [CleanURL, HtmlURL]
$pairs = @(
    @{ Clean = '"watch?id=';   Html = '"watch.html?id='   }
    @{ Clean = "'watch?id=";   Html = "'watch.html?id="   }
    @{ Clean = '`watch?id=';   Html = '`watch.html?id='   }
    @{ Clean = '"detail?id=';  Html = '"detail.html?id='  }
    @{ Clean = "'detail?id=";  Html = "'detail.html?id="  }
    @{ Clean = '`detail?id=';  Html = '`detail.html?id='  }
    @{ Clean = '"search?q=';   Html = '"search.html?q='   }
    @{ Clean = "'search?q=";   Html = "'search.html?q="   }
    @{ Clean = '`search?q=';   Html = '`search.html?q='   }
    @{ Clean = '"./?focus=genres"';    Html = '"index.html?focus=genres"'  }
    @{ Clean = "'./?focus=genres'";    Html = "'index.html?focus=genres'"  }
    @{ Clean = '`./?focus=genres`';    Html = '`index.html?focus=genres`'  }
    @{ Clean = '"./?view=saved"';     Html = '"index.html?view=saved"'   }
    @{ Clean = "'./?view=saved'";     Html = "'index.html?view=saved'"   }
    @{ Clean = '`./?view=saved`';     Html = '`index.html?view=saved`'   }
    @{ Clean = '"Privacy-policy"';    Html = '"Privacy-policy.html"'     }
    @{ Clean = "'Privacy-policy'";    Html = "'Privacy-policy.html'"     }
    @{ Clean = '"./Privacy-policy"';  Html = '"Privacy-policy.html"'     }
    @{ Clean = "'./Privacy-policy'";  Html = "'Privacy-policy.html'"     }
    @{ Clean = '"Terms-of-use"';      Html = '"Terms-of-use.html"'       }
    @{ Clean = "'Terms-of-use'";      Html = "'Terms-of-use.html'"       }
    @{ Clean = '"./Terms-of-use"';    Html = '"Terms-of-use.html"'       }
    @{ Clean = "'./Terms-of-use'";    Html = "'Terms-of-use.html'"       }
    @{ Clean = '"./"';                Html = '"index.html"'              }
    @{ Clean = "'./'";                Html = "'index.html'"              }
)

# If mode is "toggle", auto-detect by counting clean vs html instances
if ($Mode -eq "toggle") {
    $cleanCount = 0
    $htmlCount = 0
    
    foreach ($file in $targetFiles) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        foreach ($pair in $pairs) {
            if ($content.Contains($pair.Clean)) { $cleanCount++ }
            if ($content.Contains($pair.Html)) { $htmlCount++ }
        }
    }
    
    # If we have more clean URLs, toggle to local (html), else to production (clean)
    if ($cleanCount -gt $htmlCount) {
        $Mode = "local"
    } else {
        $Mode = "production"
    }
    
    Write-Host "Auto-detected mode based on files: " -NoNewline
    if ($Mode -eq "local") {
        Write-Host "LOCAL (Adding .html extensions)" -ForegroundColor Green
    } else {
        Write-Host "PRODUCTION (Cleaning .html extensions)" -ForegroundColor Magenta
    }
}

$totalChanges = 0

Write-Host ""
Write-Host "=== FilmXem URL Toggle: $($Mode.ToUpper()) mode ===" -ForegroundColor White
Write-Host ""

foreach ($file in $targetFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
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

    $fileName = $file.Name
    $relPath = $file.FullName.Replace($projectRoot, "").TrimStart("\")
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
        $totalChanges += $fileChanges
        Write-Host "  [OK]  $relPath  ($fileChanges replacements)" -ForegroundColor Green
    } else {
        Write-Host "  [--]  $relPath  (no changes)" -ForegroundColor DarkGray
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