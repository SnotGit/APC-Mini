const PadsConfig = {

    // ===== ÉTAT =====
    currentMode: 'pads', // 'pads' ou 'groups'
    isInitialized: false,

    // ===== CRÉATION TEMPLATE PRINCIPAL =====
    create() {
        return `
            <div class="pads-config-container">
                <!-- Header fixe : boutons PADS/GROUPES -->
                <div id="selectModeContainer">
                    ${window.SelectMode ? window.SelectMode.create() : ''}
                </div>

                <!-- Content dynamique selon mode -->
                <div class="config-content-container" id="configContentContainer">
                    ${this.createInitialContent()}
                </div>

                <!-- Footer fixe : boutons couleurs -->
                <div id="padsColorsContainer">
                    ${window.PadsColors ? window.PadsColors.create() : ''}
                </div>
            </div>
        `;
    },

    createInitialContent() {
        // Mode pads par défaut
        return window.PadsMode ? window.PadsMode.create() : '';
    },

    // ===== INITIALISATION =====
    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.initSubModules();
        
        this.isInitialized = true;
    },

    initSubModules() {
        // Initialiser les sous-modules
        if (window.SelectMode && window.SelectMode.init) {
            window.SelectMode.init();
        }
        if (window.PadsMode && window.PadsMode.init) {
            window.PadsMode.init();
        }
        if (window.PadsColors && window.PadsColors.init) {
            window.PadsColors.init();
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Écouter changement de mode depuis select-mode
        window.addEventListener('config-mode-changed', (event) => {
            const { mode } = event.detail;
            this.switchContentMode(mode);
        });

        // Écouter sélection groupe depuis groups-mode
        window.addEventListener('group-selected', (event) => {
            // Relayer vers pads-colors pour qu'il sache quel groupe est sélectionné
            window.dispatchEvent(new CustomEvent('group-selected', {
                detail: event.detail
            }));
        });

        // Écouter demande couleur groupe depuis pads-colors
        window.addEventListener('apply-group-color-request', (event) => {
            const { groupId, groupPads, color } = event.detail;
            this.handleGroupColorRequest(groupId, groupPads, color);
        });
    },

    // ===== CHANGEMENT CONTENU =====
    switchContentMode(mode) {
        this.currentMode = mode;
        
        const contentContainer = document.getElementById('configContentContainer');
        if (!contentContainer) return;

        // Changer le contenu selon le mode
        if (mode === 'pads') {
            contentContainer.innerHTML = window.PadsMode ? window.PadsMode.create() : '';
            // Réinitialiser pads-mode
            if (window.PadsMode && window.PadsMode.init) {
                window.PadsMode.init();
            }
        } else if (mode === 'groups') {
            contentContainer.innerHTML = window.GroupsMode ? window.GroupsMode.create() : '';
            // Réinitialiser groups-mode  
            if (window.GroupsMode && window.GroupsMode.init) {
                window.GroupsMode.init();
            }
        }
    },

    // ===== GESTION COULEURS GROUPES =====
    handleGroupColorRequest(groupId, groupPads, color) {
        // Vérifier via groups-mode si l'application est autorisée
        if (window.GroupsMode && window.GroupsMode.applyGroupColor) {
            window.GroupsMode.applyGroupColor(color);
        }
    },

    // ===== UTILITAIRES =====
    getCurrentMode() {
        return this.currentMode;
    },

    refresh() {
        // Rafraîchir l'affichage
        if (this.isInitialized) {
            this.switchContentMode(this.currentMode);
        }
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsConfig = PadsConfig;
}