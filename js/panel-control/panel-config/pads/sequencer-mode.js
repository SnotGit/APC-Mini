const SequencerMode = {

    // ===== ÉTAT =====
    enabled: false,
    steps: 16,
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
        const container = document.getElementById('sequencerModeContainer');
        if (container) {
            container.innerHTML = this.create();
            this.setupEventListeners();
        }
        this.isInitialized = true;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.id === 'sequencerToggle') this.toggleSequencer(e.target.checked);
            if (e.target.id === 'stepsToggle') this.setSteps(e.target.checked ? 32 : 16);
        });

        window.addEventListener('group-selected', (e) => this.updateSequencerAvailability(e.detail.groupId, e.detail.hasSequencer));
        window.addEventListener('clear-selection', () => this.handleNoGroupSelected());
        window.addEventListener('group-assigned', () => this.updateSwitchRestrictions());
        window.addEventListener('pad-assigned', () => this.updateSwitchRestrictions());
    },

    // ===== TOGGLE SÉQUENCEUR =====
    toggleSequencer(enabled) {
        this.enabled = enabled;
        
        // Logs via système centralisé
        if (window.ConsoleLogs) {
            window.ConsoleLogs.logSequencer('toggle', { enabled: this.enabled });
        }

        window.dispatchEvent(new CustomEvent('sequencer-toggle-changed', {
            detail: { enabled: this.enabled, groupId: this.currentGroupId, steps: this.steps }
        }));
        this.updateInterface();
    },

    // ===== SWITCH 16/32 STEPS =====
    setSteps(steps) {
        if (steps === 32 && !this.canSwitch32()) {
            const stepsToggle = document.getElementById('stepsToggle');
            if (stepsToggle) stepsToggle.checked = false;
            
            // Log restriction
            if (window.ConsoleLogs) {
                window.ConsoleLogs.logSequencer('restriction', { 
                    reason: 'switch-32-blocked',
                    details: this.getRestrictionDetails()
                });
            }
            return;
        }

        this.steps = steps;
        
        // Logs
        if (window.ConsoleLogs) {
            window.ConsoleLogs.logSequencer('steps', { steps: this.steps });
        }

        window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
            detail: { steps: this.steps, groupId: this.currentGroupId, enabled: this.enabled }
        }));
        this.updateInterface();
    },

    // ===== RESTRICTION SWITCH 32 =====
    canSwitch32() {
        return !this.getGroupAssignedColor(1) && !this.getGroupAssignedColor(2);
    },

    getGroupAssignedColor(groupId) {
        return window.PadsContent?.getGroupAssignedColor?.(groupId) || null;
    },

    updateSwitchRestrictions() {
        const stepsToggle = document.getElementById('stepsToggle');
        if (!stepsToggle) return;

        const canSwitch = this.canSwitch32();
        stepsToggle.disabled = !canSwitch;
        stepsToggle.title = canSwitch ? "Switch entre 16 et 32 steps" : "Bloqué : Groupes 1 ou 2 ont des assignations couleurs";

        if (this.steps === 32 && !canSwitch) {
            stepsToggle.checked = false;
            this.steps = 16;
            window.dispatchEvent(new CustomEvent('sequencer-steps-changed', {
                detail: { steps: this.steps, groupId: this.currentGroupId, enabled: this.enabled }
            }));
        }
        
        this.updateInterface();
    },

    // ===== DISPONIBILITÉ SÉQUENCEUR =====
    updateSequencerAvailability(groupId, hasSequencer) {
        this.currentGroupId = groupId;
        const toggle = document.getElementById('sequencerToggle');
        
        if (toggle) {
            toggle.disabled = !hasSequencer;
            // CORRECTION : Ne pas forcer disabled si pas de séquenceur, laisser l'utilisateur
            // mais empêcher l'activation via la logique métier
        }
        
        this.updateSwitchRestrictions();
        this.updateInterface();
    },

    // ===== NOUVELLE MÉTHODE : GÉRER AUCUN GROUPE SÉLECTIONNÉ =====
    handleNoGroupSelected() {
        // Quand aucun groupe n'est sélectionné, garder le toggle disponible
        // mais utiliser un groupe par défaut pour l'activation
        this.currentGroupId = null;
        const toggle = document.getElementById('sequencerToggle');
        
        if (toggle) {
            // CORRECTION : Laisser le toggle disponible même sans sélection
            toggle.disabled = false;
        }
        
        this.updateInterface();
    },

    // ===== INTERFACE =====
    updateInterface() {
        const toggle = document.getElementById('sequencerToggle');
        const stepsSwitch = document.getElementById('stepsSwitch');
        const stepsToggle = document.getElementById('stepsToggle');
        
        if (toggle && stepsSwitch) {
            // CORRECTION : Afficher switch si enabled même sans groupe sélectionné
            stepsSwitch.style.display = this.enabled ? 'flex' : 'none';
            
            if (stepsToggle) {
                stepsToggle.checked = this.steps === 32;
                stepsToggle.classList.toggle('restricted', !this.canSwitch32());
            }
        }
        
        const sequencerSection = document.querySelector('.sequencer-section');
        if (sequencerSection) {
            sequencerSection.classList.toggle('sequencer-enabled', this.enabled);
            sequencerSection.classList.toggle('sequencer-disabled', toggle?.disabled);
            sequencerSection.classList.toggle('steps-32', this.steps === 32);
            sequencerSection.classList.toggle('switch-restricted', !this.canSwitch32());
        }
    },

    // ===== MÉTHODE CORRECTION ÉTAT =====
    getDefaultGroupForSequencer() {
        // Si pas de groupe sélectionné mais séquenceur activé, utiliser groupe 1 par défaut
        if (this.steps === 32) return 5;
        return this.currentGroupId || 1;
    },

    // ===== API PUBLIQUE =====
    isEnabled() { return this.enabled; },
    getSteps() { return this.steps; },
    getCurrentGroup() { return this.currentGroupId; },
    isAvailableForGroup(groupId) { return groupId === 1 || groupId === 2 || groupId === 5; },
    canSwitchTo32() { return this.canSwitch32(); },
    
    getRestrictionReason() {
        if (!this.canSwitch32()) {
            const group1Color = this.getGroupAssignedColor(1);
            const group2Color = this.getGroupAssignedColor(2);
            if (group1Color && group2Color) return "Groupes 1 et 2 assignés";
            if (group1Color) return "Groupe 1 assigné";
            if (group2Color) return "Groupe 2 assigné";
        }
        return null;
    },

    getRestrictionDetails() {
        return {
            group1Color: this.getGroupAssignedColor(1),
            group2Color: this.getGroupAssignedColor(2),
            canSwitch32: this.canSwitch32()
        };
    },

    // ===== UTILITAIRES =====
    reset() {
        this.enabled = false;
        this.steps = 16;
        this.currentGroupId = null;
        const toggle = document.getElementById('sequencerToggle');
        const stepsToggle = document.getElementById('stepsToggle');
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = false; // CORRECTION : Ne pas laisser disabled après reset
        }
        if (stepsToggle) stepsToggle.checked = false;
        this.updateInterface();
    },

    forceSteps16() {
        if (this.steps === 32) {
            this.steps = 16;
            const stepsToggle = document.getElementById('stepsToggle');
            if (stepsToggle) stepsToggle.checked = false;
            this.updateInterface();
        }
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.SequencerMode = SequencerMode;
}