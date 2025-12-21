(function() {
    const GAME_ID = 'arena';
    let gameContainer = null;

    function startGame(ctx) {
        const termDisplay = document.getElementById('term-display');
        if (!termDisplay) return 'Error: Terminal display not found.';
        
        if (gameContainer) return 'Arena is already running.';

        // Create a full-screen container within the terminal
        gameContainer = document.createElement('div');
        gameContainer.id = 'arena-terminal-container';
        Object.assign(gameContainer.style, {
            position: 'absolute',
            inset: '0',
            background: '#000',
            zIndex: '50',
            display: 'flex',
            flexDirection: 'column'
        });

        const iframe = document.createElement('iframe');
        iframe.src = 'games/arena/arena-window.html';
        iframe.allow = "autoplay";
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
        });
        iframe.setAttribute('title', 'The Elder Scrolls: Arena');
        
        gameContainer.appendChild(iframe);
        
        // Hide terminal content
        Array.from(termDisplay.children).forEach(child => {
            if (child !== gameContainer) child.style.display = 'none';
        });

        termDisplay.appendChild(gameContainer);
        
        if (typeof ctx.enterGameMode === 'function') ctx.enterGameMode();
        if (typeof window.showExitButton === 'function') window.showExitButton();
        
        // Listen for exit message from iframe
        const handleMessage = (event) => {
            if (event.data === 'arena-exit') {
                window.removeEventListener('message', handleMessage);
                stopGame(ctx);
            }
        };
        window.addEventListener('message', handleMessage);

        // Focus the iframe
        setTimeout(() => iframe.focus(), 500);

        return null; // Return nothing to avoid extra text in terminal
    }

    function stopGame(ctx) {
        const termDisplay = document.getElementById('term-display');
        if (!termDisplay || !gameContainer) return null;

        // Remove Game
        if (gameContainer.parentNode === termDisplay) {
            termDisplay.removeChild(gameContainer);
        }
        gameContainer = null;

        // Restore terminal content
        Array.from(termDisplay.children).forEach(child => {
            if (child.id === 'term-current-line') {
                child.style.display = 'flex';
            } else {
                child.style.display = '';
            }
        });

        if (ctx && typeof ctx.exitGameMode === 'function') ctx.exitGameMode();
        if (typeof window.hideExitButton === 'function') window.hideExitButton();
        
        // Scroll to bottom
        requestAnimationFrame(() => {
            termDisplay.scrollTop = termDisplay.scrollHeight;
        });

        return 'Arena session ended.';
    }

    window.TerminalGameRegistry.register({
        id: GAME_ID,
        title: 'The Elder Scrolls: Arena',
        description: 'The Elder Scrolls: Arena, an open-world RPG and the grandfather of Skyrim.',
        help: [
            'arena         - The Elder Scrolls: Arena'
        ],
        commands: (ctx) => ({
            arena: () => startGame(ctx)
        }),
        isRunning: () => Boolean(gameContainer),
        stop: (ctx) => stopGame(ctx)
    });
})();
