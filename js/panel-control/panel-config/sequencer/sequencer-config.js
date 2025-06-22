const SequencerConfig = {
    
    // ===== TEMPLATE PRINCIPAL =====
    create() {
        return `
            <div class="sequencer-panel">
                
                <!-- Feedback Principal -->
                <div class="seq-feedback">
                    <div class="feedback-title">Groupe : <span id="groupDisplay">Aucun</span></div>
                    
                    <div class="feedback-row">
                        <span>Scale :</span>
                        <span id="scaleDisplay">Major</span>
                    </div>
                    
                    <div class="feedback-row">
                        <span>Octave :</span>
                        <div class="octave-controls">
                            <button class="octave-btn" data-octave="-1">−</button>
                            <span id="octaveDisplay">0</span>
                            <button class="octave-btn" data-octave="+1">+</button>
                        </div>
                    </div>
                    
                    <div class="feedback-row">
                        <span>Swing :</span>
                        <span id="swingDisplay">50%</span>
                    </div>
                </div>
                
                <!-- Status -->
                <div class="seq-status">
                    <div class="status-title">État Séquenceur</div>
                    
                    <div class="status-row">
                        <span>Mode :</span>
                        <span id="modeDisplay">steps</span>
                    </div>
                    
                    <div class="status-row">
                        <span>Steps :</span>
                        <span id="stepsDisplay">0/16</span>
                    </div>
                    
                    <div class="status-row">
                        <span>Bars :</span>
                        <span id="barsDisplay">4</span>
                    </div>
                    
                    <div class="status-row">
                        <span>État :</span>
                        <span id="playingDisplay">Arrêté</span>
                    </div>
                </div>
                
            </div>
        `;
    }
};

// Export global
window.SequencerConfig = SequencerConfig;