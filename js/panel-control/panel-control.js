const PanelControl = {

    // ===== ÉTAT =====
    currentConfig: null,
    isInitialized: false,

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.createConfigStructure();
        this.setupEventListeners();
        this.initConsole();
        
        this.isInitialized = true;
    },

    // ===== CRÉATION STRUCTURE DOM =====
    createConfigStructure() {
        const panelConfig = document.querySelector('.panel-config');
        if (panelConfig) {
            panelConfig.innerHTML = `<div class="config-content" id="configContent"></div>`;
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Écouter demandes de changement config depuis app.js
        window.addEventListener('panel-config-switch', (event) => {
            const { configType } = event.detail;
            this.switchConfig(configType);
        });
    },

    // ===== INITIALISATION CONSOLE =====
    initConsole() {
        if (window.Console && window.Console.init) {
            window.Console.init();
        }
    },

    // ===== GESTION CONFIG =====
    switchConfig(configType) {
        if (this.currentConfig === configType) return;
        
        this.currentConfig = configType;
        
        const configContent = document.getElementById('configContent');
        if (!configContent) return;

        let configModule = null;

        switch (configType) {
            case 'pads':
                configModule = window.PadsConfig;
                break;
            case 'sequencer':
                configModule = window.SequencerConfig;
                break;
            case 'export':
                // Export n'a pas de config
                configContent.innerHTML = '';
                return;
        }

        if (configModule && configModule.create) {
            try {
                configContent.innerHTML = configModule.create();
                
                // Initialiser config
                if (configModule.init) {
                    configModule.init();
                }
            } catch (error) {
                configContent.innerHTML = `<div class="error">Erreur config: ${error.message}</div>`;
            }
        } else {
            configContent.innerHTML = '';
        }
    },

    // ===== API PUBLIQUE =====
    showConfig(configType) {
        this.switchConfig(configType);
    },

    getCurrentConfig() {
        return this.currentConfig;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PanelControl = PanelControl;
}