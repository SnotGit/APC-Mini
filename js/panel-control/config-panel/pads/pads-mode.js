const PadModeTemplate = {
    
    render(padNumber = null, midiNote = null) {
        return `
            <div class="pad-mode-container">
                    <div class="info-section">
                    <div class="info-title">
                        INFOS PAD
                    </div>
                    <div class="pad-info" id="padInfo">
                        ${this.getPadInfoText(padNumber, midiNote)}
                    </div>
                </div>
            </div>
        `;
    },

    getPadInfoText(padNumber, midiNote) {
        if (padNumber !== null && midiNote !== null) {
            return `NUMERO PAD ${padNumber} / NOTE PAD ${midiNote}`;
        }
        return 'NUMERO PAD / NOTE PAD';
    },

    updatePadInfo(padNumber, midiNote) {
        const infoElement = document.getElementById('padInfoContent');
        if (infoElement) {
            infoElement.textContent = this.getPadInfoText(padNumber, midiNote);
        }
    }
};