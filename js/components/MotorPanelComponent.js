/**
 * Componente UI: MotorPanelComponent
 * Muestra la tabla de motores con la lógica de 'semáforo' de temperatura
 * (Verde <40°C, Amarillo 40-60°C, Rojo >60°C) y métricas cinemáticas.
 */
export class MotorPanelComponent {
    /**
     * @param {string} containerId ID del contenedor de la tabla
     */
    constructor(containerId = 'motor-panel-container') {
        this.container = document.getElementById(containerId);
        this.renderSkeleton();
    }

    renderSkeleton() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="panel-card glass-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fa-solid fa-gears"></i>
                        <span>Panel de Motores & Actuadores</span>
                    </div>
                    <div class="panel-badges">
                        <span class="badge badge-info" id="motorCountBadge">0 Motores</span>
                        <span class="badge badge-warning" id="motorAvgTempBadge">Prom: 0°C</span>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="telemetry-table" id="tablaMotores">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Articulación / Nombre</th>
                                <th>Temperatura</th>
                                <th>Ángulo (°)</th>
                                <th>Velocidad (rad/s)</th>
                                <th>Torque (N·m)</th>
                            </tr>
                        </thead>
                        <tbody id="tablaMotoresBody">
                            <tr>
                                <td colspan="6" class="text-center text-muted">Cargando datos de motores...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        this.tbody = document.getElementById('tablaMotoresBody');
        this.motorCountBadge = document.getElementById('motorCountBadge');
        this.motorAvgTempBadge = document.getElementById('motorAvgTempBadge');
    }

    /**
     * Actualiza la tabla de motores con los nuevos datos recibidos
     * @param {Array} motores Lista de DTOs de motores adaptados
     * @param {Object} stats Métricas agregadas
     */
    update(motores, stats) {
        if (!this.tbody || !motores) return;

        // Actualizar badges
        if (this.motorCountBadge) this.motorCountBadge.textContent = `${motores.length} Motores`;
        if (this.motorAvgTempBadge) this.motorAvgTempBadge.textContent = `Prom: ${stats.tempPromedio}°C`;

        // Renderizar filas de la tabla
        let rowsHtml = '';
        for (const m of motores) {
            rowsHtml += `
                <tr class="motor-row">
                    <td class="font-mono text-center"><strong>#${m.id}</strong></td>
                    <td class="joint-name">${m.nombre}</td>
                    <td>
                        <div class="temp-semaforo-cell" style="--temp-color: ${m.tempColor}">
                            <span class="temp-dot" style="background-color: ${m.tempColor}"></span>
                            <span class="temp-value font-mono">${m.temperatura.toFixed(1)} °C</span>
                            <span class="temp-status-tag" style="color: ${m.tempColor}">${m.tempStatus}</span>
                        </div>
                    </td>
                    <td class="font-mono ${m.angulo >= 0 ? 'pos-val' : 'neg-val'}">${m.angulo > 0 ? '+' : ''}${m.angulo.toFixed(2)}°</td>
                    <td class="font-mono">${m.velocidad.toFixed(3)} rad/s</td>
                    <td class="font-mono">${m.torque.toFixed(2)} N·m</td>
                </tr>
            `;
        }

        this.tbody.innerHTML = rowsHtml;
    }
}
