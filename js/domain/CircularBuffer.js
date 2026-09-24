/**
 * Structura de Datos: CircularBuffer (Búfer Circular de Tamaño Fijo)
 * Mantiene un número máximo de elementos (ej. 300 muestras) de forma eficiente.
 */
export class CircularBuffer {
    /**
     * @param {number} capacity Capacidad máxima del búfer (por defecto 300)
     */
    constructor(capacity = 300) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.head = 0;
        this.tail = 0;
        this.size = 0;
    }

    /**
     * Agrega un nuevo elemento al búfer. Si supera la capacidad, sobrescribe el más antiguo.
     * @param {any} item 
     */
    push(item) {
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;

        if (this.size < this.capacity) {
            this.size++;
        } else {
            this.head = (this.head + 1) % this.capacity;
        }
    }

    /**
     * Retorna todos los elementos del búfer en orden cronológico (de más antiguo a más reciente).
     * @returns {Array}
     */
    toArray() {
        const result = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = this.buffer[(this.head + i) % this.capacity];
        }
        return result;
    }

    /**
     * Retorna el último elemento insertado (más reciente).
     */
    get last() {
        if (this.size === 0) return null;
        const index = (this.tail - 1 + this.capacity) % this.capacity;
        return this.buffer[index];
    }

    /**
     * Limpia el contenido del búfer.
     */
    clear() {
        this.head = 0;
        this.tail = 0;
        this.size = 0;
    }
}
