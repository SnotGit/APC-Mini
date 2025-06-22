const SequencerMode = {

    // ===== ÉTAT =====
    enabled: false,
    steps: 16, // 16 ou 32
    activeGroupId: null,

    // ===== SÉQUENCEUR MAPPING =====
    sequencerGroups: {
        1: { 
            steps: 16, 
            pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60],
            controlPads: [25,26,27,28]
        },
        2: { 
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
            <div class="sequencer-section">
                <label class="sequencer-toggle">
                    <input type="checkbox" id="sequencerToggle">
                    Séquenceur
                    
                    <div class="steps-switch" id="stepsSwitch" style="display: none;">
                        <div class="switch-label">16</div>
                        <label class="slider-switch">
                            <input type="checkbox" id="stepsToggle">
                            <span class="slider"></span>
                        </label>
                        <div class="switch-label">32</div>
                    </div>
                </label>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        const container = document.getElementById('sequencerModeContainer');
        if (container) {
            container.innerHTML = this.create();
            this.setupEventListeners();
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
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

        // Écouter sélection groupe depuis groups-mode
        window.addEventListener('group-selected', (event) => {
            const { groupId } = event.detail;
            this.updateSequencerState(groupId);
        });
    },

    // ===== SÉQUENCEUR =====
    toggleSequencer(enabled) {
        this.enabled = enabled;
        
        if (enabled && this.canUseSequencer()) {
            this.activeGroupId = this.getActiveSequencerGroup();
            
            // Notifier activation séquenceur
            window.dispatchEvent(new CustomEvent('sequencer-activated', {
                detail: { 
                    groupId: this.activeGroupId,
                    activated: true,
                    steps: this.steps
                }
            }));
            
            // Allumer highlight blanc des pads
            this.highlightSequencerPads(true);
            
        } else {
            this.activeGroupId = null;
            
            // Notifier désactivation
            window.dispatchEvent(new CustomEvent('sequencer-activated', {
                detail: { 
                    groupId: null,
                    activated: false 
                }
            }));
            
            // Éteindre highlight blanc des pads
            this.highlightSequencerPads(false);
        }
        
        // Notifier groups-mode du changement d'état
        window.dispatchEvent(new CustomEvent('sequencer-state-changed', {
            detail: { 
                enabled: this.enabled, 
                groupId: this.activeGroupId 
            }
        }));
    },

    setSteps(steps) {
        this.steps = steps;
        
        // Si séquenceur actif, mettre à jour
        if (this.enabled) {
            this.activeGroupId = this.getActiveSequencerGroup();
            
            window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
                detail: { 
                    groupId: this.activeGroupId,
                    steps: this.steps
                }
            }));
            
            // Mettre à jour highlight des pads
            this.highlightSequencerPads(true);
        }
        
        // Sauvegarder config
        if (window.App && window.App.updateConfig) {
            window.App.updateConfig('sequencer', { steps });
        }
    },

    highlightSequencerPads(enabled) {
        if (enabled) {
            const padNumbers = this.getSequencerPads();
            window.dispatchEvent(new CustomEvent('sequencer-pads-highlight', {
                detail: { padNumbers, enabled: true }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('sequencer-pads-highlight', {
                detail: { padNumbers: [], enabled: false }
            }));
        }
    },

    // ===== UTILITAIRES =====
    updateSequencerState(selectedGroupId) {
        const toggle = document.getElementById('sequencerToggle');
        const stepsSwitch = document.getElementById('stepsSwitch');
        
        if (toggle && stepsSwitch) {
            // Séquenceur disponible seulement pour groupes 1 et 2
            const canUse = selectedGroupId === 1 || selectedGroupId === 2;
            
            toggle.disabled = !canUse;
            
            if (!canUse) {
                toggle.checked = false;
                this.enabled = false;
                this.activeGroupId = null;
            }
            
            // Afficher switch steps si séquenceur activé ET groupe compatible
            const showSteps = this.enabled && canUse;
            stepsSwitch.style.display = showSteps ? 'flex' : 'none';
        }
    },

    canUseSequencer() {
        const selectedGroup = window.GroupsMode ? window.GroupsMode.getSelectedGroup() : null;
        return selectedGroup === 1 || selectedGroup === 2;
    },

    getActiveSequencerGroup() {
        const selectedGroup = window.GroupsMode ? window.GroupsMode.getSelectedGroup() : null;
        
        if (!this.canUseSequencer()) {
            return null;
        }
        
        if (this.steps === 32) {
            return 5; // Groupe fantôme 32 steps
        } else {
            return selectedGroup; // Groupe interface (1 ou 2)
        }
    },

    getSequencerPads() {
        const selectedGroup = window.GroupsMode ? window.GroupsMode.getSelectedGroup() : null;
        
        if (!this.canUseSequencer()) {
            return [];
        }
        
        if (this.steps === 32) {
            // 32 steps = groupe 1 + groupe 2
            const group1Pads = window.GroupsMode.getGroupPads(1);
            const group2Pads = window.GroupsMode.getGroupPads(2);
            return [...group1Pads, ...group2Pads];
        } else {
            // 16 steps = groupe sélectionné
            return window.GroupsMode.getGroupPads(selectedGroup);
        }
    },

    // ===== GETTERS =====
    isEnabled() {
        return this.enabled;
    },

    isActiveOnGroup(groupId) {
        return this.enabled && (this.activeGroupId === groupId || this.activeGroupId === 5);
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.SequencerMode = SequencerMode;
}