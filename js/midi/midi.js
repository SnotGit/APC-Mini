const MIDI = {
    
    // ===== ÉTAT =====
    access: null,
    input: null,
    output: null,
    isConnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: null,
    
    // ===== CONSTANTES =====
    COLORS: { 
        OFF: 0, 
        GREEN: 1, 
        RED: 3, 
        YELLOW: 5 
    },

    // Patterns de détection APC Mini MK1 améliorés
    APC_PATTERNS: [
        'apc mini mk1',
        'apc mini',
        'akai apc mini',
        'akai professional apc mini'
    ],

    // ===== INITIALISATION =====
    init() {
        // Vérifier support Web MIDI API
        if (!navigator.requestMIDIAccess) {
            this.notifyConnectionStatus(false, 'Web MIDI API non supportée');
            return false;
        }
        
        return true;
    },

    // ===== CONNEXION =====
    async connect() {
        if (this.isConnecting) return false;
        
        this.isConnecting = true;
        
        try {
            // Demander accès MIDI avec sysex pour compatibilité étendue
            this.access = await navigator.requestMIDIAccess({ sysex: false });
            
            // Recherche des périphériques APC Mini
            const { inputFound, outputFound } = this.findAPCDevices();
            
            if (inputFound && outputFound) {
                // Configurer listeners
                this.setupMIDIListeners();
                
                // Initialiser contrôleur (clear all LEDs)
                this.initializeController();
                
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.notifyConnectionStatus(true, 'APC Mini MK1 connecté');
                
                return true;
            } else {
                this.isConnecting = false;
                this.notifyConnectionStatus(false, 'APC Mini MK1 non détecté');
                
                // Démarrer auto-reconnexion
                this.startAutoReconnect();
                
                return false;
            }
            
        } catch (error) {
            this.isConnecting = false;
            this.notifyConnectionStatus(false, `Erreur MIDI: ${error.message}`);
            return false;
        }
    },

    // ===== DÉTECTION PÉRIPHÉRIQUES =====
    findAPCDevices() {
        let inputFound = false;
        let outputFound = false;
        
        // Recherche Input
        for (const input of this.access.inputs.values()) {
            if (this.isAPCDevice(input.name)) {
                this.input = input;
                inputFound = true;
                break;
            }
        }
        
        // Recherche Output
        for (const output of this.access.outputs.values()) {
            if (this.isAPCDevice(output.name)) {
                this.output = output;
                outputFound = true;
                break;
            }
        }
        
        return { inputFound, outputFound };
    },

    isAPCDevice(deviceName) {
        if (!deviceName) return false;
        
        const name = deviceName.toLowerCase();
        return this.APC_PATTERNS.some(pattern => name.includes(pattern));
    },

    // ===== CONFIGURATION MIDI =====
    setupMIDIListeners() {
        if (this.input) {
            this.input.onmidimessage = this.handleMessage.bind(this);
        }
        
        // Écouter déconnexions
        if (this.access) {
            this.access.onstatechange = this.handleStateChange.bind(this);
        }
    },

    handleStateChange(event) {
        const port = event.port;
        
        if (this.isAPCDevice(port.name)) {
            if (port.state === 'disconnected') {
                this.handleDisconnection();
            } else if (port.state === 'connected' && !this.isConnected()) {
                // Tentative reconnexion automatique
                setTimeout(() => this.connect(), 1000);
            }
        }
    },

    // ===== GESTION MESSAGES =====
    handleMessage(event) {
        const [status, note, velocity] = event.data;
        
        // Notifier application
        window.dispatchEvent(new CustomEvent('midi-message', { 
            detail: { status, note, velocity } 
        }));
    },

    // ===== CONTRÔLE PADS =====
    setPadColor(note, color) {
        if (!this.output || note < 0 || note > 63) return false;
        
        const colorValue = typeof color === 'string' 
            ? this.COLORS[color.toUpperCase()] || 0 
            : color || 0;
            
        try {
            this.output.send([0x90, note, colorValue]);
            return true;
        } catch (error) {
            this.notifyConnectionStatus(false, 'Erreur envoi MIDI');
            return false;
        }
    },

    // ===== INITIALISATION CONTRÔLEUR =====
    initializeController() {
        if (!this.output) return;
        
        // Clear toutes les LEDs
        this.clearAll();
        
        // Test flash pour confirmer connexion
        setTimeout(() => {
            this.setPadColor(0, 'GREEN');
            setTimeout(() => this.setPadColor(0, 'OFF'), 200);
        }, 100);
    },

    clearAll() {
        if (!this.output) return;
        
        // Éteindre tous les pads (0-63)
        for (let i = 0; i < 64; i++) {
            this.setPadColor(i, 0);
        }
        
        // Éteindre les boutons de contrôle
        for (let i = 64; i < 128; i++) {
            try {
                this.output.send([0x90, i, 0]);
            } catch (error) {
                // Ignorer erreurs notes hors gamme
            }
        }
    },

    // ===== AUTO-RECONNEXION =====
    startAutoReconnect() {
        if (this.reconnectInterval) return;
        
        this.reconnectInterval = setInterval(() => {
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.stopAutoReconnect();
                return;
            }
            
            this.reconnectAttempts++;
            this.connect();
            
        }, 3000); // Tentative toutes les 3 secondes
    },

    stopAutoReconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    },

    handleDisconnection() {
        this.input = null;
        this.output = null;
        this.notifyConnectionStatus(false, 'APC Mini déconnecté');
        
        // Démarrer auto-reconnexion
        this.startAutoReconnect();
    },

    // ===== DÉCONNEXION =====
    disconnect() {
        this.stopAutoReconnect();
        
        if (this.input) {
            this.input.onmidimessage = null;
        }
        
        if (this.output) {
            this.clearAll();
        }
        
        this.input = this.output = this.access = null;
        this.notifyConnectionStatus(false, 'Déconnecté manuellement');
    },

    // ===== STATUT =====
    isConnected() {
        return !!(this.input && this.output);
    },

    // ===== NOTIFICATIONS =====
    notifyConnectionStatus(connected, message) {
        // Notifier console
        window.dispatchEvent(new CustomEvent('midi-status-changed', {
            detail: { connected, message }
        }));
        
        // Notifier app
        window.dispatchEvent(new CustomEvent('midi-connection-changed', {
            detail: { connected }
        }));
    }
};