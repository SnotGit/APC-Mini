const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    displayGroupId: null,
    sequencerToggle: false,
    sequencerSteps: 16,
    isInitialized: false,

    // ===== NOUVEAU MAPPING 7 GROUPES CONDITIONNELS =====
    groups: {
        // GROUPES SÉQUENCEUR (16 pads avec contrôles)
        1: { 
            name: 'GROUPE 1', 
            pads: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36],
            hasSequencer: true,
            controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }
        },
        2: { 
            name: 'GROUPE 2', 
            pads: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40],
            hasSequencer: true,
            controls: { 29: null, 30: 'green', 31: 'yellow', 32: 'red' }
        },
        
        // GROUPES STANDARDS (16 pads complets)
        3: { 
            name: 'GROUPE 3', 
            pads: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4],
            hasSequencer: false,
            controls: {}
        },
        4: { 
            name: 'GROUPE 4', 
            pads: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8],
            hasSequencer: false,
            controls: {}
        },
        
        // GROUPE MODE 32 (fusion groupes 1+2)
        5: {
            name: 'GROUPE 5',
            pads: [57,58,59,60,61,62,63,64,49,50,51,52,53,54,55,56,41,42,43,44,45,46,47,48,33,34,35,36,37,38,39,40],
            hasSequencer: true,
            controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }
        },
        
        // GROUPES RÉDUITS (sans contrôles conflictuels)
        6: {
            name: 'GROUPE 6', 
            pads: [17,18,19,20,9,10,11,12,1,2,3,4], // 12 pads (groupe 3 sans contrôles)
            hasSequencer: false,
            controls: {}
        },
        7: {
            name: 'GROUPE 7',
            pads: [21,22,23,24,13,14,15,16,5,6,7,8], // 12 pads (groupe 4 sans contrôles)
            hasSequencer: false,
            controls: {}
        }
    },

    // ===== CRÉATION TEMPLATE (INCHANGÉ - 4 BOUTONS) =====
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
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        
        if (window.SequencerMode && window.SequencerMode.init) {
            window.SequencerMode.init();
        }
        
        this.isInitialized = true;
    },

    // ===== NOUVEAU MAPPING CONDITIONNEL =====
    getEffectiveGroupId(displayGroupId) {
        // Interface affiche 1,2,3,4 mais mapping réel conditionnel
        
        if (displayGroupId === 3) {
            // Bouton "GROUPE 3" → mappe vers groupe 6 si conflits contrôles
            if (this.hasControlsConflict(3)) {
                return 6; // Mapping vers 12 pads
            }
            return 3; // Mapping normal 16 pads
        }
        
        if (displayGroupId === 4) {
            // Bouton "GROUPE 4" → mappe vers groupe 7 si conflits contrôles  
            if (this.hasControlsConflict(4)) {
                return 7; // Mapping vers 12 pads
            }
            return 4; // Mapping normal 16 pads
        }
        
        // Groupes 1,2 = mapping direct
        return displayGroupId;
    },

    // ===== DÉTECTION CONFLITS SIMPLIFIÉE =====
    hasControlsConflict(displayGroupId) {
        if (displayGroupId === 3) {
            // Groupe 3 a conflit si groupe 1 ou 5 séquenceur actif
            const activeSequencer = this.getActiveSequencerGroup();
            return activeSequencer === 1 || activeSequencer === 5;
        }
        
        if (displayGroupId === 4) {
            // Groupe 4 a conflit si groupe 2 séquenceur actif
            const activeSequencer = this.getActiveSequencerGroup();
            return activeSequencer === 2;
        }
        
        return false;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const groupBtn = e.target.closest('.group-btn');
            if (groupBtn && !groupBtn.disabled) {
                const displayGroupId = parseInt(groupBtn.dataset.group);
                this.handleGroupClick(displayGroupId);
            }
        });

        window.addEventListener('sequencer-toggle-changed', (event) => {
            const { enabled, groupId } = event.detail;
            this.handleSequencerToggle(enabled, groupId);
        });

        window.addEventListener('sequencer-steps-changed', (event) => {
            const { steps } = event.detail;
            this.handleStepsChange(steps);
        });

        window.addEventListener('group-color-request', (event) => {
            const { groupId, color } = event.detail;
            this.handleGroupColorRequest(groupId, color);
        });

        window.addEventListener('group-assigned', (event) => {
            this.updateInterface();
        });

        window.addEventListener('pad-assigned', (event) => {
            this.updateInterface();
        });
    },

    // ===== GESTION CLICS GROUPES REFACTORISÉE =====
    handleGroupClick(displayGroupId) {
        // Utiliser mapping effectif selon contexte
        const effectiveGroupId = this.getEffectiveGroupId(displayGroupId);
        
        if (!this.isGroupSelectable(effectiveGroupId)) {
            return;
        }

        if (this.selectedGroup === effectiveGroupId) {
            if (this.hasGroupAssignments(effectiveGroupId)) {
                this.selectGroup(effectiveGroupId, displayGroupId);
            } else {
                this.deselectGroup();
            }
        } else {
            this.selectGroup(effectiveGroupId, displayGroupId);
        }
    },

    selectGroup(effectiveGroupId, displayGroupId) {
        this.selectedGroup = effectiveGroupId;
        this.displayGroupId = displayGroupId;
        this.updateInterface();
        
        const group = this.groups[effectiveGroupId];
        
        window.dispatchEvent(new CustomEvent('group-selected', {
            detail: { 
                groupId: effectiveGroupId,
                displayGroupId: displayGroupId,
                groupPads: group.pads,
                hasSequencer: group.hasSequencer,
                sequencerEnabled: this.sequencerToggle && this.isSequencerActiveForGroup(effectiveGroupId)
            }
        }));
        
        if (!this.sequencerToggle || !this.isSequencerActiveForGroup(effectiveGroupId)) {
            window.dispatchEvent(new CustomEvent('highlight-group', {
                detail: { 
                    groupPads: group.pads,
                    groupId: effectiveGroupId
                }
            }));
        }
    },

    deselectGroup() {
        this.selectedGroup = null;
        this.displayGroupId = null;
        this.updateInterface();
        
        window.dispatchEvent(new CustomEvent('clear-selection'));
    },

    // ===== GESTION TOGGLE SÉQUENCEUR =====
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

    // ===== GESTION SWITCH 16/32 STEPS =====
    handleStepsChange(steps) {
        const wasActive = this.sequencerToggle;
        this.sequencerSteps = steps;
        
        if (wasActive) {
            this.deactivateSequencer();
            const activeGroup = this.getActiveSequencerGroup();
            this.activateSequencerForGroup(activeGroup);
        }
        
        this.updateInterface();
    },

    // ===== RESTRICTION SWITCH 32 =====
    canSwitch32() {
        // Switch 32 bloqué si groupes 1 ou 2 assignés
        const group1Assigned = this.getGroupAssignedColor(1);
        const group2Assigned = this.getGroupAssignedColor(2);
        
        return !group1Assigned && !group2Assigned;
    },

    // ===== SÉQUENCEUR ACTIVATION/DÉSACTIVATION =====
    activateSequencerForGroup(groupId) {
        const group = this.groups[groupId];
        
        window.dispatchEvent(new CustomEvent('sequencer-highlights-active', {
            detail: { 
                sequencerPads: group.pads,
                groupId: groupId,
                steps: this.sequencerSteps
            }
        }));
        
        window.dispatchEvent(new CustomEvent('sequencer-colors-disabled', {
            detail: { groupId }
        }));
        
        window.dispatchEvent(new CustomEvent('sequencer-config-update', {
            detail: { 
                groupId,
                steps: this.sequencerSteps,
                sequencerPads: group.pads,
                enabled: true
            }
        }));
        
        window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
            detail: { 
                active: true,
                controlButtons: group.controls
            }
        }));
    },

    deactivateSequencer() {
        window.dispatchEvent(new CustomEvent('clear-sequencer-highlights'));
        window.dispatchEvent(new CustomEvent('sequencer-colors-enabled'));
        window.dispatchEvent(new CustomEvent('sequencer-deactivated'));
        window.dispatchEvent(new CustomEvent('sequencer-controls-active', {
            detail: { active: false }
        }));
    },

    // ===== LOGIQUE GROUPES SIMPLIFIÉE =====
    getActiveSequencerGroup() {
        if (this.sequencerSteps === 32) {
            return 5; // Toujours groupe 5 pour mode 32
        } else {
            // Mode 16 : utiliser groupe sélectionné si compatible, sinon défaut
            if (this.selectedGroup && this.groups[this.selectedGroup].hasSequencer) {
                return this.selectedGroup;
            } else {
                return 1; // Groupe par défaut
            }
        }
    },

    isSequencerActiveForGroup(groupId) {
        return this.sequencerToggle && this.getActiveSequencerGroup() === groupId;
    },

    // ===== ASSIGNATION COULEUR GROUPE =====
    handleGroupColorRequest(groupId, color) {
        if (this.isColorAllowed(groupId)) {
            const group = this.groups[groupId];
            
            window.dispatchEvent(new CustomEvent('apply-group-color', {
                detail: { 
                    groupPads: group.pads,
                    color,
                    groupId 
                }
            }));
        }
    },

    isColorAllowed(groupId) {
        // Couleurs bloquées si groupe a séquenceur actif
        if (this.sequencerToggle && this.groups[groupId].hasSequencer) {
            const activeSequencerGroup = this.getActiveSequencerGroup();
            return groupId !== activeSequencerGroup;
        }
        return true;
    },

    // ===== PROTECTION SIMPLIFIÉE =====
    isGroupSelectable(groupId) {
        // Protection simple : Mode 32 bloque groupes 1,2
        if (this.sequencerSteps === 32 && (groupId === 1 || groupId === 2)) {
            return false;
        }
        
        // Protection pads individuels dans zone
        return !this.hasIndividualPadsInZone(groupId);
    },

    hasIndividualPadsInZone(groupId) {
        if (!window.PadsContent) return false;
        
        const groupPads = this.groups[groupId].pads;
        return groupPads.some(padNumber => {
            const padColor = window.PadsContent.getPadColor(padNumber);
            const isGroupAssigned = window.PadsContent.groupAssignments && 
                                  window.PadsContent.groupAssignments[groupId];
            
            return padColor && !isGroupAssigned;
        });
    },

    // ===== INTERFACE SIMPLIFIÉE =====
    updateInterface() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const displayGroupId = parseInt(btn.dataset.group);
            const effectiveGroupId = this.getEffectiveGroupId(displayGroupId);
            
            // Reset toutes les classes
            btn.classList.remove('active', 'sequencer-active', 'mode-32-visual', 
                              'assigned-green', 'assigned-yellow', 'assigned-red', 'zone-conflict');
            btn.disabled = false;
            
            // État assigné couleur
            const assignedColor = this.getGroupAssignedColor(effectiveGroupId);
            if (assignedColor) {
                btn.classList.add(`assigned-${assignedColor}`);
            }
            
            // État sélectionné
            if (effectiveGroupId === this.selectedGroup) {
                btn.classList.add('active');
            }
            
            // État séquenceur actif
            if (this.sequencerToggle && effectiveGroupId === this.getActiveSequencerGroup()) {
                btn.classList.add('sequencer-active');
            }
            
            // Mode 32 : disable groupes 1,2
            if (this.sequencerSteps === 32 && (displayGroupId === 1 || displayGroupId === 2)) {
                btn.classList.add('mode-32-visual');
                btn.disabled = true;
            } 
            // Conflits de zone
            else if (!this.isGroupSelectable(effectiveGroupId)) {
                btn.disabled = true;
                btn.classList.add('zone-conflict');
            }
        });
    },

    // ===== HELPERS =====
    getGroupAssignedColor(groupId) {
        if (window.PadsContent && window.PadsContent.groupAssignments) {
            return window.PadsContent.groupAssignments[groupId] || null;
        }
        return null;
    },

    hasGroupAssignments(groupId) {
        if (window.PadsContent && window.PadsContent.hasGroupAssignments) {
            return window.PadsContent.hasGroupAssignments(groupId);
        }
        return false;
    },

    // ===== API PUBLIQUE =====
    getSelectedGroup() {
        return this.selectedGroup;
    },

    getDisplayGroupId() {
        return this.displayGroupId;
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

    // ===== DEBUGGING =====
    getState() {
        return {
            selectedGroup: this.selectedGroup,
            displayGroupId: this.displayGroupId,
            sequencerToggle: this.sequencerToggle,
            sequencerSteps: this.sequencerSteps,
            activeSequencerGroup: this.getActiveSequencerGroup(),
            canSwitch32: this.canSwitch32()
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}