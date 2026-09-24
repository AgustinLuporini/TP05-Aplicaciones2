/**
 * Patrón ADAPTER: TelemetryAdapter
 * Transforma y normaliza las respuestas JSON heterogéneas del servidor (o distintos modelos de robot)
 * en DTOs (Data Transfer Objects) estructurados y limpios para la capa de visualización.
 */

// Mapeo de nombres de articulaciones para Unitree Go2 (Cuadrúpedo - 12 motores)
const GO2_JOINT_NAMES = [
    'FR_Hip (Cadera DI)', 'FR_Thigh (Muslo DI)', 'FR_Calf (Pantorrilla DI)',
    'FL_Hip (Cadera UI)', 'FL_Thigh (Muslo UI)', 'FL_Calf (Pantorrilla UI)',
    'RR_Hip (Cadera DD)', 'RR_Thigh (Muslo DD)', 'RR_Calf (Pantorrilla DD)',
    'RL_Hip (Cadera UD)', 'RL_Thigh (Muslo UD)', 'RL_Calf (Pantorrilla UD)'
];

// Mapeo de nombres para Unitree G1 (Humanoides - 29 motores)
const G1_JOINT_NAMES = Array.from({ length: 29 }, (_, i) => {
    const joints = [
        'Waist_Yaw', 'Waist_Roll', 'Waist_Pitch',
        'L_Shoulder_Pitch', 'L_Shoulder_Roll', 'L_Shoulder_Yaw', 'L_Elbow', 'L_Wrist',
        'R_Shoulder_Pitch', 'R_Shoulder_Roll', 'R_Shoulder_Yaw', 'R_Elbow', 'R_Wrist',
        'L_Hip_Pitch', 'L_Hip_Roll', 'L_Hip_Yaw', 'L_Knee', 'L_Ankle_Pitch', 'L_Ankle_Roll',
        'R_Hip_Pitch', 'R_Hip_Roll', 'R_Hip_Yaw', 'R_Knee', 'R_Ankle_Pitch', 'R_Ankle_Roll',
        'Neck_Pitch', 'Neck_Yaw', 'Head_Pitch', 'Head_Roll'
    ];
    return joints[i] || `Joint_${i}`;
});

export class TelemetryAdapter {
    /**
     * Adapta un payload de telemetría sin procesar a la estructura normalizada DTO.
     * @param {Object} rawData Payload JSON directo del endpoint GET /telemetria o WebSocket /ws
     * @returns {Object} Normalized Telemetry DTO
     */
    static adapt(rawData) {
        if (!rawData) return null;

        const modelo = (rawData.modelo || 'go2').toLowerCase();
        const jointMap = modelo === 'go2' ? GO2_JOINT_NAMES : G1_JOINT_NAMES;

        // Normalizar lista de motores
        const motores = (rawData.motores || []).map((m, idx) => {
            const temp = Number(m.temperatura) || 0;
            return {
                id: m.id ?? idx,
                nombre: jointMap[idx] || `Motor ${m.id}`,
                angulo: Number(m.angulo) || 0,
                velocidad: Number(m.velocidad) || 0,
                torque: Number(m.torque) || 0,
                temperatura: temp,
                // Lógica de semáforo integrada en el DTO
                tempColor: TelemetryAdapter.getTemperatureColor(temp),
                tempStatus: TelemetryAdapter.getTemperatureStatus(temp)
            };
        });

        // Normalizar IMU
        const rawImu = rawData.imu || {};
        const imu = {
            roll: Number(rawImu.roll) || 0,
            pitch: Number(rawImu.pitch) || 0,
            yaw: Number(rawImu.yaw) || 0,
            ax: Number(rawImu.ax) || 0,
            ay: Number(rawImu.ay) || 0,
            az: Number(rawImu.az) || 0
        };

        // Normalizar BMS
        const rawBms = rawData.bms || {};
        const bms = {
            soc: Math.min(100, Math.max(0, Number(rawBms.soc) || 0)),
            corriente: Number(rawBms.corriente) || 0,
            temperatura: Number(rawBms.temperatura) || 0,
            celdas: Array.isArray(rawBms.celdas) ? rawBms.celdas.map(Number) : []
        };

        // Normalizar Fuerzas (patas FR, FL, RR, RL)
        const rawFuerzas = rawData.fuerzas || {};
        const fuerzas = {
            FR: Boolean(rawFuerzas.FR),
            FL: Boolean(rawFuerzas.FL),
            RR: Boolean(rawFuerzas.RR),
            RL: Boolean(rawFuerzas.RL)
        };

        // Métricas calculadas/agregadas
        const tempPromedio = motores.length > 0 
            ? (motores.reduce((acc, curr) => acc + curr.temperatura, 0) / motores.length).toFixed(1)
            : 0;

        return {
            modelo: rawData.modelo || 'go2',
            ts: Number(rawData.ts) || 0,
            timestampMs: Date.now(),
            motores,
            imu,
            bms,
            fuerzas,
            stats: {
                tempPromedio,
                motorCount: motores.length
            }
        };
    }

    /**
     * Determina el color del semáforo para la temperatura del motor
     * Verde (<40°C), Amarillo (40-60°C), Rojo (>60°C)
     * @param {number} temp 
     * @returns {string} Código de color Hex/HSL
     */
    static getTemperatureColor(temp) {
        if (temp < 40) return '#10b981'; // Verde (Emerald)
        if (temp <= 60) return '#f59e0b'; // Amarillo (Amber)
        return '#ef4444'; // Rojo (Crimson)
    }

    /**
     * Determina el estado textual para la temperatura
     * @param {number} temp 
     * @returns {string} 'NORMAL' | 'PRECAUCIÓN' | 'PELIGRO'
     */
    static getTemperatureStatus(temp) {
        if (temp < 40) return 'NORMAL';
        if (temp <= 60) return 'WARM';
        return 'CRITICAL';
    }
}
