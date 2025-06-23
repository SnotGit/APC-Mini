const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    sequencerToggle: false,
    sequencerSteps: 16, // 16 ou 32
    isInitialized: false,

    // MAPPING GROUPES
    groups: {
        1: { 
            name: 'GROUPE 1', 
            pads: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36],
            hasSequencer: true,
            controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' },
            availableInModes: [16] // Disponible seulement en mode 16
        },
        2: { 
            name: 'GROUPE 2', 
            pads: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40],
            hasSequencer: true,
            controls: { 29: null, 30: 'green', 31: 'yellow', 32: 'red' },
            availableInModes: [16] // Disponible seulement en mode 16
        },
        3: { 
            name: 'GROUPE 3', 
            pads: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4],
            hasSequencer: false,
            controls: {},
            availableInModes: [16, 32] // Disponible dans les deux modes
        },
        4: { 
            name: 'GROUPE 4', 
            pads: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8],
            hasSequencer: false,
            controls: {},
            availableInModes: [16, 32] // Disponible dans les deux modes
        },
        5: {
            name: 'GROUPE 5 (32 steps)',
            pads: [
                57,58,59,60,61,62,63,64, // 32 pads pour 32 steps
                49,50,51,52,53,54,55,56,
                41,42,43,44,45,46,47,48,
                33,34,35,36,37,38,39,40
            ],
            hasSequencer: true,
            controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }, // SES contrôles
            availableInModes: [32] // Disponible seulement en mode 32
        }
    },

    // CRÉATION TEMPLATE
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

    // ===== GROUPES DISPONIBLES SELON MODE =====
    getAvailableGroups() {
        return Object.keys(this.groups)
            .map(Number)
            .filter(groupId => this.isGroupAvailable(groupId));
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
            const { steps } = event.detail;
            this.handleStepsChange(steps);
        });

        // Écouter demandes couleurs depuis pads-colors
        window.addEventListener('group-color-request', (event) => {
            const { groupId, color } = event.detail;
            this.handleGroupColorRequest(groupId, color);
        });
    },

    // SÉLECTION GROUPE
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        this.updateInterface();
        
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

    // GESTION TOGGLE SÉQUENCEUR
    handleSequencerToggle(enabled, groupId) {
        this.sequencerToggle = enabled;
        
        if (enabled) {
            const activeGroup = this.getActiveSequencerGroup();
            this.activateSequencerForGroup(activeGroup);
        } else {
            this.deactivateSequencer();
        }
        
        this.updateInterface();
    },

    // GESTION SWITCH 16/32 STEPS
    handleStepsChange(steps) {
        const oldSteps = this.sequencerSteps;
        this.sequencerSteps = steps;
        
        // TRANSITION PROPRE : Désactiver ancien mode
        if (this.sequencerToggle) {
            this.deactivateSequencer();
        }
        
        // GÉRER APPARITION/DISPARITION GROUPE 5
        if (steps === 32 && oldSteps === 16) {
            // Mode 16→32 : Ajouter groupe 5, masquer groupes 1,2
            this.showGroup5();
            this.hideGroups([1, 2]);
        } else if (steps === 16 && oldSteps === 32) {
            // Mode 32→16 : Masquer groupe 5, montrer groupes 1,2
            this.hideGroup5();
            this.showGroups([1, 2]);
        }
        
        // AJUSTER SÉLECTION si groupe plus disponible
        if (this.selectedGroup && !this.isGroupAvailable(this.selectedGroup)) {
            const availableSequencerGroups = this.getAvailableGroups()
                .filter(gId => this.groups[gId].hasSequencer);
            
            this.selectedGroup = availableSequencerGroups[0] || this.getAvailableGroups()[0];
        }
        
        // RÉACTIVER séquenceur si était activé
        if (this.sequencerToggle) {
            const activeGroup = this.getActiveSequencerGroup();
            this.activateSequencerForGroup(activeGroup);
        }
        
        this.updateInterface();
    },

    // MÉTHODES POUR GÉRER GROUPE 5
    showGroup5() {
        const groupsGrid = document.querySelector('.groups-grid');
        if (groupsGrid && !document.querySelector('[data-group="5"]')) {
            const group5Btn = document.createElement('button');
            group5Btn.className = 'group-btn';
            group5Btn.dataset.group = '5';
            group5Btn.textContent = this.groups[5].name;
            groupsGrid.appendChild(group5Btn);
        }
    },

    hideGroup5() {
        const group5Btn = document.querySelector('[data-group="5"]');
        if (group5Btn) {
            group5Btn.remove();
        }
    },

    hideGroups(groupIds) {
        groupIds.forEach(groupId => {
            const btn = document.querySelector(`[data-group="${groupId}"]`);
            if (btn) {
                btn.style.display = 'none';
                btn.disabled = true;
            }
        });
    },

    showGroups(groupIds) {
        groupIds.forEach(groupId => {
            const btn = document.querySelector(`[data-group="${groupId}"]`);
            if (btn) {
                btn.style.display = '';
                btn.disabled = false;
            }
        });
    },

    // VÉRIFIER DISPONIBILITÉ GROUPE
    isGroupAvailable(groupId) {
        return this.groups[groupId].availableInModes.includes(this.sequencerSteps);
    },

    // SÉQUENCEUR ACTIVATION/DÉSACTIVATION
    activateSequencerForGroup(groupId) {
        const group = this.groups[groupId];
        
        // Envoyer highlights séquenceur
        window.dispatchEvent(new CustomEvent('sequencer-highlights-active', {
            detail: { 
                sequencerPads: group.pads,
                groupId: groupId,
                steps: this.sequencerSteps
            }
        }));
        
        // Notifier couleurs inaccessibles
        window.dispatchEvent(new CustomEvent('sequencer-colors-disabled', {
            detail: { groupId }
        }));
        
        // Config séquenceur
        window.dispatchEvent(new CustomEvent('sequencer-config-update', {
            detail: { 
                groupId,
                steps: this.sequencerSteps,
                sequencerPads: group.pads,
                enabled: true
            }
        }));
        
        // CONTRÔLES SPÉCIFIQUES à ce groupe
        window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
            detail: { 
                active: true,
                controlButtons: group.controls
            }
        }));
    },

    deactivateSequencer() {
        // Nettoyer tout
        window.dispatchEvent(new CustomEvent('clear-sequencer-highlights'));
        window.dispatchEvent(new CustomEvent('sequencer-colors-enabled'));
        window.dispatchEvent(new CustomEvent('sequencer-deactivated'));
        window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
            detail: { active: false }
        }));
    },

    // UTILITAIRES
    getActiveSequencerGroup() {
        // En mode 32 : groupe 5, en mode 16 : groupe sélectionné
        if (this.sequencerSteps === 32) {
            return 5;
        } else {
            // Groupe sélectionné s'il a séquenceur, sinon premier disponible avec séquenceur
            if (this.selectedGroup && this.groups[this.selectedGroup].hasSequencer) {
                return this.selectedGroup;
            } else {
                const availableWithSequencer = this.getAvailableGroups()
                    .filter(gId => this.groups[gId].hasSequencer);
                return availableWithSequencer[0] || null;
            }
        }
    },

    // ASSIGNATION COULEUR GROUPE
    handleGroupColorRequest(groupId, color) {
        if (this.isColorAllowed(groupId)) {
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
        // Couleurs interdites si séquenceur actif sur ce groupe
        if (this.sequencerToggle && this.groups[groupId].hasSequencer) {
            const activeSequencerGroup = this.getActiveSequencerGroup();
            return groupId !== activeSequencerGroup;
        }
        return true;
    },

    // INTERFACE
    updateInterface() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const groupId = parseInt(btn.dataset.group);
            
            btn.classList.toggle('active', groupId === this.selectedGroup);
            btn.classList.toggle('sequencer-active', 
                this.sequencerToggle && groupId === this.getActiveSequencerGroup()
            );
        });
    },

    // API PUBLIQUE
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
    }
};

// EXPORT GLOBAL
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}