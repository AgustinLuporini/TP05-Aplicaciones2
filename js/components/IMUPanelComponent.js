/**
 * Componente UI: IMUPanelComponent
 * Muestra los valores numéricos de Roll, Pitch, Yaw y Aceleraciones,
 * y gestiona el gráfico histórico lineal en tiempo real con Chart.js sustentado por el Búfer Circular (300 muestras).
 */
export class IMUPanelComponent {
    /**
     * @param {string} containerId ID del elemento HTML contenedor
     */
    constructor(containerId = 'imu-panel-container') {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.renderSkeleton();
        this.initChart();
    }

    renderSkeleton() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="panel-card glass-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fa-solid fa-compass"></i>
                        <span>Panel IMU (Unidad de Medición Inercial)</span>
                    </div>
                    <div class="panel-badges">
                        <span class="badge badge-accent"><i class="fa-solid fa-bolt"></i> 300 Muestras (30s)</span>
                    </div>
                </div>

                <!-- Indicadores Numéricos -->
                <div class="imu-metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">ROLL (Inclinación Lateral)</div>
                        <div class="metric-value font-mono" id="imu-roll">0.00°</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">PITCH (Cabeceo)</div>
                        <div class="metric-value font-mono" id="imu-pitch">0.00°</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">YAW (Orientación / Giro)</div>
                        <div class="metric-value font-mono" id="imu-yaw">0.00°</div>
                    </div>
                </div>

                <div class="accel-subgrid">
                    <div class="accel-chip">AX: <span id="imu-ax" class="font-mono">0.000</span> m/s²</div>
                    <div class="accel-chip">AY: <span id="imu-ay" class="font-mono">0.000</span> m/s²</div>
                    <div class="accel-chip">AZ: <span id="imu-az" class="font-mono">9.810</span> m/s²</div>
                </div>

                <!-- Gráfico Chart.js con Búfer Circular -->
                <div class="chart-wrapper">
                    <canvas id="imuChartCanvas"></canvas>
                </div>
            </div>
        `;

        this.elRoll = document.getElementById('imu-roll');
        this.elPitch = document.getElementById('imu-pitch');
        this.elYaw = document.getElementById('imu-yaw');
        this.elAx = document.getElementById('imu-ax');
        this.elAy = document.getElementById('imu-ay');
        this.elAz = document.getElementById('imu-az');
    }

    /**
     * Inicializa el gráfico Chart.js con estilos cibernéticos y rendimiento optimizado.
     */
    initChart() {
        const ctx = document.getElementById('imuChartCanvas')?.getContext('2d');
        if (!ctx || typeof Chart === 'undefined') return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Roll (°)',
                        borderColor: '#3b82f6', // Azul neón
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,
                        data: []
                    },
                    {
                        label: 'Pitch (°)',
                        borderColor: '#10b981', // Verde esmeralda
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,
                        data: []
                    },
                    {
                        label: 'Yaw (°)',
                        borderColor: '#f59e0b', // Ámbar
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Desactivar animación por defecto para alto rendimiento a 10 Hz
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#94a3b8',
                            font: { family: "'Inter', sans-serif", size: 12 }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1'
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#64748b',
                            maxTicksLimit: 10,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        ticks: { color: '#64748b', font: { size: 10 } }
                    }
                }
            }
        });
    }

    /**
     * Actualiza los indicadores numéricos e inyecta los datos del búfer circular en Chart.js
     * @param {Object} imu DTO de la IMU actual
     * @param {Object} imuBuffer Búferes circulares de Roll, Pitch, Yaw y Timestamps
     */
    update(imu, imuBuffer) {
        if (!imu) return;

        // 1. Actualizar números
        if (this.elRoll) this.elRoll.textContent = `${imu.roll.toFixed(2)}°`;
        if (this.elPitch) this.elPitch.textContent = `${imu.pitch.toFixed(2)}°`;
        if (this.elYaw) this.elYaw.textContent = `${imu.yaw.toFixed(2)}°`;
        if (this.elAx) this.elAx.textContent = imu.ax.toFixed(3);
        if (this.elAy) this.elAy.textContent = imu.ay.toFixed(3);
        if (this.elAz) this.elAz.textContent = imu.az.toFixed(3);

        // 2. Actualizar Chart.js consumiendo toArray() del CircularBuffer
        if (this.chart && imuBuffer) {
            this.chart.data.labels = imuBuffer.timestamps.toArray();
            this.chart.data.datasets[0].data = imuBuffer.roll.toArray();
            this.chart.data.datasets[1].data = imuBuffer.pitch.toArray();
            this.chart.data.datasets[2].data = imuBuffer.yaw.toArray();
            
            // Actualizar sin animación pesada
            this.chart.update('none');
        }
    }
}
