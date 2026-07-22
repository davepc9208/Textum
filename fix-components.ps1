# fix-components.ps1
Write-Host "🔧 Aplicando correcciones a todos los componentes..." -ForegroundColor Yellow

# 1. BlogPreview - Eliminar useRef
Write-Host "📝 1. Corrigiendo BlogPreview..." -ForegroundColor Cyan
$file = "src/components/BlogPreview.tsx"
if (Test-Path $file) {
    (Get-Content $file) -replace 'import { useState, useEffect, useRef } from', 'import { useState, useEffect } from' | Set-Content $file
}

# 2. Services - Eliminar index de props
Write-Host "📝 2. Corrigiendo Services..." -ForegroundColor Cyan
$file = "src/components/Services.tsx"
if (Test-Path $file) {
    (Get-Content $file) -replace 'index: number;', '' | Set-Content $file
    (Get-Content $file) -replace '{ title, description, icon, index }', '{ title, description, icon }' | Set-Content $file
}

# 3. ShareCard - Timer cleanup
Write-Host "📝 3. Corrigiendo ShareCard..." -ForegroundColor Cyan
$file = "src/components/ShareCard.tsx"
if (Test-Path $file) {
    # Crear backup
    Copy-Item $file "$file.bak"
    
    # Aplicar corrección de timer
    $content = Get-Content $file -Raw
    $content = $content -replace '(useEffect\(\(\) => \{[^}]*setTimeout\(\(\) => setCopied\(false\), 2000\);)([^}]*\}\))', '$1 return () => clearTimeout(timer);$2'
    $content | Set-Content $file
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE: Revisa los cambios manualmente" -ForegroundColor Red
Write-Host "Los siguientes archivos requieren cambios manuales:" -ForegroundColor Yellow
Write-Host "  - RichTextEditor.tsx (alert/prompt → modales)"
Write-Host "  - ShareMenu.tsx (agregar role y aria-label)"
Write-Host "  - Hero.tsx (prefers-reduced-motion)"
Write-Host "  - ColeccionesTextum.tsx (centralizar datos)"
Write-Host "  - StickyDiagnosis.tsx (combinar estados)"
Write-Host ""
Write-Host "Después de revisar, haz commit:" -ForegroundColor Green
Write-Host "  git add ."
Write-Host '  git commit -m "fix: resolver issues de accesibilidad, seguridad y rendimiento"'
Write-Host "  git push origin nueva-version"