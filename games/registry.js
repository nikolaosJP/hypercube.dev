/**
 * Terminal game registry + runtime.
 * Games live under `/games` and register themselves here.
 */
(function () {
    if (window.TerminalGameRegistry) return;

    const games = new Map();

    function normalizeId(id) {
        return String(id || '').trim().toLowerCase();
    }

    function register(game) {
        const id = normalizeId(game?.id);
        if (!id) throw new Error('TerminalGameRegistry.register: game.id is required');
        games.set(id, { ...game, id });
    }

    function list() {
        return Array.from(games.values());
    }

    function getActiveGame() {
        for (const game of games.values()) {
            try {
                if (typeof game.isRunning === 'function' && game.isRunning()) return game;
            } catch {
                // Ignore misbehaving games.
            }
        }
        return null;
    }

    function stopActiveGame(ctx) {
        const active = getActiveGame();
        if (!active) return null;
        if (typeof active.stop === 'function') return active.stop(ctx);
        return null;
    }

    function stopAllGames(ctx) {
        for (const game of games.values()) {
            try {
                if (typeof game.isRunning === 'function' && game.isRunning()) {
                    if (typeof game.stop === 'function') game.stop(ctx);
                }
            } catch {
                // Ignore misbehaving games.
            }
        }
    }

    function renderGamesList() {
        const entries = list()
            .map((game) => {
                const desc = game.description ? ` ${game.description}` : '';
                return `  - ${game.id}:${desc}`;
            })
            .sort((a, b) => a.localeCompare(b));

        if (entries.length === 0) return 'Games: (none loaded)';
        return `Games:\n${entries.join('\n')}`;
    }

    function getCommandHandlers(ctx) {
        const handlers = {
            games: () => renderGamesList(),
            quit: () => stopActiveGame(ctx) || 'No game is currently running.'
        };

        for (const game of games.values()) {
            try {
                if (typeof game.commands !== 'function') continue;
                const gameHandlers = game.commands(ctx) || {};
                for (const [cmd, fn] of Object.entries(gameHandlers)) {
                    if (typeof fn !== 'function') continue;
                    const key = normalizeId(cmd);
                    handlers[key] = fn;
                }
            } catch {
                // Ignore misbehaving games.
            }
        }

        return handlers;
    }

    function getHelpLines() {
        const lines = ['games         - List available console games'];
        const banned = ['zork', 'doom', 'riddles', 'riddle'];

        for (const game of list()) {
            if (!Array.isArray(game.help) || game.help.length === 0) continue;
            for (const line of game.help) {
                const normalized = String(line || '').trim();
                if (!normalized) continue;
                const firstWord = normalized.split(/\s+/)[0].toLowerCase();
                if (banned.includes(firstWord)) continue;
                lines.push(normalized);
            }
        }

        return lines;
    }

    window.TerminalGameRegistry = {
        register,
        list,
        getActiveGame,
        getCommandHandlers,
        getHelpLines,
        stopActiveGame,
        stopAllGames
    };
})();
