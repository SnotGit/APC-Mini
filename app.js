const App = {

    // ===== ÉTAT ORCHESTRATEUR =====
    isInitialized: false,
    currentView: 'pads',
    modules: {},
    config: {},

    // ===== INITIALISATION GLOBALE =====
    async init() {
        if (this.isInitialized) return;

        try {
            if (window.Debug) window.Debug.initStart();
            
            // 1. Console en premier (logging system)
            this.initModule('Console');
            
            // 2. Configuration system
            this.loadConfig();

            // 3. Initialiser modules core
            this.initModule('Header');
            this.initModule('ContentZone');
            this.initModule('PanelControl');
            await this.initMIDI();

            // 4. Communication inter-modules
            this.setupGlobalCommunication();

            // 6. Vérifier modules critiques
            this.checkCriticalModules();

            // 7. Vue par défaut
            this.switchToView('pads');

            this.isInitialized = true;
            this.notifyLog('Application initialisée', 'system');
            if (window.Debug) window.Debug.initSuccess();

        } catch (error) {
            if (window.Debug) window.Debug.initError(error);
            this.handleInitError(error);
        }
    },

    // ===== VÉRIFICATION MODULES =====
    checkCriticalModules() {
        if (window.Debug) window.Debug.checkCriticalModules();
    },

    // ===== GESTION MODULES =====
    initModule(moduleName) {
        if (window[moduleName] && window[moduleName].init) {
            try {
                window[moduleName].init();
                this.modules[moduleName] = window[moduleName];
                if (window.Debug) window.Debug.moduleInit(moduleName, true);
                return true;
            } catch (error) {
                if (window.Debug) window.Debug.moduleInit(moduleName, false);
                this.notifyLog(`Erreur init ${moduleName}: ${error.message}`, 'error');
                return false;
            }
        } else {
            if (window.Debug) window.Debug.moduleInit(moduleName, false);
            this.notifyLog(`Module ${moduleName} non trouvé`, 'warning');
            return false;
        }
    },

    async initMIDI() {
        if (!window.MIDI) {
            this.notifyLog('Module MIDI non trouvé', 'error');
            return false;
        }

        // Vérifier support Web MIDI API
        if (!window.MIDI.init()) {
            return false;
        }

        // Tentative connexion APC Mini
        const connected = await window.MIDI.connect();
        this.modules.MIDI = window.MIDI;
        
        if (window.Debug) window.Debug.midiStatus(connected);
        return connected;
    },

    // ===== ARCHITECTURE VUES =====
    initViewArchitecture() {
        // Préparer content-zone
        const contentZone = document.querySelector('.content-zone');
        if (contentZone) {
            contentZone.innerHTML = `
                <div class="view-panel" id="padsView"></div>
                <div class="view-panel" id="sequencerView"></div>
                <div class="view-panel" id="exportView"></div>
            `;
        }

        // Préparer panel-config
        const panelConfig = document.querySelector('.panel-config');
        if (panelConfig) {
            panelConfig.innerHTML = `<div class="config-content" id="configContent"></div>`;
        }
        
        if (window.Debug) window.Debug.checkArchitecture();
    },

    // ===== GESTIONNAIRE VUES =====
    switchToView(viewId) {
        if (this.currentView === viewId) return;
        
        if (window.Debug) window.Debug.viewSwitch(viewId);
        this.currentView = viewId;

        // Afficher contenu
        if (window.ContentZone) {
            window.ContentZone.showView(viewId);
        }

        // Afficher config panel
        if (window.PanelControl) {
            window.PanelControl.showConfig(viewId);
        }
        
        this.notifyLog(`Vue switched: ${viewId}`, 'info');
    },

    loadViewContent(viewId) {
        const viewContainer = document.getElementById(`${viewId}View`);
        if (!viewContainer) return;

        let contentModule = null;
        let moduleInitialized = false;

        switch (viewId) {
            case 'pads':
                contentModule = window.PadsContent;
                break;
            case 'sequencer':
                contentModule = window.SequencerContent;
                break;
            case 'export':
                contentModule = window.ExportContent;
                break;
        }

        if (contentModule && contentModule.create) {
            try {
                const htmlContent = contentModule.create();
                if (window.Debug) window.Debug.contentLoad(viewId, true, htmlContent.length);
                
                viewContainer.innerHTML = htmlContent;
                
                // Initialiser module après insertion DOM
                if (contentModule.init) {
                    contentModule.init();
                    moduleInitialized = true;
                    if (window.Debug) window.Debug.contentInit(viewId, true);
                } else {
                    if (window.Debug) window.Debug.contentInit(viewId, false);
                }
            } catch (error) {
                this.notifyLog(`Erreur chargement ${viewId}Content: ${error.message}`, 'error');
                viewContainer.innerHTML = `<div class="error-placeholder">Module ${viewId} indisponible</div>`;
            }
        } else {
            if (window.Debug) window.Debug.contentLoad(viewId, false, 0);
            this.notifyLog(`Module ${viewId}Content non trouvé`, 'warning');
            viewContainer.innerHTML = `<div class="placeholder">Module ${viewId} en développement</div>`;
        }

        return moduleInitialized;
    },

    loadViewConfig(viewId) {
        const configContent = document.getElementById('configContent');
        if (!configContent) return;

        let configModule = null;

        switch (viewId) {
            case 'pads':
                configModule = window.PadsConfig;
                break;
            case 'sequencer':
                configModule = window.SequencerConfig;
                break;
            case 'export':
                // Export n'a pas de config panel
                configContent.innerHTML = '';
                return;
        }

        if (configModule && configModule.create) {
            try {
                configContent.innerHTML = configModule.create();
                
                // Initialiser config après insertion DOM
                if (configModule.init) {
                    configModule.init();
                    if (window.Debug) window.Debug.configLoad(viewId, true);
                }
            } catch (error) {
                this.notifyLog(`Erreur config ${viewId}: ${error.message}`, 'error');
                configContent.innerHTML = '';
            }
        } else {
            if (window.Debug) window.Debug.configLoad(viewId, false);
            configContent.innerHTML = '';
        }
    },

    // ===== DEBUG PUBLIC METHOD =====
    debugCurrentView() {
        if (window.Debug) {
            window.Debug.debugViewContent(this.currentView);
        }
    },

    // ===== COMMUNICATION GLOBALE =====
    setupGlobalCommunication() {
        // Écouter changements de vue depuis header
        window.addEventListener('view-changed', (event) => {
            const { view } = event.detail;
            this.switchToView(view);
        });

        // Écouter statut MIDI
        window.addEventListener('midi-connection-changed', (event) => {
            const { connected } = event.detail;
            this.handleMIDIConnectionChange(connected);
        });

        // Écouter messages MIDI pour transmission
        window.addEventListener('midi-message', (event) => {
            this.handleMIDIMessage(event.detail);
        });

        // Écouter événements configuration
        window.addEventListener('config-updated', (event) => {
            this.handleConfigUpdate(event.detail);
        });
    },

    handleMIDIConnectionChange(connected) {
        if (window.Debug) window.Debug.midiStatus(connected);
        
        // Notifier modules concernés
        if (this.currentView === 'pads' && window.PadsContent) {
            // PadsContent peut réagir au changement connexion
        }
        
        if (this.currentView === 'sequencer' && window.SequencerContent) {
            // SequencerContent peut réagir au changement connexion
        }
    },

    handleMIDIMessage(midiData) {
        const { status, note, velocity } = midiData;
        
        // Transmettre aux modules actifs selon la vue
        switch (this.currentView) {
            case 'pads':
                if (window.PadsContent && window.PadsContent.handleMIDI) {
                    window.PadsContent.handleMIDI(status, note, velocity);
                }
                break;
                
            case 'sequencer':
                if (window.SequencerContent && window.SequencerContent.handleMIDI) {
                    window.SequencerContent.handleMIDI(status, note, velocity);
                }
                break;
        }
    },

    handleConfigUpdate(configData) {
        const { section, data } = configData;
        this.updateConfig(section, data);
    },

    // ===== SYSTÈME CONFIGURATION =====
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('apc-mini-config');
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
            } else {
                this.config = this.getDefaultConfig();
                this.saveConfig();
            }
        } catch (error) {
            this.notifyLog('Erreur chargement config, utilisation défauts', 'warning');
            this.config = this.getDefaultConfig();
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apc-mini-config', JSON.stringify(this.config));
        } catch (error) {
            this.notifyLog('Erreur sauvegarde config', 'error');
        }
    },

    getDefaultConfig() {
        return {
            pads: {
                padColors: {},
                sequencerEnabled: false
            },
            sequencer: {
                steps: 16,
                swing: 50,
                scale: 'major',
                octave: 0
            },
            midi: {
                autoConnect: true
            }
        };
    },

    updateConfig(section, data) {
        if (!this.config[section]) {
            this.config[section] = {};
        }
        Object.assign(this.config[section], data);
        this.saveConfig();
    },

    getConfig(section) {
        return this.config[section] || null;
    },

    // ===== EXPORT SYSTÈME =====
    exportConfig() {
        if (!window.ExportContent || !window.ExportContent.export) {
            this.notifyLog('Module Export non disponible', 'error');
            return false;
        }
        
        try {
            return window.ExportContent.export(this.config);
        } catch (error) {
            this.notifyLog(`Erreur export: ${error.message}`, 'error');
            return false;
        }
    },

    // ===== GESTION ERREURS =====
    handleInitError(error) {
        this.notifyLog(`Erreur critique initialisation: ${error.message}`, 'error');
        
        // Mode dégradé
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Erreur Application</h1>
                <p>Impossible d'initialiser l'application.</p>
                <p>Erreur: ${error.message}</p>
                <button onclick="location.reload()">Recharger</button>
            </div>
        `;
    },

    // ===== NOTIFICATIONS =====
    notifyLog(message, type = 'info') {
        // Déléguer à console.js uniquement
        window.dispatchEvent(new CustomEvent('console-log', {
            detail: { message, type }
        }));
    },

    // ===== API PUBLIQUE =====
    getCurrentView() {
        return this.currentView;
    },

    isMIDIConnected() {
        return this.modules.MIDI ? this.modules.MIDI.isConnected() : false;
    },

    getModule(moduleName) {
        return this.modules[moduleName] || null;
    },

    isModuleLoaded(moduleName) {
        return !!this.modules[moduleName];
    }
};

// ===== INITIALISATION GLOBALE =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.App = App;
}