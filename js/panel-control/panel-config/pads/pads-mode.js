const PadsMode = {

    // ===== ÉTAT =====
    selectedPad: null,
    isInitialized: false,

    // ===== CRÉATION TEMPLATE (INCHANGÉ) =====
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
        window.addEventListener('pad-clicked', (event) => {
            const { padNumber, midiNote } = event.detail;
            this.handlePadSelection(padNumber, midiNote);
        });

        window.addEventListener('clear-selection', () => {
            this.clearPadInfo();
        });

        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            if (mode !== 'pads') {
                this.clearPadInfo();
            }
        });

        window.addEventListener('apply-pad-color', () => {
            setTimeout(() => {
                this.clearPadInfo();
            }, 100);
        });

        window.addEventListener('group-assigned', () => {
            if (this.selectedPad && this.isPadOccupiedByGroup(this.selectedPad)) {
                this.clearPadInfo();
            }
        });

        window.addEventListener('sequencer-controls-active', (event) => {
            const { active, controlButtons } = event.detail;
            if (active && this.selectedPad && this.isPadControlSequencer(this.selectedPad)) {
                this.clearPadInfo();
            }
        });
    },

    // ===== GESTION SÉLECTION =====
    handlePadSelection(padNumber, midiNote) {
        if (!this.isPadSelectable(padNumber)) {
            this.showPadUnavailableInfo(padNumber);
            return;
        }

        this.selectPad(padNumber, midiNote);
    },

    selectPad(padNumber, midiNote) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber, midiNote);
        
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
        
        window.dispatchEvent(new CustomEvent('clear-selection'));
    },

    // ===== VALIDATION SIMPLIFIÉE 7 GROUPES =====
    isPadSelectable(padNumber) {
        // Validation simple : pad occupé par groupe OU contrôle séquenceur
        if (this.isPadOccupiedByGroup(padNumber)) {
            return false;
        }
        
        if (this.isPadControlSequencer(padNumber)) {
            return false;
        }
        
        return true;
    },

    isPadOccupiedByGroup(padNumber) {
        // Utiliser API simplifiée PadsContent pour 7 groupes
        if (window.PadsContent && window.PadsContent.isPadInGroupAssignment) {
            return window.PadsContent.isPadInGroupAssignment(padNumber);
        }
        return false;
    },

    isPadControlSequencer(padNumber) {
        if (window.PadsContent && window.PadsContent.isPadControlSequencer) {
            return window.PadsContent.isPadControlSequencer(padNumber);
        }
        return false;
    },

    // ===== MISE À JOUR INFO PAD =====
    updatePadInfo(padNumber, midiNote) {
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            const padStatus = this.getPadStatus(padNumber);
            infoContent.textContent = `NUMERO PAD ${padNumber} / NOTE PAD ${midiNote}`;
            
            if (padStatus) {
                infoContent.textContent += ` (${padStatus})`;
            }
        }
    },

    showPadUnavailableInfo(padNumber) {
        const infoContent = document.getElementById('padInfoContent');
        if (infoContent) {
            const reason = this.getUnavailableReason(padNumber);
            infoContent.textContent = `PAD ${padNumber} - ${reason}`;
            
            setTimeout(() => {
                if (!this.selectedPad) {
                    infoContent.textContent = 'NUMERO PAD / NOTE PAD';
                }
            }, 2000);
        }
    },

    getPadStatus(padNumber) {
        if (window.PadsContent) {
            const color = window.PadsContent.getPadColor(padNumber);
            if (color) {
                return `COULEUR: ${color.toUpperCase()}`;
            }
        }
        return null;
    },

    // ===== RAISONS INDISPONIBILITÉ SIMPLIFIÉES =====
    getUnavailableReason(padNumber) {
        if (this.isPadOccupiedByGroup(padNumber)) {
            const groupId = this.findGroupForPad(padNumber);
            return groupId ? `OCCUPÉ PAR GROUPE ${groupId}` : 'OCCUPÉ PAR GROUPE';
        }
        
        if (this.isPadControlSequencer(padNumber)) {
            return 'CONTRÔLE SÉQUENCEUR';
        }
        
        return 'NON DISPONIBLE';
    },

    // ===== UTILITAIRES 7 GROUPES =====
    findGroupForPad(padNumber) {
        // Chercher dans tous les 7 groupes
        if (!window.PadsContent) return null;
        
        return window.PadsContent.findGroupForPad(padNumber);
    },

    findAssignedGroupForPad(padNumber) {
        // Simplification : même logique que findGroupForPad
        const groupId = this.findGroupForPad(padNumber);
        
        if (groupId && window.PadsContent && window.PadsContent.isGroupAssigned) {
            return window.PadsContent.isGroupAssigned(groupId) ? groupId : null;
        }
        
        return null;
    },

    // ===== API PUBLIQUE =====
    getSelectedPad() {
        return this.selectedPad;
    },

    hasSelection() {
        return this.selectedPad !== null;
    },

    // ===== DEBUGGING =====
    getState() {
        return {
            selectedPad: this.selectedPad,
            hasSelection: this.hasSelection(),
            isPadSelectable: this.selectedPad ? this.isPadSelectable(this.selectedPad) : null,
            groupForPad: this.selectedPad ? this.findGroupForPad(this.selectedPad) : null
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsMode = PadsMode;
}