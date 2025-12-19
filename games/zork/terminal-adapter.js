/**
 * Zork terminal adapter (bridges the Zork engine to the site terminal).
 */
(function () {
    const registry = window.TerminalGameRegistry;
    if (!registry) return;

    function isRunning() {
        try {
            return Boolean(window.ZorkGame && window.ZorkGame.isRunning());
        } catch {
            return false;
        }
    }

    function stop(ctx) {
        if (!isRunning()) return null;
        window.ZorkGame.stop();
        if (typeof ctx?.exitGameMode === 'function') ctx.exitGameMode();
        return 'Exited Zork.';
    }

    function start(ctx) {
        if (!window.ZorkGame) return 'Error: Zork game not loaded.';
        if (isRunning()) return 'Zork is already running!';

        if (typeof ctx?.enterGameMode === 'function') ctx.enterGameMode();

        window.ZorkGame.start((text) => {
            const printer = ctx?.printStaticOutput || window.printStaticOutput;
            if (typeof printer === 'function') printer(text, true);
        });

        return "Starting Zork1: The Great Underground Empire...\nType 'quit' at any time to exit the game.\n";
    }

    function handleInput(rawInput, ctx) {
        const input = (rawInput || '').trim();
        if (!input) return null;

        if (input.toLowerCase() === 'quit') return stop(ctx);
        if (!window.ZorkGame) return 'Error: Zork game not loaded.';

        window.ZorkGame.sendInput(input);
        return null;
    }

    registry.register({
        id: 'zork',
        title: 'Zork',
        description: "Classic text adventure. Type 'zork' to explore The Great Underground Empire.",
        help: ['zork          - Play Zork1: The Great Underground Empire'],
        isRunning,
        stop,
        handleInput,
        commands: (ctx) => ({
            zork: () => start(ctx)
        })
    });
})();
