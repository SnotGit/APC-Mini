const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    sequencerToggle: false,
    sequencerSteps: 16,
    isInitialized: false,

    // MAPPING GROUPES
    groups: {
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
        5: {
            name: 'GROUPE 5',
            pads: [57,58,59,60,61,62,63,64,49,50,51,52,53,54,55,56,41,42,43,44,45,46,47,48,33,34,35,36,37,38,39,40],
            hasSequencer: true,
            controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' }
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

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const groupBtn = e.target.closest('.group-btn');
            if (groupBtn && !groupBtn.disabled) {
                const groupId = parseInt(groupBtn.dataset.group);
                this.handleGroupClick(groupId);
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

    // ===== GESTION CLICS GROUPES =====
    handleGroupClick(groupId) {
        if (!this.isGroupSelectable(groupId)) {
            return;
        }

        if (this.selectedGroup === groupId) {
            if (this.hasGroupAssignments(groupId)) {
                this.selectGroup(groupId);
            } else {
                this.deselectGroup();
            }
        } else {
            this.selectGroup(groupId);
        }
    },

    selectGroup(groupId) {
        this.selectedGroup = groupId;
        this.updateInterface();
        
        window.dispatchEvent(new CustomEvent('group-selected', {
            detail: { 
                groupId,
                groupPads: this.getEffectivePads(groupId),
                hasSequencer: this.groups[groupId].hasSequencer,
                sequencerEnabled: this.sequencerToggle && this.isSequencerActiveForGroup(groupId)
            }
        }));
        
        if (!this.sequencerToggle || this.isSequencerActiveForGroup(groupId)) {
            window.dispatchEvent(new CustomEvent('highlight-group', {
                detail: { 
                    groupPads: this.getEffectivePads(groupId),
                    groupId
                }
            }));
        }
    },

    deselectGroup() {
        this.selectedGroup = null;
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

    // ===== LOGIQUE GROUPES =====
    getActiveSequencerGroup() {
        if (this.sequencerSteps === 32) {
            return 5;
        } else {
            if (this.selectedGroup && this.groups[this.selectedGroup].hasSequencer) {
                return this.selectedGroup;
            } else {
                return [1, 2].find(gId => this.groups[gId].hasSequencer) || null;
            }
        }
    },

    getEffectivePads(groupId) {
        const allPads = this.groups[groupId].pads;
        const occupiedControls = this.getOccupiedControlPads();
        return allPads.filter(pad => !occupiedControls.includes(pad));
    },

    getAvailablePadsForGroup(groupId) {
        return this.getEffectivePads(groupId);
    },

    getOccupiedControlPads() {
        if (!this.sequencerToggle) return [];
        
        const activeGroup = this.getActiveSequencerGroup();
        if (!activeGroup) return [];
        
        const controls = this.groups[activeGroup].controls;
        return Object.keys(controls).map(Number);
    },

    isSequencerActiveForGroup(groupId) {
        return this.sequencerToggle && this.getActiveSequencerGroup() === groupId;
    },

    // ===== ASSIGNATION COULEUR GROUPE =====
    handleGroupColorRequest(groupId, color) {
        if (this.isColorAllowed(groupId)) {
            window.dispatchEvent(new CustomEvent('apply-group-color', {
                detail: { 
                    groupPads: this.getEffectivePads(groupId),
                    color,
                    groupId 
                }
            }));
        }
    },

    isColorAllowed(groupId) {
        if (this.sequencerToggle && this.groups[groupId].hasSequencer) {
            const activeSequencerGroup = this.getActiveSequencerGroup();
            return groupId !== activeSequencerGroup;
        }
        return true;
    },

    // ===== INTERFACE =====
    updateInterface() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const groupId = parseInt(btn.dataset.group);
            
            btn.classList.remove('active', 'sequencer-active', 'mode-32-visual', 'assigned-green', 'assigned-yellow', 'assigned-red');
            btn.disabled = false;
            
            const assignedColor = this.getGroupAssignedColor(groupId);
            if (assignedColor) {
                btn.classList.add(`assigned-${assignedColor}`);
            }
            
            if (groupId === this.selectedGroup) {
                btn.classList.add('active');
            }
            
            if (this.sequencerToggle && groupId === this.getActiveSequencerGroup()) {
                btn.classList.add('sequencer-active');
            }
            
            if (this.sequencerSteps === 32 && (groupId === 1 || groupId === 2)) {
                btn.classList.add('mode-32-visual');
                btn.disabled = true;
            } else if (!this.isGroupSelectable(groupId)) {
                btn.disabled = true;
                btn.classList.add('zone-conflict');
            }
        });
    },

    // ===== PROTECTION CROISÉE =====
    isGroupSelectable(groupId) {
        if (this.sequencerSteps === 32 && (groupId === 1 || groupId === 2)) {
            return false;
        }
        
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

    getGroupAssignedColor(groupId) {
        if (window.PadsContent && window.PadsContent.groupAssignments) {
            return window.PadsContent.groupAssignments[groupId] || null;
        }
        return null;
    },

    // ===== PERSISTANCE =====
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

if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}