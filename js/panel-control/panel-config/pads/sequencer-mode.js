const SequencerMode = {

    // ===== ÉTAT =====
    enabled: false,
    steps: 16, // 16 ou 32
    currentGroupId: null,
    isInitialized: false,

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
                
                <!-- NOUVEAU : Feedback restriction switch 32 -->
                <div class="switch-restriction-feedback" id="switchRestrictionFeedback" style="display: none;">
                    <small>Switch 32 bloqué : Groupes 1 ou 2 assignés</small>
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        // Injecter dans container groups-mode
        const container = document.getElementById('sequencerModeContainer');
        if (container) {
            container.innerHTML = this.create();
            this.setupEventListeners();
        }
        
        this.isInitialized = true;
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
            const { groupId, hasSequencer } = event.detail;
            this.updateSequencerAvailability(groupId, hasSequencer);
        });

        // NOUVEAU : Écouter changements assignations groupes
        window.addEventListener('group-assigned', (event) => {
            this.updateSwitchRestrictions();
        });

        window.addEventListener('pad-assigned', (event) => {
            this.updateSwitchRestrictions();
        });
    },

    // ===== TOGGLE SÉQUENCEUR =====
    toggleSequencer(enabled) {
        this.enabled = enabled;
        
        // Notifier groups-mode du changement de toggle
        window.dispatchEvent(new CustomEvent('sequencer-toggle-changed', {
            detail: { 
                enabled: this.enabled, 
                groupId: this.currentGroupId,
                steps: this.steps
            }
        }));
        
        // Mettre à jour interface
        this.updateInterface();
    },

    // ===== SWITCH 16/32 STEPS =====
    setSteps(steps) {
        // NOUVEAU : Vérifier restrictions avant changement
        if (steps === 32 && !this.canSwitch32()) {
            // Bloquer passage en mode 32 et revenir à 16
            const stepsToggle = document.getElementById('stepsToggle');
            if (stepsToggle) {
                stepsToggle.checked = false;
            }
            this.showSwitchRestrictionFeedback();
            return;
        }

        this.steps = steps;
        
        // Notifier groups-mode du changement de steps
        window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
            detail: { 
                steps: this.steps,
                groupId: this.currentGroupId,
                enabled: this.enabled
            }
        }));
        
        // Mettre à jour interface
        this.updateInterface();
    },

    // ===== NOUVEAU : RESTRICTION SWITCH 32 =====
    canSwitch32() {
        // Switch 32 bloqué si groupes 1 ou 2 ont assignations couleurs
        const group1Assigned = this.getGroupAssignedColor(1);
        const group2Assigned = this.getGroupAssignedColor(2);
        
        return !group1Assigned && !group2Assigned;
    },

    getGroupAssignedColor(groupId) {
        if (window.PadsContent && window.PadsContent.getGroupAssignedColor) {
            return window.PadsContent.getGroupAssignedColor(groupId);
        }
        return null;
    },

    // ===== NOUVEAU : FEEDBACK VISUEL RESTRICTIONS =====
    showSwitchRestrictionFeedback() {
        const feedback = document.getElementById('switchRestrictionFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            
            // Auto-hide après 3 secondes
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }
    },

    updateSwitchRestrictions() {
        const stepsToggle = document.getElementById('stepsToggle');
        const switchRestriction = document.getElementById('switchRestrictionFeedback');
        
        if (stepsToggle) {
            const canSwitch = this.canSwitch32();
            
            // Disable switch si restrictions
            stepsToggle.disabled = !canSwitch;
            
            // Si mode 32 actif mais plus autorisé → forcer retour 16
            if (this.steps === 32 && !canSwitch) {
                stepsToggle.checked = false;
                this.steps = 16;
                
                // Notifier changement forcé
                window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
                    detail: { 
                        steps: this.steps,
                        groupId: this.currentGroupId,
                        enabled: this.enabled
                    }
                }));
            }
            
            // Feedback visuel permanent si bloqué
            if (switchRestriction) {
                switchRestriction.style.display = canSwitch ? 'none' : 'block';
            }
            
            // Tooltip informatif
            stepsToggle.title = canSwitch ? 
                "Switch entre 16 et 32 steps" : 
                "Bloqué : Groupes 1 ou 2 ont des assignations couleurs";
        }
        
        this.updateInterface();
    },

    // ===== DISPONIBILITÉ SÉQUENCEUR =====
    updateSequencerAvailability(groupId, hasSequencer) {
        this.currentGroupId = groupId;
        
        const toggle = document.getElementById('sequencerToggle');
        
        if (toggle) {
            // Toggle disponible seulement si groupe a séquenceur (groupes 1, 2, 5)
            toggle.disabled = !hasSequencer;
            
            if (!hasSequencer) {
                // Désactiver séquenceur si groupe ne le supporte pas
                toggle.checked = false;
                this.enabled = false;
                this.toggleSequencer(false);
            }
        }
        
        // Mettre à jour restrictions switch
        this.updateSwitchRestrictions();
        
        // Mettre à jour interface
        this.updateInterface();
    },

    // ===== INTERFACE AMÉLIORÉE =====
    updateInterface() {
        const toggle = document.getElementById('sequencerToggle');
        const stepsSwitch = document.getElementById('stepsSwitch');
        const stepsToggle = document.getElementById('stepsToggle');
        
        if (toggle && stepsSwitch) {
            // Afficher switch steps si séquenceur activé ET groupe compatible
            const showSteps = this.enabled && !toggle.disabled;
            stepsSwitch.style.display = showSteps ? 'flex' : 'none';
            
            // Mettre à jour état switch steps
            if (stepsToggle) {
                stepsToggle.checked = this.steps === 32;
                
                // Styling conditionnel selon restrictions
                const canSwitch = this.canSwitch32();
                stepsToggle.classList.toggle('restricted', !canSwitch);
            }
        }
        
        // Classes CSS pour styling avancé
        const sequencerSection = document.querySelector('.sequencer-section');
        if (sequencerSection) {
            sequencerSection.classList.toggle('sequencer-enabled', this.enabled);
            sequencerSection.classList.toggle('sequencer-disabled', toggle?.disabled);
            sequencerSection.classList.toggle('steps-32', this.steps === 32);
            sequencerSection.classList.toggle('switch-restricted', !this.canSwitch32());
        }
    },

    // ===== API PUBLIQUE =====
    isEnabled() {
        return this.enabled;
    },

    getSteps() {
        return this.steps;
    },

    getCurrentGroup() {
        return this.currentGroupId;
    },

    isAvailableForGroup(groupId) {
        // Séquenceur disponible pour groupes 1, 2 et 5 (mode 32)
        return groupId === 1 || groupId === 2 || groupId === 5;
    },

    // NOUVEAU : API restrictions
    canSwitchTo32() {
        return this.canSwitch32();
    },

    getRestrictionReason() {
        if (!this.canSwitch32()) {
            const group1Color = this.getGroupAssignedColor(1);
            const group2Color = this.getGroupAssignedColor(2);
            
            if (group1Color && group2Color) {
                return "Groupes 1 et 2 assignés";
            } else if (group1Color) {
                return "Groupe 1 assigné";
            } else if (group2Color) {
                return "Groupe 2 assigné";
            }
        }
        return null;
    },

    // ===== UTILITAIRES =====
    reset() {
        this.enabled = false;
        this.steps = 16;
        this.currentGroupId = null;
        
        const toggle = document.getElementById('sequencerToggle');
        const stepsToggle = document.getElementById('stepsToggle');
        
        if (toggle) toggle.checked = false;
        if (stepsToggle) stepsToggle.checked = false;
        
        this.updateInterface();
    },

    forceSteps16() {
        // Méthode pour forcer retour 16 steps (par groups-mode si nécessaire)
        if (this.steps === 32) {
            this.steps = 16;
            const stepsToggle = document.getElementById('stepsToggle');
            if (stepsToggle) {
                stepsToggle.checked = false;
            }
            this.updateInterface();
        }
    },

    // ===== DEBUGGING AMÉLIORÉ =====
    getState() {
        return {
            enabled: this.enabled,
            steps: this.steps,
            currentGroupId: this.currentGroupId,
            isAvailable: this.isAvailableForGroup(this.currentGroupId),
            canSwitch32: this.canSwitch32(),
            restrictionReason: this.getRestrictionReason(),
            group1Assigned: this.getGroupAssignedColor(1),
            group2Assigned: this.getGroupAssignedColor(2)
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.SequencerMode = SequencerMode;
}