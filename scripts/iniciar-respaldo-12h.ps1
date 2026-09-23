# Script de Ejecución Programada de Respaldo cada 12 Horas para NeoFaro
# Ubicación: scripts/iniciar-respaldo-12h.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " NeoFaro — Servicio Automatizado de Respaldo cada 12 Horas" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Iniciando bucle de respaldo programado. Presiona Ctrl+C para detener.`n" -ForegroundColor Yellow

$intervaloSegundos = 43200 # 12 horas en segundos (12 * 60 * 60)

while ($true) {
    $fechaActual = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$fechaActual] 🔄 Ejecutando respaldo automático de base de datos..." -ForegroundColor Green
    
    try {
        node scripts/backup-supabase.mjs
    } catch {
        Write-Host "[$fechaActual] ❌ Error al ejecutar el script de respaldo: $_" -ForegroundColor Red
    }

    $proximoRespaldo = (Get-Date).AddSeconds($intervaloSegundos).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "`n⏳ Próximo respaldo programado para: $proximoRespaldo" -ForegroundColor DarkGray
    Write-Host "Esperando 12 horas...`n" -ForegroundColor DarkGray
    
    Start-Sleep -Seconds $intervaloSegundos
}
