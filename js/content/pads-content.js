const PadsContent = {

    /* ===== STYLE CSS REQUIS =====
     * À ajouter dans pads-content.css :
     * 
     * .pad-grid.sequencer-mode .pad:hover {
     *     border-color: #ffffff !important;
     *     background: rgba(255, 255, 255, 0.1);
     * }
     */

    // ===== ÉTAT =====
    selectedPad: null,
    padColors: {},
    isInitialized: false,
    currentMode: 'pads', // 'pads' ou 'groups'
    sequencerActive: false,
    sequencerGroup: null, // 2 ou 3

    // ===== CRÉATION GRILLE PADS =====
    create() {
        return `
            <div class="pad-grid">
                ${this.generatePads()}
            </div>
        `;
    },

    // ===== GÉNÉRATION 64 PADS =====
    generatePads() {
        let padsHTML = '';
        
        // Grille 8x8 = 64 pads
        // Numérotation : Row 8 = Pads 57-64, Row 7 = 49-56, etc.
        for (let row = 8; row >= 1; row--) {
            for (let col = 1; col <= 8; col++) {
                const padNumber = ((row - 1) * 8) + col;
                const midiNote = padNumber - 1; // MIDI = 0-63
                
                padsHTML += this.createPad(padNumber, midiNote);
            }
        }
        
        return padsHTML;
    },

    // ===== CRÉATION PAD INDIVIDUEL =====
    createPad(padNumber, midiNote) {
        return `
            <div class="pad" 
                 data-pad-number="${padNumber}" 
                 data-midi-note="${midiNote}"
                 title="Pad ${padNumber} (MIDI: ${midiNote})">
                <span class="pad-number">${padNumber}</span>
            </div>
        `;
    }
};

// ===== EXPORT GLOBAL =====
if (typeof window !== 'undefined') {
    window.PadsContent = PadsContent;
}