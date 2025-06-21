const PadConfigTemplate = {
    
    /**
     * Template spécifique à la vue PADS
     * Structure : Header (Pad/Groupe) + Content + Colors
     * HTML PUR - Classes originales
     */
    render() {
        return `
            <div class="config-pads-container">
                
                <!-- Header : Boutons Pad/Groupe -->
                <div class="config-mode-selector">
                    <button class="mode-btn active" data-mode="pad">
                        Pad
                    </button>
                    <button class="mode-btn" data-mode="group">
                        Groupe
                    </button>
                </div>

                <!-- Zone centrale : Contenu dynamique selon mode -->
                <div class="config-pads-content" id="configPadsContent">
                    <!-- Contenu injecté par pad-mode ou group-mode templates -->
                </div>

                <!-- Footer : Boutons couleurs -->
                <div class="color-section">
                    <button class="color-btn green" data-color="green" title="Vert">
                    </button>
                    <button class="color-btn yellow" data-color="yellow" title="Jaune">
                    </button>
                    <button class="color-btn red" data-color="red" title="Rouge">
                    </button>
                    <button class="color-btn clear" data-color="clear" title="Effacer">
                        CLEAR
                    </button>
                </div>

            </div>
        `;
    }
};