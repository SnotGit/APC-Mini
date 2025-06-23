const PadsContent = {

    // ===== ÉTAT HUB CENTRAL =====
    padColors: {},
    groupAssignments: {},
    highlightedPads: [],
    selectedPad: null,
    currentMode: 'pads',
    sequencerConfig: { enabled: false, groupId: null, steps: 16, highlightedPads: [], controlPads: [] },
    isInitialized: false,

    // ===== MAPPING 7 GROUPES INDÉPENDANTS =====
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
        return `<div class="pad-grid" id="padGrid">${this.generatePads()}</div>`;
    },

    generatePads() {
        let padsHTML = '';
        for (let row = 8; row >= 1; row--) {
            for (let col = 1; col <= 8; col++) {
                const padNumber = ((row - 1) * 8) + col;
                const midiNote = padNumber - 1;
                padsHTML += `<div class="pad" data-pad-number="${padNumber}" data-midi-note="${midiNote}" title="Pad ${padNumber} (MIDI: ${midiNote})"><span class="pad-number">${padNumber}</span></div>`;
            }
        }
        return padsHTML;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        this.setupEventListeners();
        this.loadConfiguration();
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

        window.addEventListener('apply-pad-color', (e) => this.applyPadColor(e.detail.padNumber, e.detail.color));
        window.addEventListener('apply-group-color', (e) => this.applyGroupColor(e.detail.groupPads, e.detail.color, e.detail.groupId));
        window.addEventListener('mode-changed', (e) => { this.currentMode = e.detail.mode; this.clearSelection(); });
        window.addEventListener('highlight-group', (e) => this.highlightGroup(e.detail.groupPads));
        window.addEventListener('clear-selection', () => this.clearSelection());
        window.addEventListener('sequencer-activate', (e) => this.activateSequencer(e.detail));
        window.addEventListener('sequencer-deactivate', () => this.deactivateSequencer());
    },

    // ===== GESTION CLICS PADS =====
    handlePadClick(padNumber, midiNote) {
        if (this.currentMode === 'pads' && this.isPadAvailable(padNumber)) {
            this.selectPad(padNumber, midiNote);
        }
    },

    selectPad(padNumber, midiNote) {
        if (this.selectedPad === padNumber && !this.getPadColor(padNumber)) {
            this.clearSelection();
            return;
        }
        this.selectedPad = padNumber;
        this.updateAllPadVisuals();
        window.dispatchEvent(new CustomEvent('pad-clicked', { detail: { padNumber, midiNote } }));
    },

    clearSelection() {
        this.selectedPad = null;
        this.updateAllPadVisuals();
    },

    // ===== VÉRIFICATION DISPONIBILITÉ =====
    isPadAvailable(padNumber) {
        return !this.isPadInAnyAssignedGroup(padNumber) && !this.isPadControlSequencer(padNumber);
    },

    isPadInAnyAssignedGroup(padNumber) {
        return Object.entries(this.groupMappings).some(([groupId, groupPads]) => 
            groupPads.includes(padNumber) && this.groupAssignments[groupId]
        );
    },

    isPadControlSequencer(padNumber) {
        return this.sequencerConfig.controlPads.includes(padNumber);
    },

    // ===== ASSIGNATION COULEURS =====
    applyPadColor(padNumber, color) {
        if (!this.isPadAvailable(padNumber)) return;
        
        color ? this.padColors[padNumber] = color : delete this.padColors[padNumber];
        this.updatePadVisual(padNumber);
        this.sendPadColorToMIDI(padNumber, color);
        window.dispatchEvent(new CustomEvent('pad-assigned', { detail: { padNumber, color: color || 'clear' } }));
        this.saveConfiguration();
        this.clearSelection();
    },

    applyGroupColor(groupPads, color, groupId) {
        this.groupAssignments[groupId] = color;
        groupPads.forEach(padNumber => {
            delete this.padColors[padNumber];
            if (color) this.padColors[padNumber] = color;
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, color);
        });
        
        // Assigner pads contrôle si séquenceur actif
        if (this.sequencerConfig.enabled && this.isSequencerGroup(groupId)) {
            this.assignControlPads(groupId);
        }
        
        window.dispatchEvent(new CustomEvent('group-assigned', { detail: { groupId, color: color || 'clear' } }));
        this.saveConfiguration();
    },

    isSequencerGroup(groupId) {
        return groupId === 1 || groupId === 2 || groupId === 5;
    },

    assignControlPads(groupId) {
        const controls = this.getControlsForGroup(groupId);
        Object.entries(controls).forEach(([padNumber, color]) => {
            if (color) {
                this.padColors[parseInt(padNumber)] = color;
                this.updatePadVisual(parseInt(padNumber));
                this.sendPadColorToMIDI(parseInt(padNumber), color);
            }
        });
    },

    getControlsForGroup(groupId) {
        const controlMappings = {
            1: { 26: 'green', 27: 'yellow', 28: 'red' },
            2: { 30: 'green', 31: 'yellow', 32: 'red' },
            5: { 26: 'green', 27: 'yellow', 28: 'red' }
        };
        return controlMappings[groupId] || {};
    },

    // ===== GESTION HIGHLIGHTS =====
    highlightGroup(groupPads) {
        document.querySelectorAll('.pad.group-highlight').forEach(pad => pad.classList.remove('group-highlight'));
        groupPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad && !this.getPadColor(padNumber) && !this.isSequencerHighlighted(padNumber)) {
                pad.classList.add('group-highlight');
            }
        });
    },

    // ===== SÉQUENCEUR OPTIMISÉ =====
    activateSequencer(detail) {
        const { groupId, steps, pads, controls, enabled } = detail;
        
        this.sequencerConfig = { enabled, groupId, steps, highlightedPads: pads, controlPads: Object.keys(controls).map(Number) };
        
        // Clear précédents highlights
        document.querySelectorAll('.pad.sequencer-highlight').forEach(pad => pad.classList.remove('sequencer-highlight'));
        
        // Appliquer highlights séquenceur
        pads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad) pad.classList.add('sequencer-highlight');
        });
        
        // Appliquer contrôles séquenceur
        Object.entries(controls).forEach(([padNumber, color]) => {
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
        
        this.sendSequencerHighlightsToMIDI(pads);
        this.updateGridMode();
        
        // Notifier séquenceur-content
        window.dispatchEvent(new CustomEvent('sequencer-config-received', { detail: { groupId, steps, sequencerPads: pads, enabled } }));
    },

    deactivateSequencer() {
        this.sequencerConfig.enabled = false;
        document.querySelectorAll('.pad.sequencer-highlight').forEach(pad => pad.classList.remove('sequencer-highlight'));
        this.clearControlPads();
        this.updateGridMode();
        window.dispatchEvent(new CustomEvent('sequencer-config-received', { detail: { enabled: false } }));
    },

    clearControlPads() {
        document.querySelectorAll('.pad.control-pad-active').forEach(pad => {
            const padNumber = parseInt(pad.dataset.padNumber);
            pad.classList.remove('control-pad-active', 'sequencer-highlight');
            delete this.padColors[padNumber];
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, null);
        });
        this.sequencerConfig.controlPads = [];
        this.saveConfiguration();
    },

    // ===== ÉTATS VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        pad.className = 'pad';
        if (!this.isPadAvailable(padNumber)) pad.classList.add('pad-occupied');
        if (this.selectedPad === padNumber && this.currentMode === 'pads') pad.classList.add('selected');
        
        const color = this.getPadColor(padNumber);
        if (color) pad.classList.add(`color-${color}`);
    },

    updateAllPadVisuals() {
        for (let i = 1; i <= 64; i++) this.updatePadVisual(i);
    },

    updateGridMode() {
        const padGrid = document.getElementById('padGrid');
        if (padGrid) padGrid.classList.toggle('sequencer-mode', this.sequencerConfig.enabled);
    },

    // ===== COMMUNICATION MIDI =====
    sendPadColorToMIDI(padNumber, color) {
        if (window.MIDI?.isConnected?.()) {
            window.MIDI.setPadColor(padNumber - 1, color);
        }
    },

    sendSequencerHighlightsToMIDI(sequencerPads) {
        if (!window.MIDI?.isConnected?.()) return;
        sequencerPads.forEach(padNumber => {
            if (!this.getPadColor(padNumber)) {
                window.MIDI.setPadColor(padNumber - 1, 'YELLOW');
            }
        });
    },

    // ===== PERSISTANCE CENTRALISÉE =====
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('apc-mini-full-config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.padColors = config.padColors || {};
                this.groupAssignments = config.groupAssignments || {};
                Object.entries(this.padColors).forEach(([padNumber, color]) => {
                    this.sendPadColorToMIDI(parseInt(padNumber), color);
                });
            }
        } catch (error) {
            // Configuration par défaut silencieuse
        }
    },

    saveConfiguration() {
        try {
            localStorage.setItem('apc-mini-full-config', JSON.stringify({
                padColors: this.padColors,
                groupAssignments: this.groupAssignments,
                timestamp: Date.now(),
                version: '1.0'
            }));
        } catch (error) {
            // Sauvegarde échouée silencieuse
        }
    },

    // ===== API PUBLIQUE =====
    getPadColor(padNumber) { return this.padColors[padNumber] || null; },
    getSelectedPad() { return this.selectedPad; },
    isSequencerHighlighted(padNumber) { return this.sequencerConfig.highlightedPads.includes(padNumber); },
    getSequencerConfig() { return { ...this.sequencerConfig }; },
    hasGroupAssignments(groupId) { return !!(this.groupAssignments[groupId]); },
    isPadInGroupAssignment(padNumber) { return this.isPadInAnyAssignedGroup(padNumber); },
    findGroupForPad(padNumber) { return Object.entries(this.groupMappings).find(([, pads]) => pads.includes(padNumber))?.[0] || null; },
    getGroupPads(groupId) { return this.groupMappings[groupId] || []; },
    isGroupAssigned(groupId) { return !!(this.groupAssignments[groupId]); },
    getGroupAssignedColor(groupId) { return this.groupAssignments[groupId] || null; }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsContent = PadsContent;
}