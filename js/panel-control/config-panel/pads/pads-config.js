const PadsConfig = {
    
    create() {
        return `
            <div class="pads-panel">
                
                <!-- Header Mode Selector -->
                <div class="config-mode-selector">
                    <button class="mode-btn active" data-mode="pads">Pad</button>
                    <button class="mode-btn" data-mode="groupes">Groupe</button>
                </div>
                
                <!-- Content Zone (qui change) -->
                <div id="configZone">
                    ${this.createPadsMode()}
                </div>
                
            </div>
        `;
    },

    createPadsConfig() {
        return `
            <div class="pad-info">
                <div class="pad-info-title">INFOS PAD</div>
                <div class="pad-info" id="padInfo">NUMERO PAD / NOTE PAD</div>
            </div>
            
            <div class="color-section">
                <button class="color-btn green" data-color="green"></button>
                <button class="color-btn yellow" data-color="yellow"></button>
                <button class="color-btn red" data-color="red"></button>
                <button class="color-btn clear" data-color="clear">CLEAR</button>
            </div>
        `;
    },


};

window.PadsConfig = PadsConfig;