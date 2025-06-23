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

    // ===== VALIDATION DISPONIBILITÉ =====
    isPadSelectable(padNumber) {
        if (this.isPadOccupiedByGroup(padNumber)) {
            return false;
        }
        
        if (this.isPadInAssignedGroupZone(padNumber)) {
            return false;
        }
        
        if (this.isPadControlSequencer(padNumber)) {
            return false;
        }
        
        return true;
    },

    isPadOccupiedByGroup(padNumber) {
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

    getUnavailableReason(padNumber) {
        if (this.isPadOccupiedByGroup(padNumber)) {
            const groupId = this.findGroupForPad(padNumber);
            return groupId ? `OCCUPÉ PAR GROUPE ${groupId}` : 'OCCUPÉ PAR GROUPE';
        }
        
        if (this.isPadInAssignedGroupZone(padNumber)) {
            const groupId = this.findAssignedGroupForPad(padNumber);
            return groupId ? `ZONE GROUPE ${groupId} ASSIGNÉE` : 'ZONE GROUPE ASSIGNÉE';
        }
        
        if (this.isPadControlSequencer(padNumber)) {
            return 'CONTRÔLE SÉQUENCEUR';
        }
        
        return 'NON DISPONIBLE';
    },

    isPadInAssignedGroupZone(padNumber) {
        if (window.PadsContent && window.PadsContent.isPadInAssignedGroupZone) {
            return window.PadsContent.isPadInAssignedGroupZone(padNumber);
        }
        return false;
    },

    findAssignedGroupForPad(padNumber) {
        const groupMappings = {
            1: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36],
            2: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40],
            3: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4],
            4: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8]
        };
        
        for (const [groupId, pads] of Object.entries(groupMappings)) {
            if (pads.includes(padNumber)) {
                if (window.PadsContent && window.PadsContent.groupAssignments) {
                    if (window.PadsContent.groupAssignments[groupId]) {
                        return groupId;
                    }
                }
            }
        }
        
        return null;
    },

    findGroupForPad(padNumber) {
        const groupMappings = {
            1: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36],
            2: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40],
            3: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4],
            4: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8]
        };
        
        for (const [groupId, pads] of Object.entries(groupMappings)) {
            if (pads.includes(padNumber)) {
                if (window.PadsContent && window.PadsContent.hasGroupAssignments) {
                    if (window.PadsContent.hasGroupAssignments(groupId)) {
                        return groupId;
                    }
                }
            }
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
            isPadSelectable: this.selectedPad ? this.isPadSelectable(this.selectedPad) : null
        };
    }
};

if (typeof window !== 'undefined') {
    window.PadsMode = PadsMode;
}