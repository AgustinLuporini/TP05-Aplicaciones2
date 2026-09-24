/**
 * Componente UI: ForcesPanelComponent
 * Indicadores visuales de contacto con el suelo para las 4 extremidades del cuadrúpedo (FR, FL, RR, RL).
 */
export class ForcesPanelComponent {
    /**
     * @param {string} containerId ID del contenedor HTML
     */
    constructor(containerId = 'forces-panel-container') {
        this.container = document.getElementById(containerId);
        this.renderSkeleton();
    }

    renderSkeleton() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="panel-card glass-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fa-solid fa-shoe-prints"></i>
                        <span>Panel de Fuerzas & Contacto (4 Patas)</span>
                    </div>
                    <div class="panel-badges">
                        <span class="badge badge-info" id="contactCountBadge">0/4 En Piso</span>
                    </div>
                </div>

                <!-- Esquema Visual del Chasis Cuadrúpedo -->
                <div class="chassis-diagram-container">
                    <div class="chassis-box">
                        <div class="chassis-label">FRENTE (HEAD)</div>
                        
                        <div class="legs-row top-row">
                            <!-- FL (Front Left) -->
                            <div class="paw-card" id="pataFL">
                                <div class="paw-title">FL (Delantera Izq.)</div>
                                <div class="paw-status" id="pataFL-status">—</div>
                            </div>

                            <!-- FR (Front Right) -->
                            <div class="paw-card" id="pataFR">
                                <div class="paw-title">FR (Delantera Der.)</div>
                                <div class="paw-status" id="pataFR-status">—</div>
                            </div>
                        </div>

                        <div class="chassis-core">
                            <i class="fa-solid fa-robot chassis-icon"></i>
                            <span>CHASIS UNITREE</span>
                        </div>

                        <div class="legs-row bottom-row">
                            <!-- RL (Rear Left) -->
                            <div class="paw-card" id="pataRL">
                                <div class="paw-title">RL (Trasera Izq.)</div>
                                <div class="paw-status" id="pataRL-status">—</div>
                            </div>

                            <!-- RR (Rear Right) -->
                            <div class="paw-card" id="pataRR">
                                <div class="paw-title">RR (Trasera Der.)</div>
                                <div class="paw-status" id="pataRR-status">—</div>
                            </div>
                        </div>

                        <div class="chassis-label bottom-label">TRASERA (TAIL)</div>
                    </div>
                </div>
            </div>
        `;

        this.pats = {
            FR: { card: document.getElementById('pataFR'), status: document.getElementById('pataFR-status') },
            FL: { card: document.getElementById('pataFL'), status: document.getElementById('pataFL-status') },
            RR: { card: document.getElementById('pataRR'), status: document.getElementById('pataRR-status') },
            RL: { card: document.getElementById('pataRL'), status: document.getElementById('pataRL-status') }
        };
        this.contactBadge = document.getElementById('contactCountBadge');
    }

    /**
     * Actualiza el estado visual de cada pata
     * @param {Object} fuerzas Objeto { FR: boolean/0|1, FL: ..., RR: ..., RL: ... }
     */
    update(fuerzas) {
        if (!fuerzas) return;

        let activeCount = 0;
        const patas = ['FR', 'FL', 'RR', 'RL'];

        patas.forEach(pataKey => {
            const isContact = Boolean(fuerzas[pataKey]);
            if (isContact) activeCount++;

            const elem = this.pats[pataKey];
            if (elem && elem.card && elem.status) {
                if (isContact) {
                    elem.card.classList.add('active-contact');
                    elem.card.classList.remove('no-contact');
                    elem.status.innerHTML = `<i class="fa-solid fa-circle-check"></i> CONTACTO (${pataKey})`;
                } else {
                    elem.card.classList.add('no-contact');
                    elem.card.classList.remove('active-contact');
                    elem.status.innerHTML = `<i class="fa-solid fa-circle-minus"></i> EN AIRE`;
                }
            }
        });

        if (this.contactBadge) {
            this.contactBadge.textContent = `${activeCount}/4 En Piso`;
            if (activeCount === 4) {
                this.contactBadge.className = 'badge badge-success';
            } else if (activeCount > 0) {
                this.contactBadge.className = 'badge badge-warning';
            } else {
                this.contactBadge.className = 'badge badge-danger';
            }
        }
    }
}
