
class App {
    constructor() {
        this.header = null;
        this.init();
    }

    async init() {
        await this.loadHeader();
    }

    async loadHeader() {
        try {
            // Header is already loaded as a script, use the global object
            if (window.Header) {
                window.Header.init();
            } else {
                console.error('❌ Header object not found');
            }
        } catch (error) {
            console.error('❌ Header loading failed:', error);
        }
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    new App();
});