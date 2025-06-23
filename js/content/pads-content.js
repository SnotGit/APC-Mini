const PadsContent = {

    // ===== ÉTAT HUB CENTRAL =====
    padColors: {},
    highlightedPads: [],
    selectedPad: null,
    currentMode: 'pads', // 'pads' ou 'groups'
    sequencerConfig: {
        enabled: false,
        groupId: null,
        steps: 16,
        highlightedPads: []
    },
    isInitialized: false,

    // ===== CRÉATION GRILLE PADS =====
    create() {
        return `
            <div class="pad-grid" id="padGrid">
                ${this.generatePads()}
            </div>
        `;
    },

    // ===== GÉNÉRATION 64 PADS =====
    generatePads() {
        let padsHTML = '';
        
        // Grille 8x8 = 64 pads
        // Numérotation : Row 8 = Pads 57-64, Row 7 = 49-56, etc.
        for (let row = 8; row >= 1; row--) {
            for (let col = 1; col <= 8; col++) {
                const padNumber = ((row - 1) * 8) + col;
                const midiNote = padNumber - 1; // MIDI = 0-63
                
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
        // Clics sur pads
        document.addEventListener('click', (e) => {
            const pad = e.target.closest('.pad');
            if (pad) {
                const padNumber = parseInt(pad.dataset.padNumber);
                const midiNote = parseInt(pad.dataset.midiNote);
                this.handlePadClick(padNumber, midiNote);
            }
        });

        // === RÉCEPTION ASSIGNATIONS COULEURS ===
        
        // Assignation pad individuel depuis pads-mode
        window.addEventListener('apply-pad-color', (event) => {
            const { padNumber, color } = event.detail;
            this.applyPadColor(padNumber, color);
        });

        // Assignation groupe depuis groups-mode
        window.addEventListener('apply-group-color', (event) => {
            const { groupPads, color, groupId } = event.detail;
            this.applyGroupColor(groupPads, color, groupId);
        });

        // === GESTION MODES ===
        
        // Changement mode pads/groups
        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
            this.clearSelection();
        });

        // Highlight groupe (mode groups)
        window.addEventListener('highlight-group', (event) => {
            const { groupPads } = event.detail;
            this.highlightGroup(groupPads);
        });

        // === SÉQUENCEUR ===
        
        // Highlights séquenceur depuis groups-mode
        window.addEventListener('sequencer-highlights-active', (event) => {
            const { sequencerPads, groupId, steps } = event.detail;
            this.applySequencerHighlights(sequencerPads, groupId, steps);
        });

        // Clear highlights séquenceur
        window.addEventListener('clear-sequencer-highlights', () => {
            this.clearSequencerHighlights();
        });

        // Config séquenceur depuis groups-mode
        window.addEventListener('sequencer-config-update', (event) => {
            const { groupId, steps, sequencerPads, enabled } = event.detail;
            this.updateSequencerConfig(groupId, steps, sequencerPads, enabled);
        });

        // Désactivation séquenceur
        window.addEventListener('sequencer-deactivated', () => {
            this.deactivateSequencer();
        });

        // === BOUTONS CONTRÔLES SÉQUENCEUR ===
        
        // Boutons contrôles séquenceur depuis groups-mode
        window.addEventListener('sequencer-controls-active', (event) => {
            const { active, controlButtons } = event.detail;
            this.handleSequencerControls(active, controlButtons);
        });

        // Clear sélection
        window.addEventListener('clear-selection', () => {
            this.clearSelection();
        });
    },

    // ===== GESTION CLICS PADS =====
    handlePadClick(padNumber, midiNote) {
        // Mode groups : pas de sélection individuelle
        if (this.currentMode === 'groups') {
            return;
        }
        
        // Mode pads : sélection individuelle
        if (this.currentMode === 'pads') {
            this.selectPad(padNumber, midiNote);
        }
    },

    selectPad(padNumber, midiNote) {
        this.selectedPad = padNumber;
        this.updateAllPadVisuals();
        
        // Notifier pads-mode de la sélection
        window.dispatchEvent(new CustomEvent('pad-clicked', {
            detail: { padNumber, midiNote }
        }));
    },

    clearSelection() {
        this.selectedPad = null;
        this.updateAllPadVisuals();
    },

    // ===== ASSIGNATION COULEURS =====
    applyPadColor(padNumber, color) {
        // Sauvegarder couleur
        if (color) {
            this.padColors[padNumber] = color;
        } else {
            delete this.padColors[padNumber];
        }
        
        // Mettre à jour visuel
        this.updatePadVisual(padNumber);
        
        // Envoyer vers MIDI si connecté
        this.sendPadColorToMIDI(padNumber, color);
        
        // Log assignation
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('pad-assigned', {
            detail: { padNumber, color: colorText }
        }));
        
        // Sauvegarder config
        this.savePadColors();
        
        // Clear sélection après assignation
        this.clearSelection();
    },

    applyGroupColor(groupPads, color, groupId) {
        // Appliquer couleur à tous les pads du groupe
        groupPads.forEach(padNumber => {
            if (color) {
                this.padColors[padNumber] = color;
            } else {
                delete this.padColors[padNumber];
            }
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, color);
        });
        
        // Log groupe
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('group-assigned', {
            detail: { groupId, color: colorText }
        }));
        
        // Sauvegarder
        this.savePadColors();
    },

    // ===== GESTION HIGHLIGHTS =====
    highlightGroup(groupPads) {
        // Nettoyer anciens highlights groupes
        document.querySelectorAll('.pad.group-highlight').forEach(pad => {
            pad.classList.remove('group-highlight');
        });
        
        // Appliquer nouveaux highlights groupes
        groupPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad && !this.padColors[padNumber] && !this.isSequencerHighlighted(padNumber)) {
                pad.classList.add('group-highlight');
            }
        });
    },

    applySequencerHighlights(sequencerPads, groupId, steps) {
        // Sauvegarder état séquenceur
        this.sequencerConfig.enabled = true;
        this.sequencerConfig.groupId = groupId;
        this.sequencerConfig.steps = steps;
        this.sequencerConfig.highlightedPads = sequencerPads;
        
        // Nettoyer anciens highlights séquenceur
        this.clearSequencerHighlights();
        
        // Appliquer nouveaux highlights séquenceur
        sequencerPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad) {
                pad.classList.add('sequencer-highlight');
            }
        });
        
        // Envoyer highlights vers MIDI
        this.sendSequencerHighlightsToMIDI(sequencerPads);
        
        // Mettre à jour mode grille
        this.updateGridMode();
    },

    clearSequencerHighlights() {
        // Nettoyer CSS highlights séquenceur
        document.querySelectorAll('.pad.sequencer-highlight').forEach(pad => {
            pad.classList.remove('sequencer-highlight');
        });
        
        // Nettoyer MIDI highlights (si pas de couleur assignée)
        this.sequencerConfig.highlightedPads.forEach(padNumber => {
            if (!this.padColors[padNumber]) {
                this.sendPadColorToMIDI(padNumber, null);
            }
        });
        
        // Reset config séquenceur
        this.sequencerConfig.highlightedPads = [];
        this.updateGridMode();
    },

    // ===== SÉQUENCEUR CONFIG =====
    updateSequencerConfig(groupId, steps, sequencerPads, enabled) {
        this.sequencerConfig = {
            enabled,
            groupId,
            steps,
            highlightedPads: sequencerPads
        };
        
        // Transmettre config à sequencer-content
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
        
        // Notifier sequencer-content
        window.dispatchEvent(new CustomEvent('sequencer-config-received', {
            detail: { enabled: false }
        }));
    },

    // ===== BOUTONS CONTRÔLES SÉQUENCEUR =====
    handleSequencerControls(active, controlButtons) {
        if (active) {
            // Appliquer couleurs et highlights aux pads contrôle
            Object.entries(controlButtons).forEach(([padNumber, color]) => {
                const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
                if (!pad) return;

                if (color) {
                    // Appliquer couleur (vert, jaune, rouge)
                    this.padColors[padNumber] = color;
                    this.updatePadVisual(parseInt(padNumber));
                    this.sendPadColorToMIDI(parseInt(padNumber), color);
                } else {
                    // Pad Play (null) = highlight seulement
                    pad.classList.add('sequencer-highlight');
                }
                
                // Ajouter classe control-pad-active (désactive clics)
                pad.classList.add('control-pad-active');
            });
        } else {
            // Clear couleurs et highlights contrôles
            this.clearControlPads();
        }
    },

    clearControlPads() {
        // Nettoyer toutes les classes control-pad-active
        document.querySelectorAll('.pad.control-pad-active').forEach(pad => {
            const padNumber = parseInt(pad.dataset.padNumber);
            
            // Retirer classe control-pad-active
            pad.classList.remove('control-pad-active');
            
            // Retirer highlight
            pad.classList.remove('sequencer-highlight');
            
            // Supprimer couleurs des pads contrôle (assignées par séquenceur)
            delete this.padColors[padNumber];
            this.updatePadVisual(padNumber);
            this.sendPadColorToMIDI(padNumber, null);
        });
        
        // Sauvegarder après suppression
        this.savePadColors();
    },

    // ===== ÉTATS VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        // Reset classes
        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-yellow', 'color-red');

        // État sélectionné (mode pads uniquement)
        if (this.selectedPad === padNumber && this.currentMode === 'pads') {
            pad.classList.add('selected');
        }
        
        // Couleur assignée (priorité sur highlights)
        const color = this.padColors[padNumber];
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
        
        const midiNote = padNumber - 1; // Convert to MIDI note (0-63)
        window.MIDI.setPadColor(midiNote, color);
    },

    sendSequencerHighlightsToMIDI(sequencerPads) {
        if (!window.MIDI || !window.MIDI.isConnected()) return;
        
        sequencerPads.forEach(padNumber => {
            const midiNote = padNumber - 1;
            // Highlights séquenceur en jaune si pas de couleur assignée
            if (!this.padColors[padNumber]) {
                window.MIDI.setPadColor(midiNote, 'YELLOW');
            }
        });
    },

    // ===== PERSISTENCE =====
    loadPadColors() {
        if (window.App && window.App.getConfig) {
            const padsConfig = window.App.getConfig('pads');
            if (padsConfig && padsConfig.padColors) {
                this.padColors = { ...padsConfig.padColors };
                this.updateAllPadVisuals();
                
                // Appliquer couleurs au MIDI
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

    // ===== UTILITAIRES =====
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

    // ===== DEBUGGING =====
    getState() {
        return {
            currentMode: this.currentMode,
            selectedPad: this.selectedPad,
            padColorsCount: Object.keys(this.padColors).length,
            sequencerConfig: this.sequencerConfig,
            highlightedPadsCount: this.sequencerConfig.highlightedPads.length
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsContent = PadsContent;
}