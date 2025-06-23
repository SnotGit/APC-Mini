const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    displayGroupId: null,
    sequencerToggle: false,
    sequencerSteps: 16,
    activeSequencerGroup: null,
    isInitialized: false,

    // ===== MAPPING 7 GROUPES CONDITIONNELS =====
    groups: {
        1: { name: 'GROUPE 1', pads: [57,58,59,60,49,50,51,52,41,42,43,44,33,34,35,36], hasSequencer: true, controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' } },
        2: { name: 'GROUPE 2', pads: [61,62,63,64,53,54,55,56,45,46,47,48,37,38,39,40], hasSequencer: true, controls: { 29: null, 30: 'green', 31: 'yellow', 32: 'red' } },
        3: { name: 'GROUPE 3', pads: [25,26,27,28,17,18,19,20,9,10,11,12,1,2,3,4], hasSequencer: false, controls: {} },
        4: { name: 'GROUPE 4', pads: [29,30,31,32,21,22,23,24,13,14,15,16,5,6,7,8], hasSequencer: false, controls: {} },
        5: { name: 'GROUPE 5', pads: [57,58,59,60,61,62,63,64,49,50,51,52,53,54,55,56,41,42,43,44,45,46,47,48,33,34,35,36,37,38,39,40], hasSequencer: true, controls: { 25: null, 26: 'green', 27: 'yellow', 28: 'red' } },
        6: { name: 'GROUPE 6', pads: [17,18,19,20,9,10,11,12,1,2,3,4], hasSequencer: false, controls: {} },
        7: { name: 'GROUPE 7', pads: [21,22,23,24,13,14,15,16,5,6,7,8], hasSequencer: false, controls: {} }
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
                <div id="sequencerModeContainer"></div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        this.setupEventListeners();
        if (window.SequencerMode?.init) window.SequencerMode.init();
        this.isInitialized = true;
    },

    // ===== MAPPING CONDITIONNEL =====
    getEffectiveGroupId(displayId) {
        const mapping = {
            3: this.activeSequencerGroup === 1 || this.activeSequencerGroup === 5 ? 6 : 3,
            4: this.activeSequencerGroup === 2 ? 7 : 4
        };
        
        return mapping[displayId] || displayId;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.group-btn');
            if (btn && !btn.disabled) {
                this.handleGroupClick(parseInt(btn.dataset.group));
            }
        });

        window.addEventListener('sequencer-toggle-changed', (e) => this.handleSequencerToggle(e.detail.enabled, e.detail.groupId));
        window.addEventListener('sequencer-steps-changed', (e) => this.handleStepsChange(e.detail.steps));
        window.addEventListener('group-color-request', (e) => this.handleGroupColorRequest(e.detail.groupId, e.detail.color));
        window.addEventListener('group-assigned', () => this.updateInterface());
        window.addEventListener('pad-assigned', () => this.updateInterface());
    },

    // ===== GESTION CLICS GROUPES =====
    handleGroupClick(displayId) {
        const effectiveId = this.getEffectiveGroupId(displayId);
        
        // Log sélection via système centralisé
        if (window.ConsoleLogs) {
            if (effectiveId !== displayId) {
                window.ConsoleLogs.logGroup('mapping', { 
                    displayGroupId: displayId, 
                    effectiveGroupId: effectiveId, 
                    reason: 'conflit contrôles' 
                });
            }
        }
        
        if (!this.isGroupSelectable(effectiveId, displayId)) {
            // Log blocage
            if (window.ConsoleLogs) {
                window.ConsoleLogs.logGroup('blocked', { 
                    groupId: displayId, 
                    reason: this.getBlockageReason(effectiveId, displayId) 
                });
            }
            return;
        }

        if (this.selectedGroup === effectiveId) {
            this.hasGroupAssignments(effectiveId) ? this.selectGroup(effectiveId, displayId) : this.deselectGroup();
        } else {
            this.selectGroup(effectiveId, displayId);
        }
    },

    selectGroup(effectiveId, displayId) {
        this.selectedGroup = effectiveId;
        this.displayGroupId = displayId;
        const group = this.groups[effectiveId];
        
        // Log sélection
        if (window.ConsoleLogs) {
            window.ConsoleLogs.logGroup('selected', { 
                groupId: effectiveId, 
                displayGroupId: displayId, 
                padCount: group.pads.length 
            });
        }
        
        window.dispatchEvent(new CustomEvent('group-selected', {
            detail: { 
                groupId: effectiveId, 
                displayGroupId: displayId, 
                groupPads: group.pads, 
                hasSequencer: group.hasSequencer, 
                sequencerEnabled: false 
            }
        }));
        
        if (this.activeSequencerGroup !== effectiveId) {
            window.dispatchEvent(new CustomEvent('highlight-group', { 
                detail: { groupPads: group.pads, groupId: effectiveId } 
            }));
        }
        
        this.updateInterface();
    },

    deselectGroup() {
        // Log déselection
        if (window.ConsoleLogs) {
            window.ConsoleLogs.logGroup('deselected', {});
        }
        
        this.selectedGroup = null;
        this.displayGroupId = null;
        this.updateInterface();
        window.dispatchEvent(new CustomEvent('clear-selection'));
    },

    // ===== GESTION SÉQUENCEUR =====
    handleSequencerToggle(enabled, groupId) {
        this.sequencerToggle = enabled;
        
        if (enabled) {
            const targetGroup = this.getSequencerTargetGroup();
            this.activateSequencerForGroup(targetGroup);
        } else {
            this.deactivateSequencer();
        }
        
        this.updateInterface();
    },

    handleStepsChange(steps) {
        const wasActive = this.sequencerToggle;
        this.sequencerSteps = steps;
        
        if (wasActive) {
            this.deactivateSequencer();
            this.activateSequencerForGroup(this.getSequencerTargetGroup());
        }
        
        this.updateInterface();
    },

    getSequencerTargetGroup() {
        if (this.sequencerSteps === 32) {
            return 5;
        }
        
        // Si un groupe avec séquenceur est sélectionné, l'utiliser
        if (this.selectedGroup && this.groups[this.selectedGroup]?.hasSequencer) {
            return this.selectedGroup;
        }
        
        // Sinon, utiliser groupe 1 par défaut
        return 1;
    },

    activateSequencerForGroup(groupId) {
        this.activeSequencerGroup = groupId;
        const group = this.groups[groupId];
        
        // Log activation séquenceur
        if (window.ConsoleLogs) {
            window.ConsoleLogs.logSequencer('activated', { 
                groupId, 
                padCount: group.pads.length 
            });
        }
        
        window.dispatchEvent(new CustomEvent('sequencer-activate', {
            detail: { 
                groupId, 
                steps: this.sequencerSteps,
                pads: group.pads, 
                controls: group.controls,
                enabled: true
            }
        }));
    },

    deactivateSequencer() {
        this.activeSequencerGroup = null;
        window.dispatchEvent(new CustomEvent('sequencer-deactivate'));
    },

    // ===== ASSIGNATION COULEUR =====
    handleGroupColorRequest(groupId, color) {
        if (this.isColorAllowed(groupId)) {
            // Log assignation
            if (window.ConsoleLogs) {
                window.ConsoleLogs.logGroup('assigned', { 
                    groupId, 
                    color: color || 'effacé', 
                    padCount: this.groups[groupId]?.pads.length || 0 
                });
            }
            
            window.dispatchEvent(new CustomEvent('apply-group-color', {
                detail: { groupPads: this.groups[groupId].pads, color, groupId }
            }));
        } else {
            // Log blocage assignation
            if (window.ConsoleLogs) {
                window.ConsoleLogs.logGroup('assignment-blocked', { 
                    groupId, 
                    reason: 'séquenceur actif' 
                });
            }
        }
    },

    isColorAllowed(groupId) {
        return this.activeSequencerGroup !== groupId;
    },

    // ===== PROTECTION =====
    isGroupSelectable(groupId, displayId) {
        return !(this.sequencerSteps === 32 && (displayId === 1 || displayId === 2)) && 
               !this.hasIndividualPadsInZone(groupId);
    },

    hasIndividualPadsInZone(groupId) {
        if (!window.PadsContent) return false;
        return this.groups[groupId].pads.some(padNumber => {
            const padColor = window.PadsContent.getPadColor(padNumber);
            const isGroupAssigned = window.PadsContent.groupAssignments?.[groupId];
            return padColor && !isGroupAssigned;
        });
    },

    getBlockageReason(effectiveId, displayId) {
        if (this.sequencerSteps === 32 && (displayId === 1 || displayId === 2)) {
            return 'mode 32 steps actif';
        }
        if (this.hasIndividualPadsInZone(effectiveId)) {
            return 'pads individuels dans la zone';
        }
        return 'non disponible';
    },

    // ===== INTERFACE =====
    updateInterface() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const displayId = parseInt(btn.dataset.group);
            const effectiveId = this.getEffectiveGroupId(displayId);
            
            // Reset classes
            btn.className = 'group-btn';
            btn.disabled = false;
            
            // États
            const assignedColor = this.getGroupAssignedColor(effectiveId);
            if (assignedColor) btn.classList.add(`assigned-${assignedColor}`);
            if (effectiveId === this.selectedGroup) btn.classList.add('active');
            if (this.activeSequencerGroup === effectiveId) btn.classList.add('sequencer-active');
            
            // Restrictions
            if (this.sequencerSteps === 32 && (displayId === 1 || displayId === 2)) {
                btn.classList.add('mode-32-visual');
                btn.disabled = true;
            } else if (!this.isGroupSelectable(effectiveId, displayId)) {
                btn.classList.add('zone-conflict');
                btn.disabled = true;
            }
        });
    },

    // ===== HELPERS =====
    getGroupAssignedColor(groupId) {
        return window.PadsContent?.groupAssignments?.[groupId] || null;
    },

    hasGroupAssignments(groupId) {
        return window.PadsContent?.hasGroupAssignments?.(groupId) || false;
    },

    // ===== API PUBLIQUE =====
    getSelectedGroup() { return this.selectedGroup; },
    getDisplayGroupId() { return this.displayGroupId; },
    getActiveSequencerGroup() { return this.activeSequencerGroup; },
    getGroupPads(groupId) { return this.groups[groupId]?.pads || []; },
    isSequencerEnabled() { return this.sequencerToggle; },
    getSequencerSteps() { return this.sequencerSteps; }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}