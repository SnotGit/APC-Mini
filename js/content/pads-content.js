
const PadsContent = {

    // ===== ÉTAT =====
    selectedPad: null,
    padColors: {},
    isInitialized: false,
    currentMode: 'pads', // 'pads' ou 'groups'
    sequencerActive: false,
    sequencerGroup: null, // 2 ou 3

    // ===== CRÉATION GRILLE PADS =====
    create() {
        return `
            <div class="pad-grid">
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

    // ===== CRÉATION PAD INDIVIDUEL =====
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
        this.setupCommunication();
        this.loadPadColors();
        
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
    },

    setupCommunication() {
        // Écouter commandes depuis panel-config
        window.addEventListener('apply-pad-color', (event) => {
            const { padNumber, color } = event.detail;
            this.applyPadColor(padNumber, color);
        });

        window.addEventListener('apply-group-color', (event) => {
            const { groupPads, color } = event.detail;
            this.applyGroupColor(groupPads, color);
        });

        window.addEventListener('highlight-group', (event) => {
            const { groupPads } = event.detail;
            this.highlightGroup(groupPads);
        });

        window.addEventListener('mode-changed', (event) => {
            const { mode } = event.detail;
            this.currentMode = mode;
            this.clearSelection();
        });

        window.addEventListener('sequencer-activated', (event) => {
            const { groupId, activated } = event.detail;
            this.sequencerActive = activated;
            this.sequencerGroup = activated ? groupId : null;
            this.updateSequencerMode();
        });

        window.addEventListener('clear-selection', () => {
            this.clearSelection();
        });
    },

    // ===== GESTION CLICS =====
    handlePadClick(padNumber, midiNote) {
        // En mode groups : pas de sélection individuelle
        if (this.currentMode === 'groups') return;
        
        // En mode pads : sélection normale
        this.selectPad(padNumber);
        
        // Notifier panel-config
        window.dispatchEvent(new CustomEvent('pad-selected', {
            detail: { padNumber, midiNote }
        }));
    },

    selectPad(padNumber) {
        this.selectedPad = padNumber;
        this.updateAllPadVisuals();
    },

    clearSelection() {
        this.selectedPad = null;
        this.updateAllPadVisuals();
    },

    // ===== APPLICATION COULEURS =====
    applyPadColor(padNumber, color) {
        // Sauvegarder couleur
        if (color) {
            this.padColors[padNumber] = color;
        } else {
            delete this.padColors[padNumber];
        }
        
        // Mettre à jour visuel
        this.updatePadVisual(padNumber);
        
        // Log assignation
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('pad-assigned', {
            detail: { padNumber, color: colorText }
        }));
        
        // Désélectionner après assignation
        this.clearSelection();
    },

    applyGroupColor(groupPads, color) {
        // Ne pas appliquer si séquenceur actif sur ce groupe
        const groupId = this.getGroupFromPads(groupPads);
        if (this.sequencerActive && this.sequencerGroup === groupId) {
            return; // Séquenceur = pas de coloration libre
        }
        
        // Appliquer couleur à tous les pads du groupe
        groupPads.forEach(padNumber => {
            if (color) {
                this.padColors[padNumber] = color;
            } else {
                delete this.padColors[padNumber];
            }
            this.updatePadVisual(padNumber);
        });
        
        // Log groupe
        const colorText = color || 'clear';
        window.dispatchEvent(new CustomEvent('group-assigned', {
            detail: { groupId, color: colorText }
        }));
        
        // Sauvegarder
        this.savePadColors();
    },

    updateSequencerMode() {
        const padGrid = document.querySelector('.pad-grid');
        if (!padGrid) return;
        
        if (this.sequencerActive) {
            // Mode séquenceur : hover blanc (null color)
            padGrid.classList.add('sequencer-mode');
        } else {
            // Mode normal : hover standard
            padGrid.classList.remove('sequencer-mode');
        }
        
        this.updateAllPadVisuals();
    },

    highlightGroup(groupPads) {
        // Nettoyer anciens highlights
        document.querySelectorAll('.pad.group-highlight').forEach(pad => {
            pad.classList.remove('group-highlight');
        });
        
        // Appliquer nouveaux highlights
        groupPads.forEach(padNumber => {
            const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
            if (pad && !this.padColors[padNumber]) {
                pad.classList.add('group-highlight');
            }
        });
    },

    // ===== ÉTATS VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        // Reset classes
        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-yellow', 'color-red');

        // État sélectionné
        if (this.selectedPad === padNumber) {
            pad.classList.add('selected');
        }
        
        // Couleur assignée
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

    // ===== PERSISTENCE =====
    loadPadColors() {
        if (window.App && window.App.getConfig) {
            const padsConfig = window.App.getConfig('pads');
            if (padsConfig && padsConfig.padColors) {
                this.padColors = { ...padsConfig.padColors };
                this.updateAllPadVisuals();
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

    getGroupFromPads(groupPads) {
        // Identifier le groupe selon les pads
        // Groupe 1: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28]
        // Groupe 2: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] 
        // Groupe 3: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64]
        // Groupe 4: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32]
        
        if (groupPads.includes(1)) return 1;
        if (groupPads.includes(33)) return 2;
        if (groupPads.includes(37)) return 3;
        if (groupPads.includes(5)) return 4;
        
        return null;
    }

};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsContent = PadsContent;
}