const Console = {

    // ===== ÉTAT CONSOLE =====
    isInitialized: false,
    logs: [],
    maxLogs: 1000,
    autoScroll: true,
    filters: {
        system: true,
        info: true,
        success: true,
        warning: true,
        error: true
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;

        this.createConsoleInterface();
        this.setupEventListeners();
        
        this.isInitialized = true;
        this.addLog('Console initialisée', 'system');
    },

    createConsoleInterface() {
        const consoleContainer = document.getElementById('consoleContainer');
        if (!consoleContainer) return;

        consoleContainer.innerHTML = this.createTemplate();
    },

    createTemplate() {
        return `
            <div class="console-container">
                <div class="console-header">
                    <div class="console-title">Console</div>
                    <div class="console-controls">
                        <div class="connection-status" id="connectionStatus">Déconnecté</div>
                        <button class="console-clear" id="consoleClearBtn">Clear</button>
                    </div>
                </div>

                <div class="console-content" id="consoleContent">
                    <!-- Logs dynamiques -->
                </div>
            </div>
        `;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Bouton clear
        document.addEventListener('click', (e) => {
            if (e.target.id === 'consoleClearBtn') {
                this.clearConsole();
            }
        });

        // Écouter logs depuis app et modules
        window.addEventListener('console-log', (event) => {
            const { message, type } = event.detail;
            this.addLog(message, type);
        });

        // Écouter statut MIDI depuis midi.js
        window.addEventListener('midi-status-changed', (event) => {
            const { connected, message } = event.detail;
            this.updateConnectionStatus(connected, message);
            this.addLog(message, connected ? 'success' : 'error');
        });

        // Écouter assignations depuis modules
        window.addEventListener('pad-assigned', (event) => {
            const { padNumber, color } = event.detail;
            this.addLog(`Pad ${padNumber} → ${color}`, 'success');
        });

        window.addEventListener('group-assigned', (event) => {
            const { groupId, color } = event.detail;
            this.addLog(`Groupe ${groupId} → ${color}`, 'success');
        });

        // Écouter séquenceur
        window.addEventListener('sequencer-activated', (event) => {
            const { groupId, activated, steps } = event.detail;
            if (activated) {
                this.addLog(`Séquenceur Groupe ${groupId}: ${steps} steps`, 'info');
            } else {
                this.addLog('Séquenceur désactivé', 'info');
            }
        });

        window.addEventListener('sequencer-steps-changed', (event) => {
            const { groupId, steps } = event.detail;
            this.addLog(`Séquenceur Groupe ${groupId}: ${steps} steps`, 'info');
        });
    },

    // ===== SYSTÈME DE LOGS =====
    addLog(message, type = 'info') {
        const timestamp = this.getTimestamp();
        const logEntry = {
            message,
            type,
            timestamp,
            id: Date.now() + Math.random()
        };

        // Ajouter au tableau
        this.logs.push(logEntry);

        // Limiter nombre de logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Afficher dans interface
        this.displayLog(logEntry);
    },

    displayLog(logEntry) {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;

        // Vérifier filtre
        if (!this.filters[logEntry.type]) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.type}`;
        logElement.dataset.logId = logEntry.id;
        logElement.innerHTML = `
            <span class="timestamp">${logEntry.timestamp}</span>
            <span class="log-message">${this.escapeHtml(logEntry.message)}</span>
        `;

        // Insérer en bas
        consoleContent.appendChild(logElement);

        // Auto-scroll si activé
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    },

    clearConsole() {
        this.logs = [];
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.innerHTML = '';
        }
        this.addLog('Console cleared', 'system');
    },

    scrollToBottom() {
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.scrollTop = consoleContent.scrollHeight;
        }
    },

    // ===== STATUT CONNEXION =====
    updateConnectionStatus(connected, message = null) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        if (connected) {
            statusElement.textContent = 'Connecté';
            statusElement.classList.add('connected');
        } else {
            statusElement.textContent = 'Déconnecté';
            statusElement.classList.remove('connected');
        }
    },

    // ===== MÉTHODES PUBLIQUES =====
    log(message, type = 'info') {
        this.addLog(message, type);
    },

    system(message) {
        this.addLog(message, 'system');
    },

    info(message) {
        this.addLog(message, 'info');
    },

    success(message) {
        this.addLog(message, 'success');
    },

    warning(message) {
        this.addLog(message, 'warning');
    },

    error(message) {
        this.addLog(message, 'error');
    },

    // ===== FILTRES =====
    setFilter(type, enabled) {
        if (this.filters.hasOwnProperty(type)) {
            this.filters[type] = enabled;
            this.refreshDisplay();
        }
    },

    refreshDisplay() {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;

        // Nettoyer affichage
        consoleContent.innerHTML = '';

        // Réafficher logs filtrés
        this.logs.forEach(logEntry => {
            if (this.filters[logEntry.type]) {
                this.displayLog(logEntry);
            }
        });
    },

    // ===== CONFIGURATION =====
    setAutoScroll(enabled) {
        this.autoScroll = enabled;
    },

    setMaxLogs(max) {
        this.maxLogs = Math.max(100, Math.min(5000, max));
        
        // Tronquer si nécessaire
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
            this.refreshDisplay();
        }
    },

    // ===== EXPORT/IMPORT =====
    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            filters: this.filters
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `console-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.addLog('Logs exportés', 'system');
    },

    // ===== GETTERS =====
    getLogCount() {
        return this.logs.length;
    },

    getLogsByType(type) {
        return this.logs.filter(log => log.type === type);
    },

    getRecentLogs(count = 10) {
        return this.logs.slice(-count);
    },

    // ===== UTILITAIRES =====
    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.Console = Console;
}