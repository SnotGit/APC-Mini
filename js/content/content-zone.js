const ContentZone = {

    // ===== ÉTAT =====
    currentView: null,
    isInitialized: false,

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;
        
        this.createViewPanels();
        this.setupEventListeners();
        this.isInitialized = true;
    },

    // ===== CRÉATION STRUCTURE DOM =====
    createViewPanels() {
        const contentZone = document.querySelector('.content-zone');
        if (contentZone) {
            contentZone.innerHTML = `
                <div class="view-panel" id="padsView"></div>
                <div class="view-panel" id="sequencerView"></div>
                <div class="view-panel" id="exportView"></div>
            `;
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Écouter changements de vue depuis header ou app
        window.addEventListener('view-changed', (event) => {
            const { view } = event.detail;
            this.switchView(view);
        });

        // Écouter demandes directes de switch
        window.addEventListener('content-zone-switch', (event) => {
            const { view } = event.detail;
            this.switchView(view);
        });
    },

    // ===== GESTION VUES =====
    switchView(viewId) {
        if (this.currentView === viewId) return;
        
        this.currentView = viewId;

        // Masquer toutes les vues
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Afficher vue demandée
        const targetView = document.getElementById(`${viewId}View`);
        if (targetView) {
            targetView.classList.add('active');
            
            // Charger contenu si vide
            this.loadViewContent(viewId, targetView);
        }
    },

    // ===== CHARGEMENT CONTENU =====
    loadViewContent(viewId, container) {
        // Si container déjà rempli, pas besoin de recharger
        if (container.innerHTML.trim() !== '') {
            return;
        }

        let contentModule = null;

        switch (viewId) {
            case 'pads':
                contentModule = window.PadsContent;
                break;
            case 'sequencer':
                contentModule = window.SequencerContent;
                break;
            case 'export':
                contentModule = window.ExportContent;
                break;
        }

        if (contentModule && contentModule.create) {
            try {
                // Générer contenu
                container.innerHTML = contentModule.create();
                
                // Initialiser module
                if (contentModule.init) {
                    contentModule.init();
                }
            } catch (error) {
                container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
            }
        } else {
            container.innerHTML = `<div class="placeholder">Module ${viewId} en développement</div>`;
        }
    },

    // ===== API PUBLIQUE =====
    getCurrentView() {
        return this.currentView;
    },

    showView(viewId) {
        this.switchView(viewId);
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.ContentZone = ContentZone;
}