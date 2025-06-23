const Console = {

    // ===== ÉTAT CONSOLE SIMPLIFIÉ =====
    isInitialized: false,
    logs: [],
    maxLogs: 50, // ✅ RÉDUIT : 1000 → 50 (suffisant pour debug)

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
                    <div class="connection-status" id="connectionStatus">Déconnecté</div>
                    <button class="console-clear" id="consoleClearBtn">Clear</button>
                </div>

                <div class="console-content" id="consoleContent">
                    <!-- Logs dynamiques -->
                </div>
                
            </div>
        `;
    },

    // ===== ÉVÉNEMENTS ESSENTIELS =====
    setupEventListeners() {
        // Bouton clear
        document.addEventListener('click', (e) => {
            if (e.target.id === 'consoleClearBtn') {
                this.clearConsole();
            }
        });

        // ✅ LOGS ESSENTIELS UNIQUEMENT
        
        // MIDI Status
        window.addEventListener('midi-status-changed', (event) => {
            const { connected, message } = event.detail;
            this.updateConnectionStatus(connected, message);
            this.addLog(message, connected ? 'success' : 'error');
        });

        // Assignations Pads (feedback utilisateur important)
        window.addEventListener('pad-assigned', (event) => {
            const { padNumber, color } = event.detail;
            this.addLog(`Pad ${padNumber} → ${color}`, 'success');
        });

        window.addEventListener('group-assigned', (event) => {
            const { groupId, color } = event.detail;
            this.addLog(`Groupe ${groupId} → ${color}`, 'success');
        });

        // Séquenceur (états importants)
        window.addEventListener('sequencer-activated', (event) => {
            const { groupId, activated, steps } = event.detail;
            if (activated) {
                this.addLog(`Séquenceur Groupe ${groupId}: ${steps} steps`, 'info');
            } else {
                this.addLog('Séquenceur désactivé', 'info');
            }
        });

        // Erreurs critiques
        window.addEventListener('console-log', (event) => {
            const { message, type } = event.detail;
            if (type === 'error' || type === 'system') {
                this.addLog(message, type);
            }
        });
    },

    // ===== SYSTÈME DE LOGS OPTIMISÉ =====
    addLog(message, type = 'info') {
        const logEntry = {
            message,
            type,
            timestamp: this.getTimestamp(),
            id: Date.now() + Math.random()
        };

        // Ajouter au tableau
        this.logs.push(logEntry);

        // ✅ LIMITE SIMPLE : garder seulement les derniers
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
            this.refreshDisplay(); // Nettoyer DOM aussi
        } else {
            this.displayLog(logEntry);
        }
    },

    displayLog(logEntry) {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.type}`;
        logElement.innerHTML = `
            <span class="timestamp">${logEntry.timestamp}</span>
            <span class="log-message">${this.escapeHtml(logEntry.message)}</span>
        `;

        consoleContent.appendChild(logElement);
        this.scrollToBottom();
    },

    clearConsole() {
        this.logs = [];
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.innerHTML = '';
        }
        this.addLog('Console cleared', 'system');
    },

    refreshDisplay() {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;

        consoleContent.innerHTML = '';
        this.logs.forEach(logEntry => this.displayLog(logEntry));
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

    // ===== MÉTHODES PUBLIQUES ESSENTIELLES =====
    log(message, type = 'info') {
        this.addLog(message, type);
    },

    error(message) {
        this.addLog(message, 'error');
    },

    success(message) {
        this.addLog(message, 'success');
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