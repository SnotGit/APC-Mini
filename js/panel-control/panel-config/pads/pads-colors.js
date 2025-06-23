const PadsColors = {

    // ===== ÉTAT =====
    currentMode: 'pads',
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
        document.addEventListener('click', (e) => {
            const colorBtn = e.target.closest('.color-btn');
            if (colorBtn) {
                const color = colorBtn.dataset.color;
                this.handleColorClick(color);
            }
        });

        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
            this.resetSelections();
        });

        window.addEventListener('pad-selected', (event) => {
            const { padNumber } = event.detail;
            if (this.isPadSelectable(padNumber)) {
                this.selectedPad = padNumber;
                this.selectedGroup = null;
                this.updateColorsState();
            } else {
                this.selectedPad = null;
                this.updateColorsState();
            }
        });

        window.addEventListener('group-selected', (event) => {
            const { groupId, sequencerEnabled } = event.detail;
            this.selectedGroup = groupId;
            this.selectedPad = null;
            this.colorsEnabled = !sequencerEnabled;
            this.updateColorsState();
        });

        window.addEventListener('sequencer-colors-disabled', () => {
            this.colorsEnabled = false;
            this.updateColorsState();
        });

        window.addEventListener('sequencer-colors-enabled', () => {
            this.colorsEnabled = true;
            this.updateColorsState();
        });

        window.addEventListener('clear-selection', () => {
            this.resetSelections();
        });

        window.addEventListener('group-assigned', () => {
            if (this.selectedPad && this.isPadOccupiedByGroup(this.selectedPad)) {
                this.selectedPad = null;
                this.updateColorsState();
            }
        });

        window.addEventListener('pad-assigned', () => {
            this.updateColorsState();
        });

        window.addEventListener('sequencer-controls-active', (event) => {
            const { active, controlButtons } = event.detail;
            if (active && this.selectedPad && this.isPadControlSequencer(this.selectedPad)) {
                this.selectedPad = null;
                this.updateColorsState();
            }
        });
    },

    // ===== GESTION COULEURS =====
    handleColorClick(colorName) {
        if (!this.colorsEnabled) {
            return;
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
            return;
        }

        if (!this.isPadSelectable(this.selectedPad)) {
            this.selectedPad = null;
            this.updateColorsState();
            return;
        }

        window.dispatchEvent(new CustomEvent('apply-pad-color', {
            detail: { 
                padNumber: this.selectedPad, 
                color 
            }
        }));

        this.selectedPad = null;
        this.updateColorsState();
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) {
            return;
        }

        window.dispatchEvent(new CustomEvent('group-color-request', {
            detail: { 
                groupId: this.selectedGroup,
                color 
            }
        }));
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

    isPadInAssignedGroupZone(padNumber) {
        if (window.PadsContent && window.PadsContent.isPadInAssignedGroupZone) {
            return window.PadsContent.isPadInAssignedGroupZone(padNumber);
        }
        return false;
    },

    isPadControlSequencer(padNumber) {
        if (window.PadsContent && window.PadsContent.isPadControlSequencer) {
            return window.PadsContent.isPadControlSequencer(padNumber);
        }
        return false;
    },

    // ===== ÉTATS VISUELS =====
    updateColorsState() {
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('disabled', 'ready', 'unavailable');
            btn.disabled = false;

            if (!this.colorsEnabled) {
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                const hasValidSelection = this.hasValidSelection();
                btn.classList.toggle('ready', hasValidSelection);
                
                if (this.selectedPad && !this.isPadSelectable(this.selectedPad)) {
                    btn.classList.add('unavailable');
                    btn.disabled = true;
                }
            }
        });

        const colorSection = document.querySelector('.color-section');
        if (colorSection) {
            colorSection.classList.toggle('colors-disabled', !this.colorsEnabled);
            colorSection.classList.toggle('has-selection', this.hasValidSelection());
            colorSection.classList.toggle('invalid-selection', 
                this.selectedPad && !this.isPadSelectable(this.selectedPad)
            );
        }
    },

    hasValidSelection() {
        if (this.currentMode === 'pads') {
            return this.selectedPad && this.isPadSelectable(this.selectedPad);
        } else if (this.currentMode === 'groups') {
            return this.selectedGroup !== null;
        }
        return false;
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
            colorsEnabled: this.colorsEnabled,
            hasValidSelection: this.hasValidSelection(),
            isPadSelectable: this.selectedPad ? this.isPadSelectable(this.selectedPad) : null
        };
    }
};

if (typeof window !== 'undefined') {
    window.PadsColors = PadsColors;
}