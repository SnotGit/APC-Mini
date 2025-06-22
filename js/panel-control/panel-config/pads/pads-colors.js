const PadsColors = {

    // ===== ÉTAT =====
    currentMode: 'pads', // 'pads' ou 'groups'
    selectedPad: null,
    selectedGroup: null,
    colorsEnabled: true,
    isInitialized: false,

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
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.updateColorsState();
        
        this.isInitialized = true;
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

        // Écouter changement de mode (pads/groups)
        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
            this.resetSelections();
        });

        // Écouter sélection pad depuis pads-mode
        window.addEventListener('pad-selected', (event) => {
            const { padNumber } = event.detail;
            this.selectedPad = padNumber;
            this.selectedGroup = null; // Reset groupe
            this.updateColorsState();
        });

        // Écouter sélection groupe depuis groups-mode
        window.addEventListener('group-selected', (event) => {
            const { groupId, sequencerEnabled } = event.detail;
            this.selectedGroup = groupId;
            this.selectedPad = null; // Reset pad
            this.colorsEnabled = !sequencerEnabled; // Couleurs interdites si séquenceur actif
            this.updateColorsState();
        });

        // Écouter autorisation couleurs depuis groups-mode
        window.addEventListener('sequencer-colors-disabled', () => {
            this.colorsEnabled = false;
            this.updateColorsState();
        });

        window.addEventListener('sequencer-colors-enabled', () => {
            this.colorsEnabled = true;
            this.updateColorsState();
        });

        // Écouter déselection
        window.addEventListener('clear-selection', () => {
            this.resetSelections();
        });
    },

    // ===== GESTION COULEURS =====
    handleColorClick(colorName) {
        // Vérifier si couleurs autorisées
        if (!this.colorsEnabled) {
            return; // Couleurs interdites en mode séquenceur
        }

        const color = colorName === 'clear' ? null : colorName;

        if (this.currentMode === 'pads') {
            this.applyPadColor(color);
        } else if (this.currentMode === 'groups') {
            this.applyGroupColor(color);
        }
    },

    applyPadColor(color) {
        if (!this.selectedPad) {
            return; // Pas de pad sélectionné
        }

        // Envoyer vers pads-content
        window.dispatchEvent(new CustomEvent('apply-pad-color', {
            detail: { 
                padNumber: this.selectedPad, 
                color 
            }
        }));

        // Reset sélection après assignation
        this.selectedPad = null;
        this.updateColorsState();
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) {
            return; // Pas de groupe sélectionné
        }

        // Demander à groups-mode d'appliquer la couleur (vérification autorisations)
        window.dispatchEvent(new CustomEvent('group-color-request', {
            detail: { 
                groupId: this.selectedGroup,
                color 
            }
        }));

        // Garder sélection groupe pour assignations multiples
    },

    // ===== ÉTATS VISUELS =====
    updateColorsState() {
        // Mettre à jour apparence boutons couleurs
        document.querySelectorAll('.color-btn').forEach(btn => {
            // Désactiver si couleurs interdites
            btn.classList.toggle('disabled', !this.colorsEnabled);
            btn.disabled = !this.colorsEnabled;

            // Indication visuelle selon sélection
            const hasSelection = this.selectedPad || this.selectedGroup;
            btn.classList.toggle('ready', this.colorsEnabled && hasSelection);
        });

        // Mettre à jour curseur selon état
        const colorSection = document.querySelector('.color-section');
        if (colorSection) {
            colorSection.classList.toggle('colors-disabled', !this.colorsEnabled);
            colorSection.classList.toggle('has-selection', this.selectedPad || this.selectedGroup);
        }
    },

    resetSelections() {
        this.selectedPad = null;
        this.selectedGroup = null;
        this.updateColorsState();
    },

    // ===== API PUBLIQUE =====
    getSelectedPad() {
        return this.selectedPad;
    },

    getSelectedGroup() {
        return this.selectedGroup;
    },

    areColorsEnabled() {
        return this.colorsEnabled;
    },

    getCurrentMode() {
        return this.currentMode;
    },

    // ===== UTILITAIRES =====
    setColorsEnabled(enabled) {
        this.colorsEnabled = enabled;
        this.updateColorsState();
    },

    // ===== DEBUGGING =====
    getState() {
        return {
            currentMode: this.currentMode,
            selectedPad: this.selectedPad,
            selectedGroup: this.selectedGroup,
            colorsEnabled: this.colorsEnabled
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsColors = PadsColors;
}