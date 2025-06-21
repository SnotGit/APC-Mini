const SelectMode = {

    // ===== ÉTAT =====
    currentMode: 'pads', // 'pads' ou 'groups'
    isInitialized: false,

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="select-mode">
                <button class="mode-btn active" data-mode="pads">
                    Pads
                </button>
                <button class="mode-btn" data-mode="groups">
                    Groupes
                </button>
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
        document.addEventListener('click', (e) => {
            const modeBtn = e.target.closest('.mode-btn');
            if (modeBtn) {
                const mode = modeBtn.dataset.mode;
                this.switchMode(mode);
            }
        });
    },

    // ===== CHANGEMENT MODE =====
    switchMode(mode) {
        if (this.currentMode === mode) return;

        this.currentMode = mode;
        
        // Mettre à jour interface boutons
        this.updateButtonStates();
        
        // Notifier changement de mode
        this.dispatchModeChange(mode);
    },

    updateButtonStates() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const isActive = btn.dataset.mode === this.currentMode;
            btn.classList.toggle('active', isActive);
        });
    },

    dispatchModeChange(mode) {
        // Notifier pads-content du changement de mode
        window.dispatchEvent(new CustomEvent('mode-changed', {
            detail: { mode }
        }));

        // Notifier pads-config pour changer le contenu
        window.dispatchEvent(new CustomEvent('config-mode-changed', {
            detail: { mode }
        }));
    },

    // ===== GETTERS =====
    getCurrentMode() {
        return this.currentMode;
    },

    // ===== UTILITAIRES =====
    setMode(mode) {
        if (mode === 'pads' || mode === 'groups') {
            this.switchMode(mode);
        }
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.SelectMode = SelectMode;
}