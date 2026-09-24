import { ObservableStore } from './services/ObservableStore.js';
import { TelemetryFacade } from './services/TelemetryFacade.js';
import { CSVExporter } from './services/CSVExporter.js';

import { MotorPanelComponent } from './components/MotorPanelComponent.js';
import { IMUPanelComponent } from './components/IMUPanelComponent.js';
import { BMSPanelComponent } from './components/BMSPanelComponent.js';
import { ForcesPanelComponent } from './components/ForcesPanelComponent.js';

/**
 * App Main Controller & Bootstrap
 * Integra los servicios Facade, Observer y los componentes UI.
 */
class TelemetryApp {
    constructor() {
        // 1. Inicializar Servicios Core
        this.store = new ObservableStore();
        this.facade = new TelemetryFacade('http://localhost:8000', this.store);
        this.csvExporter = new CSVExporter();

        // 2. Inicializar Componentes UI
        this.motorPanel = new MotorPanelComponent('motor-panel-container');
        this.imuPanel = new IMUPanelComponent('imu-panel-container');
        this.bmsPanel = new BMSPanelComponent('bms-panel-container');
        this.forcesPanel = new ForcesPanelComponent('forces-panel-container');

        // 3. Vincular Eventos del DOM (Botones y Controles)
        this.bindDOMEvents();

        // 4. Suscribir Observadores al ObservableStore
        this.subscribeObservers();

        // 5. Iniciar Conexión por defecto (Polling REST @ 500ms)
        this.facade.connect('rest', 'go2');
    }

    /**
     * Vincula los botones de la barra de herramientas y acciones
     */
    bindDOMEvents() {
        // Selector de Modo (REST Polling vs WebSocket)
        const btnRest = document.getElementById('btnModeREST');
        const btnWS = document.getElementById('btnModeWS');

        if (btnRest && btnWS) {
            btnRest.addEventListener('click', () => {
                this.setActiveButton(btnRest, btnWS);
                this.facade.setMode('rest');
            });

            btnWS.addEventListener('click', () => {
                this.setActiveButton(btnWS, btnRest);
                this.facade.setMode('websocket');
            });
        }

        // Selector de Modelo (Go2 vs G1)
        const btnGo2 = document.getElementById('btnModelGo2');
        const btnG1 = document.getElementById('btnModelG1');

        if (btnGo2 && btnG1) {
            btnGo2.addEventListener('click', () => {
                this.setActiveButton(btnGo2, btnG1);
                this.facade.setModel('go2');
            });

            btnG1.addEventListener('click', () => {
                this.setActiveButton(btnG1, btnGo2);
                this.facade.setModel('g1');
            });
        }

        // Acciones CSV
        const btnCapturar = document.getElementById('btnCapturarMuestra');
        const btnExportar = document.getElementById('btnExportarCSV');
        const nMuestrasBadge = document.getElementById('nMuestras');

        if (btnCapturar) {
            btnCapturar.addEventListener('click', () => {
                const currentData = this.store.state.currentTelemetry;
                if (!currentData) {
                    alert('Aún no hay telemetría disponible para capturar.');
                    return;
                }
                const count = this.csvExporter.captureSample(currentData);
                if (nMuestrasBadge) nMuestrasBadge.textContent = count;

                // Animación visual de captura
                btnCapturar.classList.add('pulse-effect');
                setTimeout(() => btnCapturar.classList.remove('pulse-effect'), 400);
            });
        }

        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                this.csvExporter.exportCSV();
            });
        }
    }

    /**
     * Suscribe los componentes visuales a las notificaciones del ObservableStore
     */
    subscribeObservers() {
        // Observador de actualización de telemetría (10 Hz o 2 Hz)
        this.store.subscribe('telemetry_updated', ({ telemetry, imuBuffer, stats }) => {
            // Actualizar panel de motores
            this.motorPanel.update(telemetry.motores, telemetry.stats);

            // Actualizar panel IMU + gráfico circular buffer
            this.imuPanel.update(telemetry.imu, imuBuffer);

            // Actualizar panel BMS
            this.bmsPanel.update(telemetry.bms);

            // Actualizar panel de Fuerzas
            this.forcesPanel.update(telemetry.fuerzas);

            // Actualizar latencia y Hz en header
            this.updateHeaderStats(stats);
        });

        // Observador de cambios de conexión o modelo
        this.store.subscribe('connection_changed', (state) => {
            const statusIndicator = document.getElementById('connectionStatusPill');
            if (statusIndicator) {
                if (state.isConnected) {
                    statusIndicator.className = 'status-pill online';
                    statusIndicator.innerHTML = `<span class="dot"></span> ${state.connectionMode.toUpperCase()} ONLINE (${state.robotModel.toUpperCase()})`;
                } else {
                    statusIndicator.className = 'status-pill offline';
                    statusIndicator.innerHTML = `<span class="dot"></span> DESCONECTADO`;
                }
            }
        });

        // Observador de estadísticas (frecuencia Hz)
        this.store.subscribe('stats_updated', ({ packetRateHz, latencyMs }) => {
            const hzElem = document.getElementById('statHzRate');
            const latencyElem = document.getElementById('statLatency');
            if (hzElem) hzElem.textContent = `${packetRateHz} Hz`;
            if (latencyElem) latencyElem.textContent = `${latencyMs} ms`;
        });
    }

    /**
     * Actualiza el badge de estado en el header
     */
    updateHeaderStats(stats) {
        const modeLabel = document.getElementById('currentModeLabel');
        if (modeLabel) {
            modeLabel.textContent = stats.connectionMode === 'websocket' ? 'WebSocket (Push 10 Hz)' : 'REST Polling (Pull 2 Hz)';
        }
    }

    /**
     * Utilidad para alternar botones activos
     */
    setActiveButton(activeBtn, inactiveBtn) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
    }
}

// Inicializar la aplicación una vez que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.telemetryApp = new TelemetryApp();
});
