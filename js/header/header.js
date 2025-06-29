const Header = {

    // ===== ÉTAT =====
    currentView: 'pads',

    // ===== INITIALISATION =====
    init() {
        this.createHeader();
        this.setupEventListeners();
    },

    // ===== CRÉATION CONTENU =====
    createHeader() {
        const headerContainer = document.getElementById('headerContainer');
        if (!headerContainer) return;

        headerContainer.innerHTML = `
            <div class="header-title">
                <h1>AKAI APC MINI MK1</h1>
            </div>
            
            <div class="header-navigation">
                <button class="header-btn active" data-view="pads">Pads</button>
                <button class="header-btn" data-view="sequencer">Sequenceur</button>
                <button class="header-btn" data-view="export">Export</button>
            </div>
        `;
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        const headerButtons = document.querySelectorAll('.header-btn[data-view]');

        headerButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewId = button.dataset.view;
                this.switchView(viewId);
            });
        });
    },

    // ===== NAVIGATION VUES =====
    switchView(viewId) {
        if (this.currentView === viewId) return;

        this.currentView = viewId;

        // Mettre à jour boutons navigation
        document.querySelectorAll('.header-btn[data-view]').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Notifier changement de vue
        window.dispatchEvent(new CustomEvent('view-changed', {
            detail: { view: viewId }
        }));
    },

    // ===== STATUT CONNEXION =====
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        this.isConnected = connected;

        if (connected) {
            statusElement.textContent = 'Connecté';
            statusElement.classList.add('connected');
        } else {
            statusElement.textContent = 'Déconnecté';
            statusElement.classList.remove('connected');
        }
    },

    // ===== GETTERS =====
    getCurrentView() {
        return this.currentView;
    },

    getConnectionStatus() {
        return this.isConnected;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.Header = Header;
}