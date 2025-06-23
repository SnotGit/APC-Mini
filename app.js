const App = {

    // ===== ÉTAT ORCHESTRATEUR =====
    isInitialized: false,
    currentView: null,
    modules: {},
    config: {},

        // ===== INITIALISATION GLOBALE =====
    async init() {
        if (this.isInitialized) return;

        try {
            this.initModule('ConsoleLogs');
            this.initModule('Console');
            this.loadConfig();
            this.initModule('Header');
            this.initModule('ContentZone');
            this.initModule('PanelControl');
            await this.initMIDI();
            this.setupGlobalCommunication();
            this.activateDefaultView();
            this.isInitialized = true;
        } catch (error) {
            this.handleInitError(error);
        }
    },

    // ===== ACTIVATION VUE PAR DÉFAUT =====
    activateDefaultView() {
        this.switchToView('pads');
    },

    // ===== GESTION MODULES =====
    initModule(moduleName) {
        if (window[moduleName] && window[moduleName].init) {
            try {
                window[moduleName].init();
                this.modules[moduleName] = window[moduleName];
                return true;
            } catch (error) {
                return false;
            }
        } else {
            return false;
        }
    },

    async initMIDI() {
        if (!window.MIDI) {
            return false;
        }

        if (!window.MIDI.init()) {
            return false;
        }

        const connected = await window.MIDI.connect();
        this.modules.MIDI = window.MIDI;
        
        return connected;
    },

    // ===== GESTIONNAIRE VUES =====
    switchToView(viewId) {
        this.currentView = viewId;

        if (window.ContentZone) {
            window.ContentZone.showView(viewId);
        }

        if (window.PanelControl) {
            window.PanelControl.switchConfig(viewId);
        }
    },

    // ===== COMMUNICATION GLOBALE =====
    setupGlobalCommunication() {
        window.addEventListener('view-changed', (event) => {
            const { view } = event.detail;
            this.switchToView(view);
        });

        window.addEventListener('midi-connection-changed', (event) => {
            const { connected } = event.detail;
            this.handleMIDIConnectionChange(connected);
        });

        window.addEventListener('midi-message', (event) => {
            this.handleMIDIMessage(event.detail);
        });

        window.addEventListener('config-updated', (event) => {
            this.handleConfigUpdate(event.detail);
        });
    },

    handleMIDIConnectionChange(connected) {
        if (this.currentView === 'pads' && window.PadsContent) {
            // PadsContent réaction connexion
        }
        
        if (this.currentView === 'sequencer' && window.SequencerContent) {
            // SequencerContent réaction connexion
        }
    },

    handleMIDIMessage(midiData) {
        const { status, note, velocity } = midiData;
        
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
            this.config = this.getDefaultConfig();
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apc-mini-config', JSON.stringify(this.config));
        } catch (error) {
            // Sauvegarde échouée silencieuse
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
            return false;
        }
        
        try {
            return window.ExportContent.export(this.config);
        } catch (error) {
            return false;
        }
    },

    // ===== GESTION ERREURS =====
    handleInitError(error) {
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Erreur Application</h1>
                <p>Impossible d'initialiser l'application.</p>
                <p>Erreur: ${error.message}</p>
                <button onclick="location.reload()">Recharger</button>
            </div>
        `;
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