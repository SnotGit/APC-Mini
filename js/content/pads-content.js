const Pads = {
    
    // ===== ÉTAT =====
    isInitialized: false,
    selectedPad: null,
    selectedGroup: null,
    currentMode: 'pads',
    sequencerEnabled: false,
    
    // ===== CONFIGURATION =====
    padConfigs: {},
    
    groups: {
        1: { name: 'Bas-Gauche', pads: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28] },
        2: { name: 'Haut-Gauche', pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] },
        3: { name: 'Haut-Droite', pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64] },
        4: { name: 'Bas-Droite', pads: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32] }
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.initPadConfigs();
        this.createInterface();
        this.setupEvents();
        this.loadConfig();
        
        this.isInitialized = true;
    },

    initPadConfigs() {
        for (let i = 1; i <= 64; i++) {
            this.padConfigs[i] = {
                color: null,
                group: this.findPadGroup(i)
            };
        }
    },

    findPadGroup(padNumber) {
        for (const [groupId, group] of Object.entries(this.groups)) {
            if (group.pads.includes(padNumber)) {
                return parseInt(groupId);
            }
        }
        return null;
    },

    // ===== INTERFACE =====
    createInterface() {
        // Créer grille pads
        const padGrid = document.getElementById('padGrid');
        if (padGrid) {
            padGrid.innerHTML = PadsContent.create();
        }

        // Créer panel config
        const configContent = document.getElementById('configContent');
        if (configContent) {
            configContent.innerHTML = PadsConfig.create();
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEvents() {
        // Boutons mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });

        // Clics pads
        document.addEventListener('click', (e) => {
            const pad = e.target.closest('.pad');
            if (pad) {
                const padNumber = parseInt(pad.dataset.padNumber);
                this.handlePadClick(padNumber);
            }
        });

        // Boutons groupes
        document.addEventListener('click', (e) => {
            const groupBtn = e.target.closest('.group-btn');
            if (groupBtn) {
                const groupId = parseInt(groupBtn.dataset.group);
                this.selectGroup(groupId);
            }
        });

        // Boutons couleurs
        document.addEventListener('click', (e) => {
            const colorBtn = e.target.closest('.color-btn');
            if (colorBtn) {
                const color = colorBtn.dataset.color;
                this.applyColor(color === 'clear' ? null : color);
            }
        });

        // Toggle séquenceur
        document.addEventListener('change', (e) => {
            if (e.target.id === 'sequencerToggle') {
                this.toggleSequencer(e.target.checked);
            }
        });

        // Switch bars
        document.addEventListener('change', (e) => {
            if (e.target.name === 'bars') {
                this.setBars(e.target.value);
            }
        });
    },

    // ===== MODES =====
    switchMode(mode) {
        this.currentMode = mode;
        this.selectedPad = null;
        this.selectedGroup = null;
        
        // Mettre à jour boutons mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Mettre à jour contenu config
        const configZone = document.getElementById('configZone');
        if (configZone) {
            if (mode === 'pads') {
                configZone.innerHTML = PadsConfig.createPadsMode();
            } else {
                configZone.innerHTML = PadsConfig.createGroupesMode();
                this.updateSequencerState();
            }
        }
        
        this.updatePadVisuals();
    },

    // ===== SÉLECTION PADS =====
    handlePadClick(padNumber) {
        if (this.currentMode === 'pads') {
            this.selectPad(padNumber);
        }
    },

    selectPad(padNumber) {
        this.selectedPad = padNumber;
        this.updatePadInfo(padNumber);
        this.updatePadVisuals();
    },

    updatePadInfo(padNumber) {
        const padInfo = document.getElementById('padInfo');
        if (padInfo && padNumber) {
            const midiNote = padNumber - 1;
            padInfo.textContent = `PAD ${padNumber} / NOTE ${midiNote}`;
        }
    },

    // ===== SÉLECTION GROUPES =====
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        // Mettre à jour boutons groupes
        document.querySelectorAll('.groupe-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.group) === groupId);
        });
        
        this.updateSequencerState();
        this.updatePadVisuals();
    },

    // ===== COULEURS =====
    applyColor(color) {
        if (this.currentMode === 'pads' && this.selectedPad) {
            this.applyPadColor(color);
        } else if (this.currentMode === 'groupes' && this.selectedGroup) {
            this.applyGroupColor(color);
        }
    },

    applyPadColor(color) {
        if (!this.selectedPad) return;
        
        this.padConfigs[this.selectedPad].color = color;
        this.updatePadVisual(this.selectedPad);
        this.saveConfig();
        
        if (color) {
            App.log(`Pad ${this.selectedPad} → ${color}`, 'success');
        }
        
        // Désélectionner
        this.selectedPad = null;
        this.updatePadVisuals();
    },

    applyGroupColor(color) {
        if (!this.selectedGroup) return;
        
        const group = this.groups[this.selectedGroup];
        
        group.pads.forEach(padNumber => {
            this.padConfigs[padNumber].color = color;
            this.updatePadVisual(padNumber);
        });
        
        this.saveConfig();
        
        if (color) {
            App.log(`Groupe ${this.selectedGroup} → ${color}`, 'success');
        }
    },

    // ===== SÉQUENCEUR =====
    toggleSequencer(enabled) {
        this.sequencerEnabled = enabled;
        
        // SEULEMENT appliquer/supprimer couleurs si toggle change
        if (enabled && (this.selectedGroup === 2 || this.selectedGroup === 3)) {
            this.applySequencerColors();
        } else if (!enabled && (this.selectedGroup === 2 || this.selectedGroup === 3)) {
            this.clearSequencerColors();
        }
        
        this.saveConfig();
    },

    applySequencerColors() {
        if (!this.selectedGroup || (this.selectedGroup !== 2 && this.selectedGroup !== 3)) return;
        
        const controlPads = this.getSequencerControlPads(this.selectedGroup);
        const colors = [null, 'green', 'yellow', 'red'];
        
        controlPads.forEach((pad, index) => {
            this.padConfigs[pad].color = colors[index];
            this.updatePadVisual(pad);
        });
    },

    clearSequencerColors() {
        if (!this.selectedGroup || (this.selectedGroup !== 2 && this.selectedGroup !== 3)) return;
        
        const controlPads = this.getSequencerControlPads(this.selectedGroup);
        
        controlPads.forEach(pad => {
            this.padConfigs[pad].color = null;
            this.updatePadVisual(pad);
        });
    },

    getSequencerControlPads(groupId) {
        return groupId === 2 ? [25, 26, 27, 28] : [29, 30, 31, 32];
    },

    setBars(bars) {
        // Mettre à jour le radio button sélectionné
        const radio = document.getElementById(`bars${bars}`);
        if (radio) {
            radio.checked = true;
        }
        
        // Sauvegarder dans config séquenceur
        App.updateConfig('sequencer', { bars: bars });
        
        App.log(`Séquenceur: ${bars} bars`, 'success');
    },

    updateSequencerState() {
        const toggle = document.getElementById('sequencerToggle');
        const barsSwitch = document.getElementById('barsSwitch');
        
        if (toggle && barsSwitch) {
            const canUseSequencer = this.selectedGroup === 2 || this.selectedGroup === 3;
            
            toggle.disabled = !canUseSequencer;
            toggle.checked = this.sequencerEnabled && canUseSequencer;
            
            // Afficher le switch bars seulement si séquenceur activé ET groupe compatible
            barsSwitch.style.display = (toggle.checked && canUseSequencer) ? 'flex' : 'none';
        }
    },

    // ===== VISUELS =====
    updatePadVisual(padNumber) {
        const pad = document.querySelector(`[data-pad-number="${padNumber}"]`);
        if (!pad) return;

        // Reset classes
        pad.classList.remove('selected', 'group-highlight', 'color-green', 'color-red', 'color-yellow');

        // État sélectionné
        if (this.currentMode === 'pads' && this.selectedPad === padNumber) {
            pad.classList.add('selected');
        }
        
        // Couleur assignée
        const color = this.padConfigs[padNumber].color;
        if (color) {
            pad.classList.add(`color-${color}`);
        }
        
        // Highlight groupe
        else if (this.currentMode === 'groupes' && this.selectedGroup && this.findPadGroup(padNumber) === this.selectedGroup) {
            pad.classList.add('group-highlight');
        }
    },

    updatePadVisuals() {
        for (let i = 1; i <= 64; i++) {
            this.updatePadVisual(i);
        }
    },

    // ===== CONFIGURATION =====
    saveConfig() {
        App.updateConfig('pads', {
            padConfigs: this.padConfigs,
            sequencerEnabled: this.sequencerEnabled
        });
    },

    loadConfig() {
        const config = App.getConfig('pads');
        if (config) {
            if (config.padConfigs) {
                this.padConfigs = { ...this.padConfigs, ...config.padConfigs };
            }
            if (config.sequencerEnabled !== undefined) {
                this.sequencerEnabled = config.sequencerEnabled;
            }
            
            this.updatePadVisuals();
        }
    },

    // ===== UTILITAIRES =====
    deselectAll() {
        this.selectedPad = null;
        this.selectedGroup = null;
        
        // Reset interface
        const padInfo = document.getElementById('padInfo');
        if (padInfo) {
            padInfo.textContent = 'NUMERO PAD / NOTE PAD';
        }
        
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.updatePadVisuals();
    }
};

// Export global
window.Pads = Pads;