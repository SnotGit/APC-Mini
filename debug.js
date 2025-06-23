const Debug = {
    
    // ===== CONFIGURATION =====
    enabled: true, // Facile à désactiver
    prefix: '🎹 APC-MINI',
    
    // ===== LOGGING METHODS =====
    log(message, ...args) {
        if (!this.enabled) return;
        console.log(`${this.prefix} ${message}`, ...args);
    },
    
    warn(message, ...args) {
        if (!this.enabled) return;
        console.warn(`${this.prefix} ⚠️ ${message}`, ...args);
    },
    
    error(message, ...args) {
        if (!this.enabled) return;
        console.error(`${this.prefix} ❌ ${message}`, ...args);
    },
    
    success(message, ...args) {
        if (!this.enabled) return;
        console.log(`${this.prefix} ✅ ${message}`, ...args);
    },
    
    info(message, ...args) {
        if (!this.enabled) return;
        console.info(`${this.prefix} ℹ️ ${message}`, ...args);
    },
    
    // ===== APP SPECIFIC METHODS =====
    
    initStart() {
        this.log('🚀 Initialisation App...');
    },
    
    initSuccess() {
        this.success('App initialisée avec succès');
    },
    
    initError(error) {
        this.error('Erreur critique initialisation:', error);
    },
    
    moduleCheck(moduleName, exists, hasCreate, hasInit) {
        if (exists) {
            this.success(`${moduleName}: create=${hasCreate}, init=${hasInit}`);
        } else {
            this.warn(`${moduleName}: NON TROUVÉ`);
        }
    },
    
    moduleInit(moduleName, success) {
        if (success) {
            this.success(`${moduleName} initialisé`);
        } else {
            this.error(`Erreur init ${moduleName}`);
        }
    },
    
    viewSwitch(viewId) {
        this.log(`🔄 Switch vers vue: ${viewId}`);
    },
    
    viewActive(viewId) {
        this.success(`Vue ${viewId} activée`);
    },
    
    contentLoad(viewId, module, htmlLength) {
        if (module) {
            this.log(`📝 ${viewId} - HTML généré (${htmlLength} chars)`);
        } else {
            this.error(`Module ${viewId}Content non trouvé`);
        }
    },
    
    contentInit(viewId, success) {
        if (success) {
            this.success(`${viewId}Content initialisé`);
        } else {
            this.warn(`Pas de méthode init() pour ${viewId}Content`);
        }
    },
    
    configLoad(viewId, module) {
        if (module) {
            this.success(`Config ${viewId} initialisée`);
        } else {
            this.warn(`Config ${viewId} non trouvée`);
        }
    },
    
    midiStatus(connected) {
        this.log(`🎹 MIDI: ${connected ? 'connecté' : 'déconnecté'}`);
    },
    
    containerCheck(selector, found) {
        if (found) {
            this.success(`Container ${selector} trouvé`);
        } else {
            this.error(`Container ${selector} non trouvé`);
        }
    },
    
    // ===== CRITICAL MODULES CHECK =====
    checkCriticalModules() {
        const criticalModules = ['PadsContent', 'PadsConfig', 'SequencerContent', 'ExportContent'];
        
        this.log('🔍 Vérification modules critiques:');
        criticalModules.forEach(moduleName => {
            const module = window[moduleName];
            const exists = !!module;
            const hasCreate = exists && typeof module.create === 'function';
            const hasInit = exists && typeof module.init === 'function';
            
            this.moduleCheck(moduleName, exists, hasCreate, hasInit);
        });
    },
    
    // ===== ARCHITECTURE CHECK =====
    checkArchitecture() {
        this.log('🏗️ Vérification architecture DOM...');
        
        const contentZone = document.querySelector('.content-zone');
        this.containerCheck('.content-zone', !!contentZone);
        
        const panelConfig = document.querySelector('.panel-config');
        this.containerCheck('.panel-config', !!panelConfig);
        
        const padsView = document.getElementById('padsView');
        this.containerCheck('#padsView', !!padsView);
        
        const configContent = document.getElementById('configContent');
        this.containerCheck('#configContent', !!configContent);
    },
    
    // ===== VIEW CONTENT DEBUG =====
    debugViewContent(viewId) {
        this.log(`🔍 Debug vue ${viewId}:`);
        
        const container = document.getElementById(`${viewId}View`);
        if (container) {
            this.success(`Container #${viewId}View trouvé`);
            this.log(`innerHTML length: ${container.innerHTML.length}`);
            this.log(`Classes: ${container.className}`);
        } else {
            this.error(`Container #${viewId}View non trouvé`);
        }
        
        const module = window[`${viewId.charAt(0).toUpperCase() + viewId.slice(1)}Content`];
        if (module) {
            this.success(`Module ${viewId}Content trouvé`);
            this.log(`Has create: ${typeof module.create === 'function'}`);
            this.log(`Has init: ${typeof module.init === 'function'}`);
        } else {
            this.error(`Module ${viewId}Content non trouvé`);
        }
    },
    
    // ===== UTILITIES =====
    disable() {
        this.enabled = false;
        console.log(`${this.prefix} 🔇 Debug désactivé`);
    },
    
    enable() {
        this.enabled = true;
        console.log(`${this.prefix} 🔊 Debug activé`);
    },
    
    // ===== INSPECT METHODS =====
    inspectWindow() {
        this.log('🔍 Modules disponibles dans window:');
        const modules = ['PadsContent', 'PadsConfig', 'SequencerContent', 'ExportContent', 'Header', 'Console', 'MIDI'];
        modules.forEach(name => {
            this.log(`window.${name}:`, !!window[name]);
        });
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.Debug = Debug;
    
    // Auto-check au chargement si debug activé
    if (Debug.enabled) {
        setTimeout(() => {
            Debug.inspectWindow();
        }, 1000);
    }
}