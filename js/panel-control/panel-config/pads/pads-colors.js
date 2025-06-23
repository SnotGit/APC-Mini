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
                <button class="color-btn green" data-color="green" title="Vert"></button>
                <button class="color-btn yellow" data-color="yellow" title="Jaune"></button>
                <button class="color-btn red" data-color="red" title="Rouge"></button>
                <button class="color-btn clear" data-color="clear" title="Effacer">CLEAR</button>
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

        window.addEventListener('mode-changed', (e) => { this.currentMode = e.detail.mode; this.resetSelections(); });
        window.addEventListener('pad-selected', (e) => this.handlePadSelected(e.detail.padNumber));
        window.addEventListener('group-selected', (e) => this.handleGroupSelected(e.detail.groupId, e.detail.sequencerEnabled));
        window.addEventListener('sequencer-colors-disabled', () => { this.colorsEnabled = false; this.updateColorsState(); });
        window.addEventListener('sequencer-colors-enabled', () => { this.colorsEnabled = true; this.updateColorsState(); });
        window.addEventListener('clear-selection', () => this.resetSelections());
        window.addEventListener('group-assigned', () => this.handleAssignmentChange());
        window.addEventListener('pad-assigned', () => this.handleAssignmentChange());
        window.addEventListener('sequencer-controls-active', (e) => this.handleSequencerControls(e.detail.active, e.detail.controlButtons));
    },

    // ===== GESTION COULEURS =====
    handleColorClick(colorName) {
        if (!this.colorsEnabled) return;

        const color = colorName === 'clear' ? null : colorName;

        if (this.currentMode === 'pads') {
            this.applyPadColor(color);
        } else if (this.currentMode === 'groups') {
            this.applyGroupColor(color);
        }
    },

    applyPadColor(color) {
        if (!this.selectedPad || !this.isPadSelectable(this.selectedPad)) {
            this.selectedPad = null;
            this.updateColorsState();
            return;
        }

        window.dispatchEvent(new CustomEvent('apply-pad-color', {
            detail: { padNumber: this.selectedPad, color }
        }));

        this.selectedPad = null;
        this.updateColorsState();
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) return;

        window.dispatchEvent(new CustomEvent('group-color-request', {
            detail: { groupId: this.selectedGroup, color }
        }));
    },

    // ===== GESTION SÉLECTIONS =====
    handlePadSelected(padNumber) {
        if (this.isPadSelectable(padNumber)) {
            this.selectedPad = padNumber;
            this.selectedGroup = null;
            this.updateColorsState();
        } else {
            this.selectedPad = null;
            this.updateColorsState();
        }
    },

    handleGroupSelected(groupId, sequencerEnabled) {
        this.selectedGroup = groupId;
        this.selectedPad = null;
        this.colorsEnabled = !sequencerEnabled;
        this.updateColorsState();
    },

    handleAssignmentChange() {
        if (this.selectedPad && this.isPadOccupiedByGroup(this.selectedPad)) {
            this.selectedPad = null;
            this.updateColorsState();
        }
    },

    handleSequencerControls(active, controlButtons) {
        if (active && this.selectedPad && this.isPadControlSequencer(this.selectedPad)) {
            this.selectedPad = null;
            this.updateColorsState();
        }
    },

    resetSelections() {
        this.selectedPad = null;
        this.selectedGroup = null;
        this.updateColorsState();
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

    // ===== API PUBLIQUE =====
    getSelectedPad() { return this.selectedPad; },
    getSelectedGroup() { return this.selectedGroup; },
    areColorsEnabled() { return this.colorsEnabled; },
    getCurrentMode() { return this.currentMode; },
    setColorsEnabled(enabled) { this.colorsEnabled = enabled; this.updateColorsState(); },
    isPadAvailableForColor(padNumber) { return this.isPadSelectable(padNumber); },
    canApplyColorToPad(padNumber) { return this.colorsEnabled && this.isPadSelectable(padNumber); },
    canApplyColorToGroup(groupId) { return this.colorsEnabled && groupId !== null; }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsColors = PadsColors;
}