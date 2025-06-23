const PadsMode = {

    // ===== ÉTAT =====
    selectedPad: null,
    isInitialized: false,

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="info-section">
                <div class="info-title">INFORMATIONS PAD SELECTED</div>
                <div class="info-content" id="padInfoContent">NUMERO PAD / NOTE PAD</div>
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
        window.addEventListener('pad-clicked', (e) => this.handlePadSelection(e.detail.padNumber, e.detail.midiNote));
        window.addEventListener('clear-selection', () => this.clearPadInfo());
        window.addEventListener('mode-changed', (e) => e.detail.mode !== 'pads' && this.clearPadInfo());
        window.addEventListener('apply-pad-color', () => setTimeout(() => this.clearPadInfo(), 100));
        window.addEventListener('group-assigned', () => this.selectedPad && this.isPadOccupiedByGroup(this.selectedPad) && this.clearPadInfo());
        window.addEventListener('sequencer-controls-active', (e) => e.detail.active && this.selectedPad && this.isPadControlSequencer(this.selectedPad) && this.clearPadInfo());
    },

    // ===== GESTION SÉLECTION =====
    handlePadSelection(padNumber, midiNote) {
        this.isPadSelectable(padNumber) ? this.selectPad(padNumber, midiNote) : this.showPadUnavailableInfo(padNumber);
    },

    selectPad(padNumber, midiNote) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber, midiNote);
        window.dispatchEvent(new CustomEvent('pad-selected', { detail: { padNumber, midiNote } }));
    },

    clearPadInfo() {
        this.selectedPad = null;
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) infoContent.textContent = 'NUMERO PAD / NOTE PAD';
        window.dispatchEvent(new CustomEvent('clear-selection'));
    },

    // ===== VALIDATION =====
    isPadSelectable(padNumber) {
        return !this.isPadOccupiedByGroup(padNumber) && !this.isPadControlSequencer(padNumber);
    },

    isPadOccupiedByGroup(padNumber) {
        return window.PadsContent?.isPadInGroupAssignment?.(padNumber) || false;
    },

    isPadControlSequencer(padNumber) {
        return window.PadsContent?.isPadControlSequencer?.(padNumber) || false;
    },

    // ===== MISE À JOUR INFO PAD =====
    updatePadInfo(padNumber, midiNote) {
        const infoContent = document.getElementById('padInfoContent');
        if (!infoContent) return;
        
        const padStatus = this.getPadStatus(padNumber);
        infoContent.textContent = `NUMERO PAD ${padNumber} / NOTE PAD ${midiNote}${padStatus ? ` (${padStatus})` : ''}`;
    },

    showPadUnavailableInfo(padNumber) {
        const infoContent = document.getElementById('padInfoContent');
        if (!infoContent) return;
        
        infoContent.textContent = `PAD ${padNumber} - ${this.getUnavailableReason(padNumber)}`;
        setTimeout(() => {
            if (!this.selectedPad) infoContent.textContent = 'NUMERO PAD / NOTE PAD';
        }, 2000);
    },

    getPadStatus(padNumber) {
        const color = window.PadsContent?.getPadColor?.(padNumber);
        return color ? `COULEUR: ${color.toUpperCase()}` : null;
    },

    getUnavailableReason(padNumber) {
        if (this.isPadOccupiedByGroup(padNumber)) {
            const groupId = this.findGroupForPad(padNumber);
            return groupId ? `OCCUPÉ PAR GROUPE ${groupId}` : 'OCCUPÉ PAR GROUPE';
        }
        return this.isPadControlSequencer(padNumber) ? 'CONTRÔLE SÉQUENCEUR' : 'NON DISPONIBLE';
    },

    // ===== UTILITAIRES =====
    findGroupForPad(padNumber) {
        return window.PadsContent?.findGroupForPad?.(padNumber) || null;
    },

    // ===== API PUBLIQUE =====
    getSelectedPad() { return this.selectedPad; },
    hasSelection() { return this.selectedPad !== null; }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsMode = PadsMode;
}