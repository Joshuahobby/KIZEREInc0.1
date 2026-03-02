$jsonPath = "f:\Joe\GetRwanda\2026\KIZEREInc0.1\client\src\lib\i18n\locales\rw.json"
$appendPath = "f:\Joe\GetRwanda\2026\KIZEREInc0.1\rw_append_final.json"
$content = Get-Content -Path $jsonPath -Raw
$index = $content.LastIndexOf('}')
if ($index -ge 0) {
    $content = $content.Substring(0, $index)
    $appendToAdd = Get-Content -Path $appendPath -Raw
    $finalContent = $content + $appendToAdd
    $finalContent | Set-Content -Path $jsonPath -Encoding utf8
    Write-Host "Successfully updated rw.json"
} else {
    Write-Error "Could not find closing brace"
}
