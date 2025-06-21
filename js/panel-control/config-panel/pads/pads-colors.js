const PadsColors = {

    // ===== ÉTAT =====
    currentMode: 'pads', // 'pads' ou 'groups'
    selectedPad: null,
    selectedGroup: null,

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="color-section">
                <button class="color-btn green" data-color="green" title="Vert">
                </button>
                <button class="color-btn yellow" data-color="yellow" title="Jaune">
                </button>
                <button class="color-btn red" data-color="red" title="Rouge">
                </button>
                <button class="color-btn clear" data-color="clear" title="Effacer">
                    CLEAR
                </button>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        this.setupEventListeners();
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Clics boutons couleurs
        document.addEventListener('click', (e) => {
            const colorBtn = e.target.closest('.color-btn');
            if (colorBtn) {
                const color = colorBtn.dataset.color;
                this.handleColorClick(color);
            }
        });

        // Écouter changement de mode
        window.addEventListener('config-mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
        });

        // Écouter sélection pad
        window.addEventListener('pad-selected', (event) => {
            const { padNumber } = event.detail;
            this.selectedPad = padNumber;
            this.selectedGroup = null; // Reset groupe
        });

        // Écouter sélection groupe (depuis groups-mode)
        window.addEventListener('group-selected', (event) => {
            const { groupId } = event.detail;
            this.selectedGroup = groupId;
            this.selectedPad = null; // Reset pad
        });

        // Écouter highlight groupe
        window.addEventListener('highlight-group', (event) => {
            // Quand un groupe est highlighted, on peut l'assigner
            this.selectedGroup = event.detail.groupId || this.getGroupFromPads(event.detail.groupPads);
            this.selectedPad = null;
        });
    },

    // ===== GESTION COULEURS =====
    handleColorClick(colorName) {
        const color = colorName === 'clear' ? null : colorName;

        if (this.currentMode === 'pads') {
            this.applyPadColor(color);
        } else if (this.currentMode === 'groups') {
            this.applyGroupColor(color);
        }
    },

    applyPadColor(color) {
        if (!this.selectedPad) {
            // Pas de pad sélectionné
            return;
        }

        // Envoyer event vers pads-content
        window.dispatchEvent(new CustomEvent('apply-pad-color', {
            detail: { 
                padNumber: this.selectedPad, 
                color 
            }
        }));
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) {
            // Pas de groupe sélectionné
            return;
        }

        // Obtenir les pads du groupe
        const groupPads = this.getGroupPads(this.selectedGroup);
        if (!groupPads) return;

        // Envoyer event vers groups-mode
        window.dispatchEvent(new CustomEvent('apply-group-color-request', {
            detail: { 
                groupId: this.selectedGroup,
                groupPads,
                color 
            }
        }));
    },

    // ===== UTILITAIRES =====
    getGroupPads(groupId) {
        const groups = {
            1: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28],
            2: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60],
            3: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64],
            4: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32]
        };
        return groups[groupId] || null;
    },

    getGroupFromPads(groupPads) {
        // Identifier le groupe selon les pads
        if (!groupPads || !groupPads.length) return null;
        
        if (groupPads.includes(1)) return 1;
        if (groupPads.includes(33)) return 2;
        if (groupPads.includes(37)) return 3;
        if (groupPads.includes(5)) return 4;
        
        return null;
    },

    // ===== ÉTAT =====
    reset() {
        this.selectedPad = null;
        this.selectedGroup = null;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsColors = PadsColors;
}