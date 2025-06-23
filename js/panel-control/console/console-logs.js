const ConsoleLogs = {

    // ===== ÉTAT =====
    isInitialized: false,

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Hub central pour tous les logs UX
        window.addEventListener('console-log-request', (event) => {
            this.handleLogRequest(event.detail);
        });

        // Événements MIDI direct
        window.addEventListener('midi-status-changed', (event) => {
            const { connected, message } = event.detail;
            this.logMidiStatus(connected, message);
        });
    },

    // ===== GESTIONNAIRE PRINCIPAL =====
    handleLogRequest(detail) {
        const { type, ...data } = detail;

        switch(type) {
            // GROUPES
            case 'group-selected':
                this.logGroupSelected(data.groupId, data.displayGroupId, data.padCount);
                break;
            case 'group-deselected':
                this.logGroupDeselected();
                break;
            case 'group-mapping':
                this.logGroupMapping(data.displayGroupId, data.effectiveGroupId, data.reason);
                break;
            case 'group-blocked':
                this.logGroupBlocked(data.groupId, data.reason);
                break;
            case 'group-assigned':
                this.logGroupAssigned(data.groupId, data.color, data.padCount);
                break;
            case 'group-assignment-blocked':
                this.logGroupAssignmentBlocked(data.groupId, data.reason);
                break;

            // PADS
            case 'pad-assigned':
                this.logPadAssigned(data.padNumber, data.color);
                break;
            case 'pad-cleared':
                this.logPadCleared(data.padNumber);
                break;
            case 'pad-blocked':
                this.logPadBlocked(data.padNumber, data.reason);
                break;

            // SÉQUENCEUR
            case 'sequencer-toggle':
                this.logSequencerToggle(data.enabled);
                break;
            case 'sequencer-steps':
                this.logSequencerSteps(data.steps);
                break;
            case 'sequencer-activated':
                this.logSequencerActivated(data.groupId, data.padCount);
                break;
            case 'sequencer-restriction':
                this.logSequencerRestriction(data.reason, data.details);
                break;

            // CONFIGURATION
            case 'config-saved':
                this.logConfigSaved();
                break;
            case 'config-loaded':
                this.logConfigLoaded(data.padCount, data.groupCount);
                break;

            default:
                console.warn('Type de log non reconnu:', type);
        }
    },

    // ===== LOGS GROUPES =====
    logGroupSelected(groupId, displayGroupId, padCount) {
        if (groupId !== displayGroupId) {
            this.sendToConsole(`Groupe ${groupId} sélectionné (${padCount} pads)`, 'success');
        } else {
            this.sendToConsole(`Groupe ${displayGroupId} sélectionné (${padCount} pads)`, 'success');
        }
    },

    logGroupDeselected() {
        this.sendToConsole('Sélection annulée', 'info');
    },

    logGroupMapping(displayGroupId, effectiveGroupId, reason) {
        this.sendToConsole(`Groupe ${displayGroupId} → Groupe ${effectiveGroupId} (${reason})`, 'info');
    },

    logGroupBlocked(groupId, reason) {
        this.sendToConsole(`Groupe ${groupId} bloqué: ${reason}`, 'warning');
    },

    logGroupAssigned(groupId, color, padCount) {
        const colorText = color || 'effacé';
        this.sendToConsole(`Groupe ${groupId} → ${colorText} (${padCount} pads)`, 'success');
    },

    logGroupAssignmentBlocked(groupId, reason) {
        this.sendToConsole(`Assignation bloquée: Groupe ${groupId} ${reason}`, 'warning');
    },

    // ===== LOGS PADS =====
    logPadAssigned(padNumber, color) {
        this.sendToConsole(`Pad ${padNumber} → ${color}`, 'success');
    },

    logPadCleared(padNumber) {
        this.sendToConsole(`Pad ${padNumber} → effacé`, 'info');
    },

    logPadBlocked(padNumber, reason) {
        this.sendToConsole(`Pad ${padNumber} non disponible: ${reason}`, 'warning');
    },

    // ===== LOGS SÉQUENCEUR =====
    logSequencerToggle(enabled) {
        if (enabled) {
            this.sendToConsole('Séquenceur activé', 'success');
        } else {
            this.sendToConsole('Séquenceur désactivé', 'info');
        }
    },

    logSequencerSteps(steps) {
        this.sendToConsole(`Mode ${steps} steps`, 'info');
    },

    logSequencerActivated(groupId, padCount) {
        this.sendToConsole(`Séquenceur actif → Groupe ${groupId} (${padCount} pads)`, 'success');
    },

    logSequencerRestriction(reason, details = {}) {
        switch(reason) {
            case 'switch-32-blocked':
                this.sendToConsole('Switch 32 bloqué: Groupes 1 ou 2 ont des assignations couleurs', 'warning');
                break;
            case 'sequencer-active':
                this.sendToConsole('Séquenceur actif', 'warning');
                break;
            default:
                this.sendToConsole(`Restriction: ${reason}`, 'warning');
        }
    },

    // ===== LOGS MIDI =====
    logMidiStatus(connected, message) {
        if (connected) {
            this.sendToConsole('APC Mini connecté', 'success');
        } else {
            if (message.includes('non détecté')) {
                this.sendToConsole('Connecter APC Mini', 'error');
            } else if (message.includes('déconnecté')) {
                this.sendToConsole('APC Mini déconnecté', 'error');
            } else if (message.includes('non supportée')) {
                this.sendToConsole('Incompatibilité matérielle', 'error');
            } else {
                this.sendToConsole(message, 'error');
            }
        }
    },

    // ===== LOGS CONFIGURATION =====
    logConfigSaved() {
        this.sendToConsole('Configuration sauvée', 'success');
    },

    logConfigLoaded(padCount, groupCount) {
        if (padCount > 0 || groupCount > 0) {
            this.sendToConsole(`Configuration chargée: ${padCount} pads, ${groupCount} groupes`, 'success');
        }
    },

    // ===== ENVOI VERS CONSOLE UI =====
    sendToConsole(message, type = 'info') {
        if (window.Console && window.Console.log) {
            window.Console.log(message, type);
        }
    },

    // ===== API PUBLIQUE =====
    logGroup(action, data) {
        window.dispatchEvent(new CustomEvent('console-log-request', {
            detail: { type: `group-${action}`, ...data }
        }));
    },

    logPad(action, data) {
        window.dispatchEvent(new CustomEvent('console-log-request', {
            detail: { type: `pad-${action}`, ...data }
        }));
    },

    logSequencer(action, data) {
        window.dispatchEvent(new CustomEvent('console-log-request', {
            detail: { type: `sequencer-${action}`, ...data }
        }));
    },

    logConfig(action, data) {
        window.dispatchEvent(new CustomEvent('console-log-request', {
            detail: { type: `config-${action}`, ...data }
        }));
    },

    // ===== HELPERS RAPIDES =====
    success(message) {
        this.sendToConsole(message, 'success');
    },

    warning(message) {
        this.sendToConsole(message, 'warning');
    },

    error(message) {
        this.sendToConsole(message, 'error');
    },

    info(message) {
        this.sendToConsole(message, 'info');
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.ConsoleLogs = ConsoleLogs;
}