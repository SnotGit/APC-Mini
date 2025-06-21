const Console = {

    // ===== ÉTAT =====
    isInitialized: false,
    logs: [],
    maxLogs: 100,

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="console-container">
                <div class="console-header">
                    <div class="console-title">Console</div>
                    <div class="connection-status" id="connectionStatus"></div>
                    <button class="console-clear" id="consoleClearBtn">Clear</button>
                </div>

                <div class="console-content" id="consoleContent">
                    <!-- Logs ici -->
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;

        this.createConsole();
        this.setupEventListeners();
        
        this.isInitialized = true;
    },

    createConsole() {
        const consoleContainer = document.getElementById('consoleContainer');
        if (consoleContainer) {
            consoleContainer.innerHTML = this.create();
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Bouton clear console
        document.addEventListener('click', (e) => {
            if (e.target.id === 'consoleClearBtn') {
                this.clearConsole();
            }
        });

        // Écouter logs depuis app
        window.addEventListener('console-log', (event) => {
            const { message, type } = event.detail;
            this.addLog(message, type);
        });

        // Écouter événements assignation pads
        window.addEventListener('pad-assigned', (event) => {
            const { padNumber, color } = event.detail;
            this.addLog(`Pad ${padNumber} → ${color}`, 'success');
        });

        // Écouter événements assignation groupes  
        window.addEventListener('group-assigned', (event) => {
            const { groupId, color } = event.detail;
            this.addLog(`Groupe ${groupId} → ${color}`, 'success');
        });

        // Écouter activation séquenceur
        window.addEventListener('sequencer-activated', (event) => {
            const { groupId, activated, steps } = event.detail;
            if (activated) {
                this.addLog(`Séquenceur Groupe ${groupId}: ${steps} steps`, 'info');
            } else {
                this.addLog(`Séquenceur désactivé`, 'info');
            }
        });

        // Écouter changement steps séquenceur
        window.addEventListener('sequencer-steps-changed', (event) => {
            const { groupId, steps } = event.detail;
            this.addLog(`Séquenceur Groupe ${groupId}: ${steps} steps`, 'info');
        });
    },

    // ===== SYSTÈME DE LOGS =====
    log(message, type = 'info') {
        this.addLog(message, type);
    },

    addLog(message, type = 'info') {
        const timestamp = this.getTimestamp();
        const logEntry = {
            message,
            type,
            timestamp,
            id: Date.now() + Math.random()
        };

        // Ajouter au tableau
        this.logs.unshift(logEntry);

        // Limiter nombre de logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Afficher dans interface
        this.displayLog(logEntry);
    },

    displayLog(logEntry) {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.type}`;
        logElement.innerHTML = `
            <span class="timestamp">${logEntry.timestamp}</span>
            ${logEntry.message}
        `;

        // Insérer en haut (logs récents en premier)
        consoleContent.insertBefore(logElement, consoleContent.firstChild);

        // Auto-scroll si nécessaire
        this.autoScroll();
    },

    autoScroll() {
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            // Si utilisateur n'a pas scrollé manuellement, auto-scroll
            const isScrolledToBottom = consoleContent.scrollTop <= 10;
            if (isScrolledToBottom) {
                consoleContent.scrollTop = 0;
            }
        }
    },

    clearConsole() {
        this.logs = [];
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.innerHTML = '';
        }
    },

    // ===== STATUS CONNEXION MIDI =====
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        if (connected) {
            statusElement.textContent = 'Connecté';
            statusElement.classList.add('connected');
            this.addLog('APC Mini connecté', 'success');
        } else {
            statusElement.textContent = 'Déconnecté';
            statusElement.classList.remove('connected');
            this.addLog('APC Mini déconnecté', 'error');
        }
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

    // ===== API PUBLIQUE =====
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
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.Console = Console;
}