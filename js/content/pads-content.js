const PadsContent = {

    // ===== ÉTAT HUB CENTRAL =====
    padColors: {},
    groupAssignments: {},
    highlightedPads: [],
    selectedPad: null,
    currentMode: 'pads',
    sequencerConfig: {
        enabled: false,
        groupId: null,
        steps: 16,
        highlightedPads: [],
        controlPads: []
    },
    isInitialized: false,

    // ===== MAPPING 7 GROUPES =====
    groupMappings: {
        1: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36],
        2: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40],
        3: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4],
        4: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8],
        5: [57,58,59,60,61,62,63,64,49,50,51,52,53,54,55,56,41,42,43,44,45,46,47,48,33,34,35,36,37,38,39,40],
        6: [17,18,19,20,9,10,11,12,1,2,3,4],
        7: [21,22,23,24,13,14,15,16,5,6,7,8]
    },

    // ===== CRÉATION GRILLE PADS =====
    create() {
        return `
            <div class="pad-grid" id="padGrid">
                ${this.generatePads()}
            </div>
        `;
    },

    generatePads() {
        let padsHTML = '';
        
        for (let row = 8; row >= 1; row--) {
            for (let col = 1; col <= 8; col++) {
                const padNumber = ((row - 1) * 8) + col;
                const midiNote = padNumber - 1;
                
                padsHTML += this.createPad(padNumber, midiNote);
            }
        }
        
        return padsHTML;
    },

    createPad(padNumber, midiNote) {
        return `
            <div class="pad" 
                 data-pad-number="${padNumber}" 
                 data-midi-note="${midiNote}"
                 title="Pad ${padNumber} (MIDI: ${midiNote})">
                <span class="pad-number">${padNumber}</span>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.loadPadColors();
        this.updateAllPadVisuals();
        
        this.isInitialized = true;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const pad = e.target.closest('.pad');
            if (pad) {
                const padNumber = parseInt(pad.dataset.padNumber);
                const midiNote = parseInt(pad.dataset.midiNote);
                this.handlePadClick(padNumber, midiNote);
            }
        });

        // === RÉCEPTION ASSIGNATIONS COULEURS ===
        
        window.addEventListener('apply-pad-color', (event) => {
            const { padNumber, color } = event.detail;
            this.applyPadColor(padNumber, color);
        });

        window.addEventListener('apply-group-color', (event) => {
            const { groupPads, color, groupId } = event.detail;
            this.applyGroupColor(groupPads, color, groupId);
        });

        // === GESTION MODES ===
        
        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
            this.clearSelection();
        });

        window.addEventListener('highlight-group', (event) => {
            const { groupPads } = event.detail;
            this.highlightGroup(groupPads);
        });

        // === SÉQUENCEUR ===
        
        window.addEventListener('sequencer-highlights-active', (event) => {
            const { sequencerPads, groupId, steps } = event.detail;
            this.applySequencerHighlights(sequencerPads, groupId, steps);
        });

        window.addEventListener('clear-sequencer-highlights', () => {
            this.clearSequencerHighlights();
        });

        window.addEventListener('sequencer-config-update', (event) => {
            const { groupId, steps, sequencerPads, enabled } = event.detail;
            this.updateSequencerConfig(groupId, steps, sequencerPads, enabled);
        });

        window.addEventListener('sequencer-deactivated', () => {
            this.deactivateSequencer();
        });

        window.addEventListener('sequencer-controls-active', (event) => {
            const { active, controlButtons } = event.detail;
            this.handleSequencerControls(active, controlButtons);
        });

        window.addEventListener('clear-selection', () => {
            this.clearSelection();
        });
    },

    // ===== GESTION CLICS PADS =====
    handlePadClick(padNumber, midiNote) {
        if (this.currentMode === 'groups') {
            return;
        }
        
        if (this.currentMode === 'pads') {
            if (this.isPadAvailable(padNumber)) {
                this.selectPad(padNumber, midiNote);
            }
        }
    },

    selectPad(padNumber, midiNote) {
        if (this.selectedPad === padNumber) {
            if (!this.getPadColor(padNumber)) {
                this.clearSelection();
                return;
            }
        }
        
        this.selectedPad = padNumber;
        this.updateAllPadVisuals();
        
        window.dispatchEvent(new CustomEvent('pad-clicked', {
            detail: { padNumber, midiNote }
        }));
    },

    clearSelection() {
        this.selectedPad = null;
        this.updateAllPadVisuals();
    },

    // ===== VÉRIFICATION DISPONIBILITÉ PADS SIMPLIFIÉE =====
    isPadAvailable(padNumber) {
        if (this.isPadInAnyAssignedGroup(padNumber)) {
            return false;
        }
        
        if (this.isPadControlSequencer(padNumber)) {
            return false;
        }
        
        return true;
    },

    isPadInAnyAssignedGroup(padNumber) {
        for (const [groupId, groupPads] of Object.entries(this.groupMappings)) {
            if (groupPads.includes(padNumber)) {
                if (this.groupAssignments[groupId]) {
                    return true;
                }
            }
        }
        return false;
    },

    isPadControlSequencer(padNumber) {
        return this.sequencerConfig.controlPads.includes(padNumber);
    },

    // ===== ASSIGNATION COULEURS =====
    applyPadColor(padNumber, color) {
        if (!this.isPadAvailable(padNumber)) {
            return;
        }
        
        if (color) {
            this.padColors[padNumber] = color;
        } else {
            delete this.padColors[padNumber];
        }
        
        this.updatePadVisual(padNumber);
        this.sendPadColorToMIDI(padNumber, color);
        
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('pad-assigned', {
            detail: { padNumber, color: colorText }
        }));
        
        this.savePadColors();
        this.clearSelection();
    },

    applyGroupColor(groupPads, color, groupId) {
        this.groupAssignments[groupId] = color;
        
        groupPads.forEach(padNumber => {
            delete this.padColors[padNumber];
            
            if (color) {
                this.padColors[padNumber] = color;
            }
            
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, color);
        });
        
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('group-assigned', {
            detail: { groupId, color: colorText }
        }));
        
        this.savePadColors();
    },

    // ===== GESTION HIGHLIGHTS =====
    highlightGroup(groupPads) {
        document.querySelectorAll('.pad.group-highlight').forEach(pad => {
            pad.classList.remove('group-highlight');
        });
        
        groupPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad && !this.getPadColor(padNumber) && !this.isSequencerHighlighted(padNumber)) {
                pad.classList.add('group-highlight');
            }
        });
    },

    applySequencerHighlights(sequencerPads, groupId, steps) {
        this.sequencerConfig.enabled = true;
        this.sequencerConfig.groupId = groupId;
        this.sequencerConfig.steps = steps;
        this.sequencerConfig.highlightedPads = sequencerPads;
        
        this.clearSequencerHighlights();
        
        sequencerPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad) {
                pad.classList.add('sequencer-highlight');
            }
        });
        
        this.sendSequencerHighlightsToMIDI(sequencerPads);
        this.updateGridMode();
    },

    clearSequencerHighlights() {
        document.querySelectorAll('.pad.sequencer-highlight').forEach(pad => {
            pad.classList.remove('sequencer-highlight');
        });
        
        this.sequencerConfig.highlightedPads.forEach(padNumber => {
            if (!this.getPadColor(padNumber)) {
                this.sendPadColorToMIDI(padNumber, null);
            }
        });
        
        this.sequencerConfig.highlightedPads = [];
        this.updateGridMode();
    },

    // ===== SÉQUENCEUR CONFIG =====
    updateSequencerConfig(groupId, steps, sequencerPads, enabled) {
        this.sequencerConfig = {
            enabled,
            groupId,
            steps,
            highlightedPads: sequencerPads,
            controlPads: this.sequencerConfig.controlPads
        };
        
        window.dispatchEvent(new CustomEvent('sequencer-config-received', {
            detail: {
                groupId,
                steps,
                sequencerPads,
                enabled
            }
        }));
    },

    deactivateSequencer() {
        this.sequencerConfig.enabled = false;
        this.clearSequencerHighlights();
        this.clearControlPads();
        
        window.dispatchEvent(new CustomEvent('sequencer-config-received', {
            detail: { enabled: false }
        }));
    },

    // ===== BOUTONS CONTRÔLES SÉQUENCEUR =====
    handleSequencerControls(active, controlButtons) {
        if (active) {
            this.sequencerConfig.controlPads = Object.keys(controlButtons).map(Number);
            
            Object.entries(controlButtons).forEach(([padNumber, color]) => {
                const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
                if (!pad) return;

                if (color) {
                    this.padColors[padNumber] = color;
                    this.updatePadVisual(parseInt(padNumber));
                    this.sendPadColorToMIDI(parseInt(padNumber), color);
                } else {
                    pad.classList.add('sequencer-highlight');
                }
                
                pad.classList.add('control-pad-active');
            });
        } else {
            this.clearControlPads();
        }
    },

    clearControlPads() {
        document.querySelectorAll('.pad.control-pad-active').forEach(pad => {
            const padNumber = parseInt(pad.dataset.padNumber);
            
            pad.classList.remove('control-pad-active');
            pad.classList.remove('sequencer-highlight');
            
            delete this.padColors[padNumber];
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, null);
        });
        
        this.sequencerConfig.controlPads = [];
        this.savePadColors();
    },

    // ===== ÉTATS VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-yellow', 'color-red', 'pad-occupied');

        if (!this.isPadAvailable(padNumber)) {
            pad.classList.add('pad-occupied');
        }

        if (this.selectedPad === padNumber && this.currentMode === 'pads') {
            pad.classList.add('selected');
        }
        
        const color = this.getPadColor(padNumber);
        if (color) {
            pad.classList.add(`color-${color}`);
        }
    },

    updateAllPadVisuals() {
        for (let i = 1; i <= 64; i++) {
            this.updatePadVisual(i);
        }
    },

    updateGridMode() {
        const padGrid = document.getElementById('padGrid');
        if (!padGrid) return;
        
        padGrid.classList.toggle('sequencer-mode', this.sequencerConfig.enabled);
    },

    // ===== COMMUNICATION MIDI =====
    sendPadColorToMIDI(padNumber, color) {
        if (!window.MIDI || !window.MIDI.isConnected()) return;
        
        const midiNote = padNumber - 1;
        window.MIDI.setPadColor(midiNote, color);
    },

    sendSequencerHighlightsToMIDI(sequencerPads) {
        if (!window.MIDI || !window.MIDI.isConnected()) return;
        
        sequencerPads.forEach(padNumber => {
            const midiNote = padNumber - 1;
            if (!this.getPadColor(padNumber)) {
                window.MIDI.setPadColor(midiNote, 'YELLOW');
            }
        });
    },

    // ===== PERSISTANCE =====
    loadPadColors() {
        if (window.App && window.App.getConfig) {
            const padsConfig = window.App.getConfig('pads');
            if (padsConfig && padsConfig.padColors) {
                this.padColors = { ...padsConfig.padColors };
                this.updateAllPadVisuals();
                
                Object.entries(this.padColors).forEach(([padNumber, color]) => {
                    this.sendPadColorToMIDI(parseInt(padNumber), color);
                });
            }
        }
    },

    savePadColors() {
        if (window.App && window.App.updateConfig) {
            window.App.updateConfig('pads', { padColors: this.padColors });
        }
    },

    // ===== API PUBLIQUE =====
    getPadColor(padNumber) {
        return this.padColors[padNumber] || null;
    },

    getSelectedPad() {
        return this.selectedPad;
    },

    isSequencerHighlighted(padNumber) {
        return this.sequencerConfig.highlightedPads.includes(padNumber);
    },

    getSequencerConfig() {
        return { ...this.sequencerConfig };
    },

    hasGroupAssignments(groupId) {
        return !!(this.groupAssignments[groupId]);
    },

    // ===== API PUBLIQUE SIMPLIFIÉE =====
    isPadInGroupAssignment(padNumber) {
        return this.isPadInAnyAssignedGroup(padNumber);
    },

    // ===== DEBUGGING =====
    getState() {
        return {
            currentMode: this.currentMode,
            selectedPad: this.selectedPad,
            padColorsCount: Object.keys(this.padColors).length,
            groupAssignments: this.groupAssignments,
            sequencerConfig: this.sequencerConfig,
            highlightedPadsCount: this.sequencerConfig.highlightedPads.length
        };
    }
};

if (typeof window !== 'undefined') {
    window.PadsContent = PadsContent;
}