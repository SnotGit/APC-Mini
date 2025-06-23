const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    sequencerToggle: false,
    sequencerSteps: 16, // 16 ou 32
    isInitialized: false,

    // ===== MAPPING GROUPES SELON GRILLE =====
    groups: {
        1: { 
            name: 'GROUPE 1', 
            pads: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36], // Carré gauche haut
            hasSequencer: true
        },
        2: { 
            name: 'GROUPE 2', 
            pads: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40], // Carré droit haut
            hasSequencer: true
        },
        3: { 
            name: 'GROUPE 3', 
            pads: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4], // Carré gauche bas
            hasSequencer: false
        },
        4: { 
            name: 'GROUPE 4', 
            pads: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8], // Carré droit bas
            hasSequencer: false
        },
        5: {
            name: 'GROUPE 5 (32 steps)',
            pads: [
                57,58,59,60,61,62,63,64, // Row 1 complète
                49,50,51,52,53,54,55,56, // Row 2 complète
                41,42,43,44,45,46,47,48, // Row 3 complète
                33,34,35,36,37,38,39,40  // Row 4 complète
            ],
            hasSequencer: true
        }
    },

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="groups-section">
                <div class="groups-grid">
                    <button class="group-btn" data-group="1">GROUPE 1</button>
                    <button class="group-btn" data-group="2">GROUPE 2</button>
                    <button class="group-btn" data-group="3">GROUPE 3</button>
                    <button class="group-btn" data-group="4">GROUPE 4</button>
                </div>
                
                <div id="sequencerModeContainer">
                    <!-- Séquenceur-mode injecté par sequencer-mode.js -->
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        
        // Initialiser sequencer-mode après insertion DOM
        if (window.SequencerMode && window.SequencerMode.init) {
            window.SequencerMode.init();
        }
        
        this.isInitialized = true;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Clics boutons groupes
        document.addEventListener('click', (e) => {
            const groupBtn = e.target.closest('.group-btn');
            if (groupBtn) {
                const groupId = parseInt(groupBtn.dataset.group);
                
                // SÉCURITÉ MODE 32 STEPS - Désactiver clics groupes 1&2
                if (this.isGroupDisabledForSafety(groupId)) {
                    e.preventDefault();
                    return; // Bloquer le clic pour éviter conflits
                }
                
                this.selectGroup(groupId);
            }
        });

        // Écouter toggle séquenceur depuis sequencer-mode
        window.addEventListener('sequencer-toggle-changed', (event) => {
            const { enabled, groupId } = event.detail;
            this.handleSequencerToggle(enabled, groupId);
        });

        // Écouter switch 16/32 steps depuis sequencer-mode
        window.addEventListener('sequencer-steps-changed', (event) => {
            const { steps, groupId } = event.detail;
            this.handleStepsChange(steps, groupId);
        });

        // Écouter demandes couleurs depuis pads-colors
        window.addEventListener('group-color-request', (event) => {
            const { groupId, color } = event.detail;
            this.handleGroupColorRequest(groupId, color);
        });
    },

    // ===== MAPPING PADS CONTRÔLE PAR GROUPE =====
    getControlPadsForGroup(groupId) {
        const controlMappings = {
            1: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }, // Groupe 1
            2: { 29: null, 30: 'green', 31: 'yellow', 32: 'red' }, // Groupe 2  
            5: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }  // Groupe 5 (32 steps) = comme groupe 1
        };
        
        return controlMappings[groupId] || {};
    },

    // ===== SÉCURITÉ MODE 32 STEPS =====
    isGroupDisabledForSafety(groupId) {
        // Désactiver groupes 1 et 2 si séquenceur 32 steps actif
        // Pour éviter conflits avec groupe 5 qui utilise leurs emplacements
        return this.sequencerToggle && 
               this.sequencerSteps === 32 && 
               (groupId === 1 || groupId === 2);
    },

    // ===== SÉLECTION GROUPE =====
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        // Mettre à jour boutons visuellement
        this.updateGroupButtons();
        
        // Notifier pads-colors du groupe sélectionné
        window.dispatchEvent(new CustomEvent('group-selected', {
            detail: { 
                groupId,
                groupPads: this.groups[groupId].pads,
                hasSequencer: this.groups[groupId].hasSequencer,
                sequencerEnabled: this.sequencerToggle && this.groups[groupId].hasSequencer
            }
        }));
        
        // Notifier pads-content pour highlight groupe
        window.dispatchEvent(new CustomEvent('highlight-group', {
            detail: { 
                groupPads: this.groups[groupId].pads,
                groupId
            }
        }));
    },

    // ===== GESTION TOGGLE SÉQUENCEUR =====
    handleSequencerToggle(enabled, groupId) {
        this.sequencerToggle = enabled;
        
        if (enabled) {
            // Déterminer groupe actif selon steps
            const activeGroup = this.sequencerSteps === 32 ? 5 : (groupId || this.selectedGroup);
            
            // Envoyer highlights séquenceur à pads-content
            this.sendSequencerHighlights(activeGroup);
            
            // Notifier pads-colors que couleurs sont inaccessibles
            window.dispatchEvent(new CustomEvent('sequencer-colors-disabled', {
                detail: { groupId: activeGroup }
            }));
            
            // Envoyer config séquenceur à pads-content
            this.sendSequencerConfig(activeGroup);
            
            // Activer boutons contrôles séquenceur
            const controlPads = this.getControlPadsForGroup(activeGroup);
            window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
                detail: { 
                    active: true,
                    controlButtons: controlPads
                }
            }));
            
        } else {
            // Nettoyer highlights séquenceur
            window.dispatchEvent(new CustomEvent('clear-sequencer-highlights'));
            
            // Notifier pads-colors que couleurs sont accessibles
            window.dispatchEvent(new CustomEvent('sequencer-colors-enabled'));
            
            // Désactiver séquenceur dans pads-content
            window.dispatchEvent(new CustomEvent('sequencer-deactivated'));
            
            // Désactiver boutons contrôles séquenceur
            window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
                detail: { active: false }
            }));
        }
        
        this.updateGroupButtons();
    },

    // ===== GESTION SWITCH 16/32 STEPS =====
    handleStepsChange(steps, groupId) {
        this.sequencerSteps = steps;
        
        if (this.sequencerToggle) {
            // Recalculer groupe actif
            const activeGroup = steps === 32 ? 5 : (groupId || this.selectedGroup);
            
            // Mettre à jour highlights
            this.sendSequencerHighlights(activeGroup);
            
            // Mettre à jour config séquenceur
            this.sendSequencerConfig(activeGroup);
        }
        
        this.updateGroupButtons();
    },

    // ===== ASSIGNATION COULEUR GROUPE =====
    handleGroupColorRequest(groupId, color) {
        // Vérifier si couleurs autorisées (toggle OFF ou groupe sans séquenceur actif)
        if (this.isColorAllowed(groupId)) {
            // Appliquer couleur groupe vers pads-content
            window.dispatchEvent(new CustomEvent('apply-group-color', {
                detail: { 
                    groupPads: this.groups[groupId].pads,
                    color,
                    groupId 
                }
            }));
        }
    },

    isColorAllowed(groupId) {
        // Couleurs inaccessibles si toggle ON ET groupe a séquenceur
        if (this.sequencerToggle && this.groups[groupId].hasSequencer) {
            // Vérifier si c'est le groupe actif du séquenceur
            const activeSequencerGroup = this.sequencerSteps === 32 ? 5 : this.selectedGroup;
            if (groupId === activeSequencerGroup || 
                (activeSequencerGroup === 5 && (groupId === 1 || groupId === 2))) {
                return false; // Highlights actifs = pas de couleurs
            }
        }
        return true; // Couleurs autorisées
    },

    // ===== COMMUNICATION SÉQUENCEUR =====
    sendSequencerHighlights(activeGroup) {
        const groupPads = this.groups[activeGroup].pads;
        
        window.dispatchEvent(new CustomEvent('sequencer-highlights-active', {
            detail: { 
                sequencerPads: groupPads,
                groupId: activeGroup,
                steps: this.sequencerSteps
            }
        }));
    },

    sendSequencerConfig(activeGroup) {
        window.dispatchEvent(new CustomEvent('sequencer-config-update', {
            detail: { 
                groupId: activeGroup,
                steps: this.sequencerSteps,
                sequencerPads: this.groups[activeGroup].pads,
                enabled: true
            }
        }));
    },

    // ===== INTERFACE BUTTONS =====
    updateGroupButtons() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const groupId = parseInt(btn.dataset.group);
            
            // Groupe sélectionné
            const isSelected = groupId === this.selectedGroup;
            btn.classList.toggle('active', isSelected);
            
            // Indication séquenceur actif
            const hasActiveSequencer = this.isSequencerActiveOnGroup(groupId);
            btn.classList.toggle('sequencer-active', hasActiveSequencer);
            
            // Mode 32 steps indication
            const is32Mode = this.sequencerSteps === 32 && this.sequencerToggle;
            btn.classList.toggle('mode-32', is32Mode);
            
            // SÉCURITÉ - Désactiver visuellement boutons 1&2 en mode 32
            const isDisabledForSafety = this.isGroupDisabledForSafety(groupId);
            btn.classList.toggle('disabled-safety', isDisabledForSafety);
            btn.style.pointerEvents = isDisabledForSafety ? 'none' : 'auto';
        });
    },

    isSequencerActiveOnGroup(groupId) {
        if (!this.sequencerToggle) return false;
        
        if (this.sequencerSteps === 32) {
            // Mode 32 = groupe 5 utilise groupes 1 et 2
            return groupId === 1 || groupId === 2;
        } else {
            // Mode 16 = groupe sélectionné avec séquenceur
            return groupId === this.selectedGroup && this.groups[groupId].hasSequencer;
        }
    },

    // ===== API PUBLIQUE =====
    getSelectedGroup() {
        return this.selectedGroup;
    },

    getGroupPads(groupId) {
        return this.groups[groupId] ? this.groups[groupId].pads : [];
    },

    isSequencerEnabled() {
        return this.sequencerToggle;
    },

    getSequencerSteps() {
        return this.sequencerSteps;
    },

    getActiveSequencerGroup() {
        if (!this.sequencerToggle) return null;
        return this.sequencerSteps === 32 ? 5 : this.selectedGroup;
    },

    // ===== DEBUGGING =====
    getState() {
        return {
            selectedGroup: this.selectedGroup,
            sequencerToggle: this.sequencerToggle,
            sequencerSteps: this.sequencerSteps,
            activeSequencerGroup: this.getActiveSequencerGroup(),
            colorAllowedForSelected: this.isColorAllowed(this.selectedGroup),
            group1DisabledForSafety: this.isGroupDisabledForSafety(1),
            group2DisabledForSafety: this.isGroupDisabledForSafety(2)
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}