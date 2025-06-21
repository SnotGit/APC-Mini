const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,
    sequencerEnabled: false,
    steps: 16, // 16 ou 32

    // ===== GROUPES MAPPING =====
    groups: {
        1: { name: 'GROUPE 1', pads: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28] },
        2: { name: 'GROUPE 2', pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] },
        3: { name: 'GROUPE 3', pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64] },
        4: { name: 'GROUPE 4', pads: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32] }
    },

    // ===== SÉQUENCEUR MAPPING =====
    sequencerGroups: {
        2: { 
            steps: 16, 
            pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60],
            controlPads: [25,26,27,28]
        },
        3: { 
            steps: 16, 
            pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64],
            controlPads: [29,30,31,32]
        },
        5: { 
            steps: 32, 
            pads: [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],
            controlPads: [25,26,27,28]
        }
    },

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="groups-section">
                <button class="group-btn" data-group="1">GROUPE 1</button>
                <button class="group-btn" data-group="2">GROUPE 2</button>
                <button class="group-btn" data-group="3">GROUPE 3</button>
                <button class="group-btn" data-group="4">GROUPE 4</button>
                
                <div class="sequencer-section">
                    <label class="sequencer-toggle">
                        <input type="checkbox" id="sequencerToggle">
                        Activer Séquenceur
                    </label>
                    
                    <div class="steps-switch" id="stepsSwitch" style="display: none;">
                        <div class="switch-label">16 steps</div>
                        <label class="slider-switch">
                            <input type="checkbox" id="stepsToggle">
                            <span class="slider"></span>
                        </label>
                        <div class="switch-label">32 steps</div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        this.setupEventListeners();
        this.updateSequencerState();
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

        // Toggle séquenceur
        document.addEventListener('change', (e) => {
            if (e.target.id === 'sequencerToggle') {
                this.toggleSequencer(e.target.checked);
            }
            if (e.target.id === 'stepsToggle') {
                const steps = e.target.checked ? 32 : 16;
                this.setSteps(steps);
            }
        });
    },

    // ===== SÉLECTION GROUPE =====
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        // Mettre à jour boutons
        this.updateGroupButtons();
        
        // Mettre à jour état séquenceur
        this.updateSequencerState();
        
        // Notifier highlight du groupe dans pads-content
        const groupPads = this.groups[groupId].pads;
        window.dispatchEvent(new CustomEvent('highlight-group', {
            detail: { groupPads }
        }));
    },

    updateGroupButtons() {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const groupId = parseInt(btn.dataset.group);
            btn.classList.toggle('active', groupId === this.selectedGroup);
        });
    },

    // ===== SÉQUENCEUR =====
    toggleSequencer(enabled) {
        this.sequencerEnabled = enabled;
        
        // Déterminer le groupe séquenceur actif
        const sequencerGroupId = this.getActiveSequencerGroup();
        
        if (enabled && sequencerGroupId) {
            // Notifier activation séquenceur
            window.dispatchEvent(new CustomEvent('sequencer-activated', {
                detail: { 
                    groupId: sequencerGroupId,
                    activated: true,
                    steps: this.steps
                }
            }));
        } else if (!enabled) {
            // Notifier désactivation
            window.dispatchEvent(new CustomEvent('sequencer-activated', {
                detail: { 
                    groupId: null,
                    activated: false 
                }
            }));
        }
        
        this.updateSequencerState();
    },

    setSteps(steps) {
        this.steps = steps;
        
        // Si séquenceur actif, notifier changement de steps
        if (this.sequencerEnabled) {
            const sequencerGroupId = this.getActiveSequencerGroup();
            if (sequencerGroupId) {
                window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
                    detail: { 
                        groupId: sequencerGroupId,
                        steps: this.steps
                    }
                }));
            }
        }
        
        // Sauvegarder config
        if (window.App && window.App.updateConfig) {
            window.App.updateConfig('sequencer', { steps });
        }
    },

    getActiveSequencerGroup() {
        // Groupe séquenceur selon interface + steps
        if (!this.selectedGroup || (this.selectedGroup !== 2 && this.selectedGroup !== 3)) {
            return null;
        }
        
        if (this.steps === 32) {
            return 5; // Groupe fantôme 32 steps
        } else {
            return this.selectedGroup; // Groupe interface (2 ou 3)
        }
    },

    updateSequencerState() {
        const toggle = document.getElementById('sequencerToggle');
        const stepsSwitch = document.getElementById('stepsSwitch');
        
        if (toggle && stepsSwitch) {
            // Séquenceur disponible seulement pour groupes 2 et 3
            const canUseSequencer = this.selectedGroup === 2 || this.selectedGroup === 3;
            
            toggle.disabled = !canUseSequencer;
            
            if (!canUseSequencer) {
                toggle.checked = false;
                this.sequencerEnabled = false;
            }
            
            // Afficher switch steps si séquenceur activé ET groupe compatible
            const showSteps = this.sequencerEnabled && canUseSequencer;
            stepsSwitch.style.display = showSteps ? 'flex' : 'none';
        }
    },

    // ===== COULEURS GROUPES =====
    applyGroupColor(color) {
        if (!this.selectedGroup) return;
        
        const groupPads = this.groups[this.selectedGroup].pads;
        
        // Vérifier si séquenceur actif (pas de coloration libre)
        const isSequencerGroup = this.selectedGroup === 2 || this.selectedGroup === 3;
        if (isSequencerGroup && this.sequencerEnabled) {
            return; // Pas de coloration en mode séquenceur
        }
        
        // Appliquer couleur au groupe
        window.dispatchEvent(new CustomEvent('apply-group-color', {
            detail: { groupPads, color }
        }));
    },

    // ===== GETTERS =====
    getSelectedGroup() {
        return this.selectedGroup;
    },

    isSequencerActive() {
        return this.sequencerEnabled;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}