(function() {
    const DOOM_ID = 'doom';
    let doomContainer = null;
    let originalDisplayStyles = null;

    function startDoom(ctx) {
        const termDisplay = document.getElementById('term-display');
        if (!termDisplay) return 'Error: Terminal display not found.';
        
        if (doomContainer) return 'DOOM is already running.';

        // Create a full-screen container within the terminal
        doomContainer = document.createElement('div');
        doomContainer.id = 'doom-terminal-container';
        Object.assign(doomContainer.style, {
            position: 'absolute',
            inset: '0',
            background: '#000',
            zIndex: '50',
            display: 'flex',
            flexDirection: 'column'
        });

        const iframe = document.createElement('iframe');
        iframe.src = 'games/doom/doom-window.html';
        iframe.allow = "autoplay";
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
        });
        iframe.setAttribute('title', 'DOOM');
        
        doomContainer.appendChild(iframe);
        
        // Hide terminal content
        Array.from(termDisplay.children).forEach(child => {
            if (child !== doomContainer) child.style.display = 'none';
        });

        termDisplay.appendChild(doomContainer);
        
        if (typeof ctx.enterGameMode === 'function') ctx.enterGameMode();
        if (typeof window.showExitButton === 'function') window.showExitButton();
        
        // Listen for exit message from iframe
        const handleMessage = (event) => {
            if (event.data === 'doom-exit') {
                window.removeEventListener('message', handleMessage);
                stopDoom(ctx);
            }
        };
        window.addEventListener('message', handleMessage);

        // Focus the iframe
        setTimeout(() => iframe.focus(), 500);

        return null; // Return nothing to avoid extra text in terminal
    }

    function stopDoom(ctx) {
        const termDisplay = document.getElementById('term-display');
        if (!termDisplay || !doomContainer) return null;

        // Remove Doom
        if (doomContainer.parentNode === termDisplay) {
            termDisplay.removeChild(doomContainer);
        }
        doomContainer = null;

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

        return 'DOOM session ended.';
    }

    window.TerminalGameRegistry.register({
        id: DOOM_ID,
        title: 'DOOM (Shareware)',
        description: 'The classic FPS that started it all.',
        help: [
            'doom          - Launch DOOM (Shareware 1.9)'
        ],
        commands: (ctx) => ({
            doom: () => startDoom(ctx)
        }),
        isRunning: () => Boolean(doomContainer),
        stop: (ctx) => stopDoom(ctx)
    });
})();
