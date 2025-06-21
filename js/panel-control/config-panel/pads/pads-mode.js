const PadsMode = {

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
        this.setupEventListeners();
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Écouter sélection de pad depuis pads-content
        window.addEventListener('pad-selected', (event) => {
            const { padNumber, midiNote } = event.detail;
            this.updatePadInfo(padNumber, midiNote);
        });

        // Écouter déselection
        window.addEventListener('clear-selection', () => {
            this.clearPadInfo();
        });
    },

    // ===== MISE À JOUR INFO PAD =====
    updatePadInfo(padNumber, midiNote) {
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            infoContent.textContent = `NUMERO PAD ${padNumber} / NOTE PAD ${midiNote}`;
        }
    },

    clearPadInfo() {
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            infoContent.textContent = 'NUMERO PAD / NOTE PAD';
        }
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsMode = PadsMode;
}