
function updateAppState(bars) {
    if (bars === 4) {
        // STATE: 4 bars mode
        console.log('Mode 4 bars activé');
        // Add your 4 bars logic here
        // Example: show/hide elements, change colors, update UI
        
    } else if (bars === 8) {
        // STATE: 8 bars mode  
        console.log('Mode 8 bars activé');
        // Add your 8 bars logic here
        // Example: show different mode, change layout
        
    }
}

/**
 * Create the sequencer mode HTML element
 */
function createSequencerMode() {
    const container = document.createElement('div');
    container.className = 'sequencer-mode';
    
    container.innerHTML = `
        <label class="sequencer-toggle">
            <input type="checkbox" id="sequencerToggle">
            Activer Séquenceur
        </label>
        
        <label class="tab-switch">
            <input type="checkbox" id="barsToggle">
            <div class="tab-switch-container">
                <span class="tab-option">4 bars</span>
                <span class="tab-option">8 bars</span>
            </div>
        </label>
    `;
    
    return container;
}


function addSequencerEvents() {
    const sequencerToggle = document.getElementById('sequencerToggle');
    const barsToggle = document.getElementById('barsToggle');
    
    // Event for enabling/disabling sequencer
    sequencerToggle.addEventListener('change', function() {
        console.log('Séquenceur:', this.checked ? 'Activé' : 'Désactivé');
    });
    
    // Event for changing number of bars
    barsToggle.addEventListener('change', function() {
        // Logic: checked = 4 bars, unchecked = 8 bars
        const bars = this.checked ? 4 : 8;
        console.log(`${bars} bars sélectionné`);
        
        // STATE MANAGEMENT - Handle different states
        updateAppState(bars);
    });
    
    // Allow clicking on tab switch options
    document.querySelectorAll('.tab-option').forEach((option, index) => {
        option.addEventListener('click', () => {
            // index 0 = "4 bars" → checked = true
            // index 1 = "8 bars" → checked = false
            const shouldBeChecked = index === 0;
            
            if (barsToggle.checked !== shouldBeChecked) {
                barsToggle.checked = shouldBeChecked;
                barsToggle.dispatchEvent(new Event('change'));
            }
        });
    });
}


function initializeSequencerMode() {
    const zone = document.getElementById('sequencer-zone');
    const sequencerMode = createSequencerMode();
    
    // Add to page
    zone.appendChild(sequencerMode);
    
    // Add event listeners
    addSequencerEvents();
}


document.addEventListener('DOMContentLoaded', initializeSequencerMode);