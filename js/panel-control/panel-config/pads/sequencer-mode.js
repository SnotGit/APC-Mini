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

    // ===== DISPONIBILITÉ SÉQUENCEUR =====
    updateSequencerAvailability(groupId, hasSequencer) {
        this.currentGroupId = groupId;
        
        const toggle = document.getElementById('sequencerToggle');
        const stepsSwitch = document.getElementById('stepsSwitch');
        
        if (toggle) {
            // Toggle disponible seulement si groupe a séquenceur (groupes 1 et 2)
            toggle.disabled = !hasSequencer;
            
            if (!hasSequencer) {
                // Désactiver séquenceur si groupe ne le supporte pas
                toggle.checked = false;
                this.enabled = false;
                this.toggleSequencer(false);
            }
        }
        
        // Mettre à jour interface
        this.updateInterface();
    },

    // ===== INTERFACE =====
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
            }
        }
        
        // Classes CSS pour styling
        const sequencerSection = document.querySelector('.sequencer-section');
        if (sequencerSection) {
            sequencerSection.classList.toggle('sequencer-enabled', this.enabled);
            sequencerSection.classList.toggle('sequencer-disabled', toggle?.disabled);
            sequencerSection.classList.toggle('steps-32', this.steps === 32);
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
        // Séquenceur disponible seulement pour groupes 1 et 2
        return groupId === 1 || groupId === 2;
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

    // ===== DEBUGGING =====
    getState() {
        return {
            enabled: this.enabled,
            steps: this.steps,
            currentGroupId: this.currentGroupId,
            isAvailable: this.isAvailableForGroup(this.currentGroupId)
        };
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.SequencerMode = SequencerMode;
}