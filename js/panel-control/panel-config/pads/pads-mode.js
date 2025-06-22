const PadsMode = {

    // ===== ÉTAT =====
    selectedPad: null,
    isInitialized: false,

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="info-section">
                <div class="info-title">
                    INFORMATIONS PAD SELECTED
                </div>
                <div class="info-content" id="padInfoContent">
                    NUMERO PAD / NOTE PAD
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Écouter sélection de pad depuis pads-content
        window.addEventListener('pad-clicked', (event) => {
            const { padNumber, midiNote } = event.detail;
            this.selectPad(padNumber, midiNote);
        });

        // Écouter déselection
        window.addEventListener('clear-selection', () => {
            this.clearPadInfo();
        });

        // Écouter changement de mode
        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            if (mode !== 'pads') {
                this.clearPadInfo(); // Clear si on sort du mode pads
            }
        });

        // Écouter assignation couleur pour clear sélection
        window.addEventListener('apply-pad-color', () => {
            // Après assignation, clear la sélection
            setTimeout(() => {
                this.clearPadInfo();
            }, 100);
        });
    },

    // ===== SÉLECTION PAD =====
    selectPad(padNumber, midiNote) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber, midiNote);
        
        // Notifier pads-colors de la sélection
        window.dispatchEvent(new CustomEvent('pad-selected', {
            detail: { padNumber, midiNote }
        }));
    },

    clearPadInfo() {
        this.selectedPad = null;
        
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            infoContent.textContent = 'NUMERO PAD / NOTE PAD';
        }
        
        // Notifier clear sélection
        window.dispatchEvent(new CustomEvent('clear-selection'));
    },

    // ===== MISE À JOUR INFO PAD =====
    updatePadInfo(padNumber, midiNote) {
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            infoContent.textContent = `NUMERO PAD ${padNumber} / NOTE PAD ${midiNote}`;
        }
    },

    // ===== API PUBLIQUE =====
    getSelectedPad() {
        return this.selectedPad;
    },

    // ===== UTILITAIRES =====
    hasSelection() {
        return this.selectedPad !== null;
    },

    // ===== DEBUGGING =====
    getState() {
        return {
            selectedPad: this.selectedPad,
            hasSelection: this.hasSelection()
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsMode = PadsMode;
}