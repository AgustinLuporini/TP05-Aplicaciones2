/**
 * Componente UI: BMSPanelComponent
 * Muestra el estado del sistema de gestión de baterías (BMS):
 * SOC %, Corriente mA, Temperatura °C y el voltaje individual de cada celda (10 celdas).
 */
export class BMSPanelComponent {
    /**
     * @param {string} containerId ID del contenedor HTML
     */
    constructor(containerId = 'bms-panel-container') {
        this.container = document.getElementById(containerId);
        this.renderSkeleton();
    }

    renderSkeleton() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="panel-card glass-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fa-solid fa-battery-three-quarters"></i>
                        <span>Panel BMS (Sistema de Batería LiPo)</span>
                    </div>
                    <div class="panel-badges">
                        <span class="badge badge-success" id="bmsStatusBadge">NORMAL</span>
                    </div>
                </div>

                <!-- SOC Main Bar -->
                <div class="bms-main-status">
                    <div class="soc-header">
                        <span class="soc-title">Nivel de Carga (SOC)</span>
                        <span class="soc-value font-mono" id="bmsSocVal">0%</span>
                    </div>
                    <div class="soc-bar-track">
                        <div class="soc-bar-fill" id="bmsSocFill" style="width: 0%;"></div>
                    </div>
                </div>

                <!-- Secundary BMS Metrics -->
                <div class="bms-metrics-row">
                    <div class="bms-metric">
                        <span class="lbl">Corriente Total</span>
                        <span class="val font-mono" id="bmsI">0 mA</span>
                    </div>
                    <div class="bms-metric">
                        <span class="lbl">Temperatura BMS</span>
                        <span class="val font-mono" id="bmsT">0.0 °C</span>
                    </div>
                </div>

                <!-- Cell Grid -->
                <div class="cells-section">
                    <div class="cells-title">Voltaje por Celda (10S Battery Array)</div>
                    <div class="cells-grid" id="bmsCeldasGrid">
                        <div class="text-muted text-center" style="grid-column: 1 / -1;">Cargando celdas...</div>
                    </div>
                </div>
            </div>
        `;

        this.elSocVal = document.getElementById('bmsSocVal');
        this.elSocFill = document.getElementById('bmsSocFill');
        this.elI = document.getElementById('bmsI');
        this.elT = document.getElementById('bmsT');
        this.elCeldasGrid = document.getElementById('bmsCeldasGrid');
        this.elStatusBadge = document.getElementById('bmsStatusBadge');
    }

    /**
     * Actualiza el panel BMS con los datos recibidos
     * @param {Object} bms DTO BMS adaptado
     */
    update(bms) {
        if (!bms) return;

        const soc = bms.soc;
        if (this.elSocVal) this.elSocVal.textContent = `${soc.toFixed(1)}%`;
        if (this.elSocFill) {
            this.elSocFill.style.width = `${soc}%`;
            // Cambiar color de la barra según carga
            if (soc > 50) this.elSocFill.style.backgroundColor = '#10b981';
            else if (soc > 25) this.elSocFill.style.backgroundColor = '#f59e0b';
            else this.elSocFill.style.backgroundColor = '#ef4444';
        }

        if (this.elI) this.elI.textContent = `${bms.corriente} mA`;
        if (this.elT) this.elT.textContent = `${bms.temperatura.toFixed(1)} °C`;

        // Renderizar Celdas (10 celdas)
        if (this.elCeldasGrid && Array.isArray(bms.celdas)) {
            let html = '';
            bms.celdas.forEach((v, idx) => {
                // Color por rango de celda (ej: 3.7V nominal)
                let statusClass = 'cell-good';
                if (v < 3.4) statusClass = 'cell-low';
                else if (v < 3.6) statusClass = 'cell-mid';

                html += `
                    <div class="cell-card ${statusClass}">
                        <div class="cell-name">C${idx + 1}</div>
                        <div class="cell-val font-mono">${v.toFixed(3)} V</div>
                    </div>
                `;
            });
            this.elCeldasGrid.innerHTML = html;
        }
    }
}
