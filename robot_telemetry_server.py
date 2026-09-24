# Servidor FastAPI de telemetría — modo demo basado en electroSim
# Provisto por la cátedra (TP05 - Desarrollo de Aplicaciones II - UADE)
import math
import time
import random
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Unitree Telemetry API", description="API & WebSocket para telemetría robótica Go2 / G1")

# Habilitar CORS para permitir solicitudes desde el cliente web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

inicio = time.time()

def simular_motor(i: int) -> dict:
    t = time.time() - inicio
    angulo = math.sin(t * 1.2 + i * 0.5) * 30
    velocidad = math.cos(t * 1.2 + i * 0.5) * 5
    torque = abs(math.sin(t * 0.8 + i)) * 20
    temp_base = 28 + i * 0.5
    temperatura = temp_base + min(t / 60, 1) * 25 + random.uniform(-0.5, 0.5)
    return {
        "id": i,
        "angulo": round(angulo, 2),
        "velocidad": round(velocidad, 3),
        "torque": round(torque, 2),
        "temperatura": round(temperatura, 1)
    }

def simular_imu() -> dict:
    t = time.time() - inicio
    return {
        "roll": round(math.sin(t * 0.3) * 5, 2),
        "pitch": round(math.sin(t * 0.5) * 8, 2),
        "yaw": round(math.sin(t * 0.1) * 15, 2),
        "ax": round(random.gauss(0, 0.05), 3),
        "ay": round(random.gauss(0, 0.05), 3),
        "az": round(9.81 + random.gauss(0, 0.02), 3)
    }

def simular_bms() -> dict:
    t = time.time() - inicio
    soc = max(20, 95 - t / 600)
    return {
        "soc": round(soc, 1),
        "corriente": round(1200 + random.uniform(-50, 50), 0),
        "temperatura": round(32 + random.uniform(-1, 1), 1),
        "celdas": [round(3.7 + random.uniform(-0.05, 0.05), 3) for _ in range(10)]
    }

@app.get("/telemetria")
def telemetria(modelo: str = "go2"):
    n_motores = 12 if modelo.lower() == "go2" else 29
    return {
        "modelo": modelo,
        "ts": round(time.time() - inicio, 2),
        "motores": [simular_motor(i) for i in range(n_motores)],
        "imu": simular_imu(),
        "bms": simular_bms(),
        "fuerzas": {
            "FR": random.choice([0, 1]),
            "FL": random.choice([0, 1]),
            "RR": random.choice([0, 1]),
            "RL": random.choice([0, 1])
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    # Leer posible parámetro de modelo inicial o default go2
    modelo = "go2"
    try:
        while True:
            await ws.send_json(telemetria(modelo))
            await asyncio.sleep(0.1) # 10 Hz, igual que electroSim
    except WebSocketDisconnect:
        print("Cliente WebSocket desconectado")
