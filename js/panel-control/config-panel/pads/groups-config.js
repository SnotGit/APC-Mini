const groupsMode = {

    createGroupesMode() {
        return `
            <div class="groups-section">
                <button class="group-btn" data-group="1">GROUPE 1</button>
                <button class="group-btn" data-group="2">GROUPE 2</button>
                <button class="group-btn" data-group="3">GROUPE 3</button>
                <button class="group-btn" data-group="4">GROUPE 4</button>
                
                <div class="sequencer-controls">
                    <label class="sequencer-toggle">
                        <input type="checkbox" id="sequencerToggle">
                        Activer Séquenceur
                    </label>
                    
                    <div class="bars-switch" id="barsSwitch">
                        <input type="radio" name="bars" value="4" id="bars4" checked>
                        <label for="bars4">4 bars</label>
                        <input type="radio" name="bars" value="8" id="bars8">
                        <label for="bars8">8 bars</label>
                    </div>
                </div>
            </div>
            
            <div class="color-section">
                <button class="color-btn green" data-color="green"></button>
                <button class="color-btn yellow" data-color="yellow"></button>
                <button class="color-btn red" data-color="red"></button>
                <button class="color-btn clear" data-color="clear">CLEAR</button>
            </div>
        `;
    }

};

window.GroupsMode = groupsMode;