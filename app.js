const App = {

    // ===== ÉTAT =====
    isInitialized: false,
    currentView: 'pads',
    config: {},

    // ===== INITIALISATION =====
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initialisation App...');

            // 1. Console en premier
            this.initConsole();
            
            // 2. Log initial après que Console soit initialisé
            setTimeout(() => {
                this.log('APC Mini MK1', 'system');
            }, 100);

            // 3. Configuration
            this.loadConfig();

            // 4. Header
            this.initHeader();

            // 5. MIDI
            await this.initMIDI();

            // 6. View Manager
            this.initViewManager();

            // 7. Événements globaux
            this.setupGlobalEvents();

            // 8. Vue par défaut
            this.switchToView('pads');

            this.isInitialized = true;
            console.log('✅ App initialisée !');

        } catch (error) {
            console.error('❌ Erreur init:', error);
            this.log(`Erreur initialisation: ${error.message}`, 'error');
        }
    },

    // ===== CONSOLE SYSTEM =====
    initConsole() {
        if (window.Console) {
            window.Console.init();
        }
    },

    log(message, type = 'info') {
        if (window.Console && window.Console.log) {
            window.Console.log(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    // ===== HEADER =====
    initHeader() {
        if (window.Header) {
            window.Header.init();
        } else {
            this.log('Header module non trouvé', 'error');
        }
    },

    // ===== MIDI MANAGER =====
    async initMIDI() {
        if (!window.MIDI) {
            this.log('Module MIDI non trouvé', 'error');
            return;
        }

        // Vérifier support Web MIDI
        if (!window.MIDI.init()) {
            this.log('Web MIDI API non supportée', 'error');
            return;
        }

        // Tentative connexion
        const connected = await window.MIDI.connect();
        
        if (connected) {
            if (window.Console) {
                window.Console.updateConnectionStatus(true);
            }
        } else {
            if (window.Console) {
                window.Console.updateConnectionStatus(false);
            }
        }

        // Surveillance reconnexion
        this.setupMIDIMonitoring();
    },

    setupMIDIMonitoring() {
        // Vérifier connexion périodiquement
        setInterval(() => {
            if (window.MIDI && window.Console) {
                const isConnected = window.MIDI.isConnected();
                const currentStatus = document.getElementById('connectionStatus');
                const wasConnected = currentStatus ? currentStatus.classList.contains('connected') : false;
                
                if (isConnected !== wasConnected) {
                    window.Console.updateConnectionStatus(isConnected);
                }
            }
        }, 2000);
    },

    // ===== VIEW MANAGER =====
    initViewManager() {
        // Initialiser content-zone
        const contentZone = document.querySelector('.content-zone');
        if (contentZone) {
            contentZone.innerHTML = `
                <div class="view-panel" id="padsView"></div>
                <div class="view-panel" id="sequencerView"></div>
                <div class="view-panel" id="exportView"></div>
            `;
        }

        // Initialiser panel-config
        const panelConfig = document.querySelector('.panel-config');
        if (panelConfig) {
            panelConfig.innerHTML = `<div class="config-content" id="configContent"></div>`;
        }
    },

    switchToView(viewId) {
        this.currentView = viewId;
        console.log(`🔄 Switch vers vue: ${viewId}`);

        // Masquer toutes les vues
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Afficher vue active
        const activeView = document.getElementById(`${viewId}View`);
        if (activeView) {
            activeView.classList.add('active');
        }

        // Charger contenu selon vue
        this.loadViewContent(viewId);
        this.loadViewConfig(viewId);
    },

    loadViewContent(viewId) {
        const viewContainer = document.getElementById(`${viewId}View`);
        if (!viewContainer) return;

        switch (viewId) {
            case 'pads':
                if (window.PadsContent) {
                    console.log('📱 Loading PadsContent...');
                    viewContainer.innerHTML = window.PadsContent.create();
                    // Initialiser PadsContent après insertion DOM
                    if (window.PadsContent.init) {
                        window.PadsContent.init();
                        console.log('✅ PadsContent initialisé');
                    }
                } else {
                    console.error('❌ PadsContent module non trouvé');
                }
                break;

            case 'sequencer':
                if (window.SequencerContent) {
                    viewContainer.innerHTML = window.SequencerContent.create();
                }
                break;

            case 'export':
                if (window.ExportContent) {
                    viewContainer.innerHTML = window.ExportContent.create();
                }
                break;
        }
    },

    loadViewConfig(viewId) {
        const configContent = document.getElementById('configContent');
        if (!configContent) return;

        switch (viewId) {
            case 'pads':
                if (window.PadsConfig) {
                    console.log('⚙️ Loading PadsConfig...');
                    configContent.innerHTML = window.PadsConfig.create();
                    // Initialiser PadsConfig après insertion DOM
                    if (window.PadsConfig.init) {
                        window.PadsConfig.init();
                        console.log('✅ PadsConfig initialisé');
                    }
                } else {
                    console.error('❌ PadsConfig module non trouvé');
                }
                break;

            case 'sequencer':
                if (window.SequencerConfig) {
                    configContent.innerHTML = window.SequencerConfig.create();
                }
                break;

            case 'export':
                // Panel config reste vide pour export
                configContent.innerHTML = '';
                break;
        }
    },

    // ===== ÉVÉNEMENTS GLOBAUX =====
    setupGlobalEvents() {
        // Écouter changements de vue du header
        window.addEventListener('view-changed', (event) => {
            const { view } = event.detail;
            this.switchToView(view);
        });

        // Écouter messages MIDI
        window.addEventListener('midi-message', (event) => {
            const { status, note, velocity } = event.detail;
            // Transmettre aux modules concernés
            this.handleMIDIMessage(status, note, velocity);
        });

        // Écouter assignations pour logs
        window.addEventListener('pad-assigned', (event) => {
            const { padNumber, color } = event.detail;
            this.log(`Pad ${padNumber} → ${color}`, 'success');
        });

        window.addEventListener('group-assigned', (event) => {
            const { groupId, color } = event.detail;
            this.log(`Groupe ${groupId} → ${color}`, 'success');
        });
    },

    handleMIDIMessage(status, note, velocity) {
        // Transmettre aux modules actifs
        if (this.currentView === 'pads' && window.PadsContent) {
            // window.PadsContent.handleMIDI(status, note, velocity);
        }
    },

    // ===== CONFIGURATION SYSTEM =====
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
            this.log('Erreur chargement config', 'error');
            this.config = this.getDefaultConfig();
        }
    },

    saveConfig() {
        try {
            localStorage.setItem('apc-mini-config', JSON.stringify(this.config));
        } catch (error) {
            this.log('Erreur sauvegarde config', 'error');
        }
    },

    getDefaultConfig() {
        return {
            pads: {
                padConfigs: {},
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

    // ===== EXPORT SYSTEM =====
    exportConfig() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                config: this.config,
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apc-mini-config-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.log('Configuration exportée', 'success');
            return true;

        } catch (error) {
            this.log('Erreur export config', 'error');
            return false;
        }
    },

    // ===== UTILITAIRES =====
    getCurrentView() {
        return this.currentView;
    },

    isMIDIConnected() {
        return window.MIDI ? window.MIDI.isConnected() : false;
    }
};

// ===== INITIALISATION GLOBALE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, initializing App...');
    App.init();
});

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.App = App;
}