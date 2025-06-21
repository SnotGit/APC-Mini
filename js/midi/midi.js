const MIDI = {
    
    // ===== ÉTAT =====
    access: null,
    input: null,
    output: null,
    
    // ===== CONSTANTES =====
    COLORS: { 
        OFF: 0, 
        GREEN: 1, 
        RED: 3, 
        YELLOW: 5 
    },

    // ===== INITIALISATION =====
    init() {
        return !!navigator.requestMIDIAccess;
    },

    // ===== CONNEXION =====
    async connect() {
        try {
            this.access = await navigator.requestMIDIAccess();
            
            for (const input of this.access.inputs.values()) {
                if (input.name.toLowerCase().includes('apc') && input.name.toLowerCase().includes('mini')) {
                    this.input = input;
                    this.input.onmidimessage = this.handleMessage.bind(this);
                    break;
                }
            }
            
            for (const output of this.access.outputs.values()) {
                if (output.name.toLowerCase().includes('apc') && output.name.toLowerCase().includes('mini')) {
                    this.output = output;
                    break;
                }
            }
            
            if (this.input && this.output) {
                this.clearAll();
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    },

    // ===== GESTION MESSAGES =====
    handleMessage(event) {
        const [status, note, velocity] = event.data;
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
        } catch {
            return false;
        }
    },

    clearAll() {
        if (!this.output) return;
        for (let i = 0; i < 64; i++) {
            this.setPadColor(i, 0);
        }
    },

    // ===== DÉCONNEXION =====
    disconnect() {
        if (this.input) this.input.onmidimessage = null;
        this.input = this.output = this.access = null;
    },

    // ===== STATUT =====
    isConnected() {
        return !!(this.input && this.output);
    }
};