# 🤖 Unitree Robotic Telemetry Dashboard — TP05

**Trabajo Práctico N° 5 — Desarrollo de Aplicaciones II (UADE)**  
Dashboard web en tiempo real para el monitoreo de telemetría de robots cuadrúpedos y humanoides (Unitree Go2 y G1).

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/AgustinLuporini/TP05-Aplicaciones2)
[![Stack](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS%20(ES6%2B)%20%7C%20Chart.js-cyan)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20(Python)-green?logo=fastapi)](#)

---

## 📌 Descripción del Proyecto

El objetivo es construir un cliente web modular de alto rendimiento que consuma telemetría simulada en tiempo real provista por un servidor **FastAPI**. El sistema permite monitorear articulaciones de motores, unidad inercial (IMU), gestión de baterías (BMS) y fuerzas de contacto en las extremidades.

---

## 🏛️ Arquitectura & Patrones de Diseño

El proyecto sigue los principios de **Clean Architecture** (Arquitectura Limpia) y **Desarrollo Orientado a Componentes**:

```
                                  ┌─────────────────────────────┐
                                  │   FastAPI Backend Server    │
                                  └──────────────┬──────────────┘
                                                 │ REST (2 Hz) / WebSocket (10 Hz)
                                                 ▼
┌──────────────────┐             ┌─────────────────────────────┐
│ Componentes UI   │◄────────────┤      ObservableStore        │
│ (Motor, IMU,     │  Observer   │ (Event Bus & Reactive State)│
│  BMS, Fuerzas)   │ Subscription└──────────────┬──────────────┘
└──────────────────┘                            ▲
                                                │ TelemetryDTO Normalizado
                                 ┌──────────────┴──────────────┐
                                 │      TelemetryAdapter       │ (Patrón ADAPTER)
                                 └──────────────┬──────────────┘
                                                ▲ Raw JSON
                                 ┌──────────────┴──────────────┐
                                 │       TelemetryFacade       │ (Patrón FACADE)
                                 └─────────────────────────────┘
```

1. **Patrón Facade (`TelemetryFacade.js`)**: Abstrae y unifica el mecanismo de transporte de datos. Permite conmutar transparentemente entre **Polling REST (cada 500ms)** y **WebSocket Push (a 10 Hz)** sin modificar los componentes de la interfaz.
2. **Patrón Adapter (`TelemetryAdapter.js`)**: Normaliza las estructuras heterogéneas JSON enviadas por el backend para los distintos modelos (**Go2 de 12 DoF** vs **G1 de 29 DoF**), asignando nombres anatómicos a los motores e implementando la lógica de **semáforo de temperatura**.
3. **Patrón Observer (`ObservableStore.js`)**: Desacopla la fuente de datos de los elementos de presentación. Cuando la Facade recibe nuevo paquete de telemetría, el `ObservableStore` notifica a los observadores registrados.
4. **Estructura de Datos CircularBuffer (`CircularBuffer.js`)**: Administra un búfer FIFO optimizado de **300 muestras** (30 segundos a 10 Hz) para renderizar el gráfico dinámico de Chart.js sin re-asignación de arrays.

---

## 📊 Paneles del Dashboard

- **Panel de Motores**: Tabla interactiva con ángulo, velocidad angular, torque y temperatura. Incluye **semáforo de temperatura**:
  - 🟢 **Verde** (`< 40°C`): Estado Normal.
  - 🟡 **Amarillo** (`40°C - 60°C`): Estado Warm / Precaución.
  - 🔴 **Rojo** (`> 60°C`): Estado Crítico / Peligro.
- **Panel IMU**: Indicadores numéricos de Roll, Pitch, Yaw y Aceleraciones (AX, AY, AZ) con gráfico de líneas en tiempo real (**Chart.js**) sustentado por el búfer circular.
- **Panel BMS**: Nivel SOC (%), barra gráfica de carga, corriente (mA), temperatura y estado individual de **10 celdas de batería**.
- **Panel de Fuerzas**: Esquema 2D interactivo del chasis cuadrúpedo indicando el estado de contacto al suelo para las 4 patas (**FR, FL, RR, RL**).
- **Exportación CSV**: Botones para capturar snapshots en memoria y descargar un archivo `.csv` utilizando la API nativa `Blob`.

---

## ⚡ Análisis de Trade-Off: REST Polling vs WebSockets

| Métrica / Aspecto | REST Polling (`setInterval` @ 500ms) | WebSocket Nativo (`/ws` @ 10 Hz) |
| :--- | :--- | :--- |
| **Paradigma** | **Pull** (Peticiones HTTP GET periódicas) | **Push** (Streaming bidireccional continuo) |
| **Frecuencia / Latencia** | 2 Hz (500ms). Suma TCP handshake + HTTP headers | 10 Hz (100ms). Latencia mínima ultra-baja (~10ms) |
| **Sobrecarga de Red** | Alto (~500 bytes por request en cabeceras HTTP) | Extremadamente bajo (2-6 bytes de framing WS) |
| **Complejidad** | Stateless y simple de implementar | Requiere manejo de reconexiones activas y sockets |

---

## 🚀 Instrucciones de Ejecución

### 1. Iniciar el Servidor Backend (FastAPI)
```bash
# Instalar dependencias si no se poseen: pip install fastapi uvicorn
uvicorn robot_telemetry_server:app --reload --port 8000
```

### 2. Iniciar el Cliente Web (Frontend)
Puedes abrir el archivo `index.html` directamente en tu navegador o levantarlo mediante cualquier servidor estático:
```bash
npx serve -l 3000
```
Navega a `http://localhost:3000`.

---

## 📁 Estructura del Código

```text
.
├── robot_telemetry_server.py       # Servidor FastAPI provisto por la cátedra
├── index.html                      # Layout principal semántico
├── css/
│   └── styles.css                  # Estilos Cyber Dark Mode & Glassmorphic UI
└── js/
    ├── domain/
    │   ├── CircularBuffer.js       # Búfer circular de 300 muestras
    │   └── TelemetryAdapter.js     # Normalización DTO y Semáforo de Temperatura
    ├── services/
    │   ├── ObservableStore.js      # Central de Estado y Patrón Observer
    │   ├── TelemetryFacade.js      # Patrón Facade (REST Polling & WebSockets)
    │   └── CSVExporter.js          # Exportador CSV con Blob API
    ├── components/
    │   ├── MotorPanelComponent.js  # Componente Tabla de Motores
    │   ├── IMUPanelComponent.js    # Componente IMU & Chart.js
    │   ├── BMSPanelComponent.js    # Componente BMS & Baterías
    │   └── ForcesPanelComponent.js # Componente Fuerzas & Contacto 4 Patas
    └── app.js                      # Bootstrap y controlador principal
```
