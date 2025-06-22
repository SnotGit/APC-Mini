const GroupsMode = {

    // ===== ÉTAT =====
    selectedGroup: null,

    // ===== GROUPES MAPPING =====
    groups: {
        1: { name: 'GROUPE 1', pads: [33,34,35,36,41,42,43,44,49,50,51,52,57,58,59,60] },
        2: { name: 'GROUPE 2', pads: [37,38,39,40,45,46,47,48,53,54,55,56,61,62,63,64] },
        3: { name: 'GROUPE 3', pads: [1,2,3,4,9,10,11,12,17,18,19,20,25,26,27,28] },
        4: { name: 'GROUPE 4', pads: [5,6,7,8,13,14,15,16,21,22,23,24,29,30,31,32] }
    },

    // ===== CRÉATION TEMPLATE =====
    create() {
        return `
            <div class="groups-section">
                <div class="groups-grid">
                    <button class="group-btn" data-group="1">GROUPE 1</button>
                    <button class="group-btn" data-group="2">GROUPE 2</button>
                    <button class="group-btn" data-group="3">GROUPE 3</button>
                    <button class="group-btn" data-group="4">GROUPE 4</button>
                </div>
                
                <div id="sequencerModeContainer">
                    <!-- Séquenceur injecté par sequencer-mode.js -->
                </div>
            </div>
        `;
    },

    // ===== INITIALISATION =====
    init() {
        this.setupEventListeners();
        
        // Initialiser sequencer-mode après insertion DOM
        if (window.SequencerMode && window.SequencerMode.init) {
            window.SequencerMode.init();
        }
    },

    // ===== ÉVÉNEMENTS =====
    setupEventListeners() {
        // Clics boutons groupes
        document.addEventListener('click', (e) => {
            const groupBtn = e.target.closest('.group-btn');
            if (groupBtn) {
                const groupId = parseInt(groupBtn.dataset.group);
                this.selectGroup(groupId);
            }
        });

        // Écouter état séquenceur depuis sequencer-mode
        window.addEventListener('sequencer-state-changed', (event) => {
            const { enabled, groupId } = event.detail;
            this.updateGroupButtons(enabled, groupId);
        });
    },

    // ===== SÉLECTION GROUPE =====
    selectGroup(groupId) {
        this.selectedGroup = groupId;
        
        // Mettre à jour boutons
        this.updateGroupButtons();
        
        // Notifier sequencer-mode du groupe sélectionné
        window.dispatchEvent(new CustomEvent('group-selected', {
            detail: { groupId }
        }));
        
        // Notifier highlight du groupe dans pads-content
        const groupPads = this.groups[groupId].pads;
        window.dispatchEvent(new CustomEvent('highlight-group', {
            detail: { groupPads }
        }));
    },

    updateGroupButtons(sequencerEnabled = false, sequencerGroupId = null) {
        document.querySelectorAll('.group-btn').forEach(btn => {
            const groupId = parseInt(btn.dataset.group);
            btn.classList.toggle('active', groupId === this.selectedGroup);
            
            // Border blanche si ce groupe a le séquenceur activé
            const hasSequencer = sequencerEnabled && groupId === sequencerGroupId;
            btn.classList.toggle('sequencer-active', hasSequencer);
        });
    },

    // ===== COULEURS GROUPES =====
    applyGroupColor(color) {
        if (!this.selectedGroup) return;
        
        const groupPads = this.groups[this.selectedGroup].pads;
        
        // Vérifier si séquenceur actif via sequencer-mode
        if (window.SequencerMode && window.SequencerMode.isActiveOnGroup(this.selectedGroup)) {
            return; // Pas de coloration en mode séquenceur
        }
        
        // Appliquer couleur au groupe
        window.dispatchEvent(new CustomEvent('apply-group-color', {
            detail: { groupPads, color }
        }));
    },

    // ===== GETTERS =====
    getSelectedGroup() {
        return this.selectedGroup;
    },

    getGroupPads(groupId) {
        return this.groups[groupId] ? this.groups[groupId].pads : [];
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.GroupsMode = GroupsMode;
}