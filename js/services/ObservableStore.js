import { CircularBuffer } from '../domain/CircularBuffer.js';

/**
 * Patrón OBSERVER / Event Bus & Reactive Store
 * Administra el estado global de la aplicación y notifica a los observadores (componentes UI)
 * cuando ocurren eventos de actualización de telemetría o cambio de estado.
 */
export class ObservableStore {
    constructor() {
        this.listeners = new Map();
        
        // Estado global centralizado
        this.state = {
            currentTelemetry: null,
            connectionMode: 'rest', // 'rest' | 'websocket'
            robotModel: 'go2',      // 'go2' | 'g1'
            isConnected: false,
            latencyMs: 0,
            packetRateHz: 0,
            totalPackets: 0,
            lastPacketTimestamp: 0
        };

        // Búferes circulares para gráficos e historial (Capacidad: 300 muestras = 30s a 10Hz)
        this.imuBuffer = {
            roll: new CircularBuffer(300),
            pitch: new CircularBuffer(300),
            yaw: new CircularBuffer(300),
            timestamps: new CircularBuffer(300)
        };

        // Historial por motor: { motorId: CircularBuffer }
        this.motorBuffers = new Map();

        // Para cálculo de Hz (frecuencia de paquetes)
        this.packetCountWindow = 0;
        this.lastHzCalculation = Date.now();
        this.startHzMonitor();
    }

    /**
     * Suscribe un callback a un evento específico.
     * @param {string} event Nombre del evento (ej: 'telemetry_updated', 'connection_changed')
     * @param {Function} callback Función a ejecutar cuando ocurra el evento
     * @returns {Function} Función para cancelar la suscripción
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Devolver función de desuscripción
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Notifica a todos los suscriptores registrados para un evento.
     * @param {string} event 
     * @param {any} payload 
     */
    notify(event, payload) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(payload, this.state);
                } catch (error) {
                    console.error(`Error en listener de evento '${event}':`, error);
                }
            });
        }
    }

    /**
     * Actualiza la telemetría recibida desde la Facade y alimenta los búferes circulares.
     * @param {Object} telemetry DTO adaptado
     * @param {number} latencyMs Latencia calculada en milisegundos
     */
    updateTelemetry(telemetry, latencyMs = 0) {
        if (!telemetry) return;

        this.state.currentTelemetry = telemetry;
        this.state.isConnected = true;
        this.state.latencyMs = latencyMs;
        this.state.totalPackets++;
        this.packetCountWindow++;
        this.state.lastPacketTimestamp = Date.now();

        // 1. Alimentar Búfer Circular IMU
        const tsLabel = `${telemetry.ts}s`;
        this.imuBuffer.timestamps.push(tsLabel);
        this.imuBuffer.roll.push(telemetry.imu.roll);
        this.imuBuffer.pitch.push(telemetry.imu.pitch);
        this.imuBuffer.yaw.push(telemetry.imu.yaw);

        // 2. Alimentar Búfer Circular por Motor (Temperatura)
        telemetry.motores.forEach(m => {
            if (!this.motorBuffers.has(m.id)) {
                this.motorBuffers.set(m.id, new CircularBuffer(300));
            }
            this.motorBuffers.get(m.id).push(m.temperatura);
        });

        // Notificar a todos los paneles UI del nuevo paquete de telemetría
        this.notify('telemetry_updated', {
            telemetry,
            imuBuffer: this.imuBuffer,
            motorBuffers: this.motorBuffers,
            stats: {
                latencyMs: this.state.latencyMs,
                packetRateHz: this.state.packetRateHz,
                totalPackets: this.state.totalPackets,
                connectionMode: this.state.connectionMode,
                robotModel: this.state.robotModel
            }
        });
    }

    /**
     * Actualiza el estado de la conexión
     */
    setConnectionState(isConnected, mode = this.state.connectionMode, model = this.state.robotModel) {
        this.state.isConnected = isConnected;
        this.state.connectionMode = mode;
        this.state.robotModel = model;
        this.notify('connection_changed', this.state);
    }

    /**
     * Resetea los búferes al cambiar de modelo o modo
     */
    resetBuffers() {
        this.imuBuffer.roll.clear();
        this.imuBuffer.pitch.clear();
        this.imuBuffer.yaw.clear();
        this.imuBuffer.timestamps.clear();
        this.motorBuffers.clear();
        this.state.totalPackets = 0;
        this.notify('buffers_reset', null);
    }

    /**
     * Monitor continuo para calcular la frecuencia de paquetes real (Hz)
     */
    startHzMonitor() {
        setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = (now - this.lastHzCalculation) / 1000;
            if (elapsedSeconds > 0) {
                this.state.packetRateHz = Math.round((this.packetCountWindow / elapsedSeconds) * 10) / 10;
            }
            this.packetCountWindow = 0;
            this.lastHzCalculation = now;
            this.notify('stats_updated', {
                packetRateHz: this.state.packetRateHz,
                latencyMs: this.state.latencyMs,
                isConnected: this.state.isConnected
            });
        }, 1000);
    }
}
