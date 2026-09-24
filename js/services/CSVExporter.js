/**
 * Servicio CSVExporter
 * Administra la captura de snapshots de telemetría en memoria y la generación/descarga de archivos CSV
 * mediante la API native Blob del navegador.
 */
export class CSVExporter {
    constructor() {
        this.samples = [];
    }

    /**
     * Captura el estado actual de la telemetría y lo guarda en memoria.
     * @param {Object} telemetry DTO adaptado de telemetría
     * @returns {number} Cantidad actual de muestras capturadas
     */
    captureSample(telemetry) {
        if (!telemetry) return this.samples.length;

        const snapshot = {
            timestamp_sec: telemetry.ts,
            fecha_hora: new Date(telemetry.timestampMs).toISOString(),
            modelo: telemetry.modelo,
            imu_roll_deg: telemetry.imu.roll,
            imu_pitch_deg: telemetry.imu.pitch,
            imu_yaw_deg: telemetry.imu.yaw,
            imu_ax: telemetry.imu.ax,
            imu_ay: telemetry.imu.ay,
            imu_az: telemetry.imu.az,
            bms_soc_pct: telemetry.bms.soc,
            bms_corriente_ma: telemetry.bms.corriente,
            bms_temp_c: telemetry.bms.temperatura,
            fuerza_FR: telemetry.fuerzas.FR ? 1 : 0,
            fuerza_FL: telemetry.fuerzas.FL ? 1 : 0,
            fuerza_RR: telemetry.fuerzas.RR ? 1 : 0,
            fuerza_RL: telemetry.fuerzas.RL ? 1 : 0,
            motor_cant: telemetry.motores.length,
            temp_prom_motores: telemetry.stats.tempPromedio
        };

        this.samples.push(snapshot);
        return this.samples.length;
    }

    /**
     * Retorna la cantidad de muestras capturadas actualmente.
     */
    get sampleCount() {
        return this.samples.length;
    }

    /**
     * Limpia la memoria de muestras capturadas.
     */
    clearSamples() {
        this.samples = [];
    }

    /**
     * Genera y descarga un archivo CSV con las muestras en memoria usando Blob API.
     */
    exportCSV() {
        if (this.samples.length === 0) {
            alert('No hay muestras capturadas para exportar. Haz clic primero en "Capturar Muestra".');
            return false;
        }

        // Extraer encabezados (columnas) del primer objeto
        const headers = Object.keys(this.samples[0]);
        
        // Construir líneas del CSV
        const csvRows = [];
        csvRows.push(headers.join(',')); // Encabezado

        for (const sample of this.samples) {
            const row = headers.map(header => {
                const val = sample[header];
                // Escapar comas o comillas si existieran
                const stringified = String(val).replace(/"/g, '""');
                return `"${stringified}"`;
            });
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        
        // Crear Blob de tipo text/csv
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Elemento <a> temporal para disparar la descarga
        const link = document.createElement('a');
        link.href = url;
        const timestampFilename = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `telemetria_robot_${timestampFilename}.csv`);
        document.body.appendChild(link);
        link.click();

        // Limpieza del DOM y liberación del ObjectURL
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        return true;
    }
}
