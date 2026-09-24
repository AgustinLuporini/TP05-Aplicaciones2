import { TelemetryAdapter } from '../domain/TelemetryAdapter.js';

/**
 * Patrón FACADE: TelemetryFacade
 * Oculta la complejidad de las conexiones de red (Polling REST vs WebSocket Push),
 * proporcionando una interfaz unificada y simple para el resto de la aplicación.
 */
export class TelemetryFacade {
    /**
     * @param {string} baseUrl URL base del backend FastAPI (ej: 'http://localhost:8000')
     * @param {ObservableStore} store Instancia del ObservableStore
     */
    constructor(baseUrl = 'http://localhost:8000', store) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
        this.store = store;

        this.mode = 'rest'; // 'rest' | 'websocket'
        this.model = 'go2'; // 'go2' | 'g1'
        
        this.pollIntervalId = null;
        this.socket = null;
        this.isConnecting = false;
        this.pollRateMs = 500; // 500ms para REST Polling (2 Hz)
    }

    /**
     * Inicializa o cambia la conexión con los parámetros deseados.
     * @param {string} mode 'rest' | 'websocket'
     * @param {string} model 'go2' | 'g1'
     */
    async connect(mode = this.mode, model = this.model) {
        this.disconnect();
        this.mode = mode;
        this.model = model;

        this.store.resetBuffers();
        this.store.setConnectionState(false, this.mode, this.model);

        if (this.mode === 'rest') {
            this.startRESTPolling();
        } else if (this.mode === 'websocket') {
            this.startWebSocket();
        }
    }

    /**
     * Inicia la estrategia de Polling REST con setInterval (500ms)
     */
    startRESTPolling() {
        console.log(`[TelemetryFacade] Iniciando Polling REST (cada ${this.pollRateMs}ms)...`);
        
        const fetchTelemetry = async () => {
            const startT = performance.now();
            try {
                const response = await fetch(`${this.baseUrl}/telemetria?modelo=${this.model}`);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                
                const rawData = await response.json();
                const latencyMs = Math.round(performance.now() - startT);
                
                // Normalizar mediante el ADAPTER
                const adaptedData = TelemetryAdapter.adapt(rawData);
                
                // Enviar al OBSERVER STORE
                this.store.updateTelemetry(adaptedData, latencyMs);
                this.store.setConnectionState(true, 'rest', this.model);
            } catch (err) {
                console.warn('[TelemetryFacade] Error en polling REST:', err.message);
                this.store.setConnectionState(false, 'rest', this.model);
            }
        };

        // Primera llamada inmediata y luego intervalo de 500ms
        fetchTelemetry();
        this.pollIntervalId = setInterval(fetchTelemetry, this.pollRateMs);
    }

    /**
     * Inicia la estrategia de WebSocket en tiempo real (10 Hz = 100ms push)
     */
    startWebSocket() {
        console.log(`[TelemetryFacade] Conectando a WebSocket nativo (${this.wsUrl})...`);
        
        try {
            this.socket = new WebSocket(this.wsUrl);

            let lastMsgTime = performance.now();

            this.socket.onopen = () => {
                console.log('[TelemetryFacade] WebSocket Conectado.');
                this.store.setConnectionState(true, 'websocket', this.model);
            };

            this.socket.onmessage = (event) => {
                const now = performance.now();
                const latencyMs = Math.round(now - lastMsgTime);
                lastMsgTime = now;

                try {
                    const rawData = JSON.parse(event.data);
                    
                    // Forzar el modelo seleccionado en el payload si es necesario
                    if (rawData.modelo !== this.model) {
                        rawData.modelo = this.model;
                    }

                    // Normalizar mediante el ADAPTER
                    const adaptedData = TelemetryAdapter.adapt(rawData);
                    
                    // Enviar al OBSERVER STORE
                    this.store.updateTelemetry(adaptedData, latencyMs > 0 && latencyMs < 500 ? latencyMs : 10);
                } catch (err) {
                    console.error('[TelemetryFacade] Error al parsear mensaje WS:', err);
                }
            };

            this.socket.onerror = (err) => {
                console.error('[TelemetryFacade] Error en WebSocket:', err);
                this.store.setConnectionState(false, 'websocket', this.model);
            };

            this.socket.onclose = () => {
                console.log('[TelemetryFacade] WebSocket cerrado.');
                this.store.setConnectionState(false, 'websocket', this.model);
            };
        } catch (err) {
            console.error('[TelemetryFacade] Fallo al crear WebSocket:', err);
            this.store.setConnectionState(false, 'websocket', this.model);
        }
    }

    /**
     * Detiene cualquier estrategia de conexión activa.
     */
    disconnect() {
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
        }

        if (this.socket) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onerror = null;
            this.socket.onclose = null;
            if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
                this.socket.close();
            }
            this.socket = null;
        }

        console.log('[TelemetryFacade] Conexión cerrada.');
    }

    /**
     * Cambia el modo de transporte (rest vs websocket)
     */
    setMode(newMode) {
        if (this.mode === newMode) return;
        this.connect(newMode, this.model);
    }

    /**
     * Cambia el modelo de robot (go2 vs g1)
     */
    setModel(newModel) {
        if (this.model === newModel) return;
        this.connect(this.mode, newModel);
    }
}
