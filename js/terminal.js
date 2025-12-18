/**
 * Terminal configuration and command handling
 * Keeps the hero terminal self-contained and easy to edit.
 */
(function () {
    const bootLog = document.getElementById('boot-log');
    const termDisplay = document.getElementById('term-display');
    const termLine = document.getElementById('term-current-line');
    const termInput = document.getElementById('playground-input');
    const termPrompt = termLine ? termLine.querySelector('.prompt-command') : null;
    const terminalWindow = document.querySelector('.terminal-window');
    const terminalBar = terminalWindow ? terminalWindow.querySelector('.terminal-bar') : null;
    const TERMINAL_PROMPT = '[guest@hyperkube.dev ~]$';

    if (termPrompt) termPrompt.textContent = TERMINAL_PROMPT;
    const defaultPromptHTML = TERMINAL_PROMPT;

    if (!bootLog || !termDisplay || !termLine || !termInput) return;

    // Custom blinking cursor for Zork input (shows as "_")
    let zorkCursor = null;
    let measureSpan = null;
    let gameMode = false;
    let cachedInputStyles = null;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const themeProfiles = {
        matrix: { primary: '#22c55e', dim: 'rgba(34, 197, 94, 0.15)', windowBg: '#0b0f0c', bodyBg: '#050505', barBg: '#121212', border: '#1f2d1f', text: '#cdd7cf' },
        midnight: { primary: '#7dd3fc', dim: 'rgba(125, 211, 252, 0.12)', windowBg: '#0c1224', bodyBg: '#080d1a', barBg: '#0f182a', border: '#1e2a3d', text: '#c8d7ec' },
        retro: { primary: '#f4e87c', dim: 'rgba(244, 232, 124, 0.15)', windowBg: '#1f1b14', bodyBg: '#15120d', barBg: '#252016', border: '#3a301f', text: '#f3e9c2' },
        hacker: { primary: '#39ff14', dim: 'rgba(57, 255, 20, 0.18)', windowBg: '#050805', bodyBg: '#020402', barBg: '#0a110a', border: '#123212', text: '#d7fbd0' }
    };

    function applyTheme(choice) {
        const normalized = (choice || 'matrix').toLowerCase();
        const available = Object.keys(themeProfiles);
        const resolved = themeProfiles[normalized] ? normalized : 'matrix';
        const theme = themeProfiles[resolved];
        const target = terminalWindow;
        if (!target) return "Terminal not found.";

        target.dataset.termTheme = resolved;
        target.style.setProperty('--terminal-green', theme.primary);
        target.style.setProperty('--terminal-green-dim', theme.dim);
        target.style.setProperty('--border-color', theme.border);
        target.style.background = theme.windowBg;
        target.style.borderColor = theme.border;
        target.style.boxShadow = `0 20px 50px ${theme.dim}`;

        if (terminalBar) {
            terminalBar.style.background = theme.barBg;
            terminalBar.style.borderBottomColor = theme.border;
        }
        if (termDisplay) {
            termDisplay.style.background = theme.bodyBg;
            termDisplay.style.color = theme.text;
            termDisplay.style.borderColor = theme.border;
        }
        if (termPrompt) termPrompt.style.color = 'var(--terminal-green)';
        if (termInput) {
            termInput.style.color = 'var(--terminal-green)';
            termInput.style.caretColor = 'transparent';
        }

        if (!themeProfiles[normalized]) {
            return `Unknown theme "${choice}". Available: ${available.join(', ')}. Using matrix.`;
        }
        return `Theme set to ${resolved}.`;
    }

    function ensureCursorInfra() {
        if (!zorkCursor) {
            zorkCursor = document.createElement('span');
            zorkCursor.className = 'zork-cursor';
            zorkCursor.textContent = '|';
            Object.assign(zorkCursor.style, {
                position: 'absolute',
                display: 'none',
                color: 'var(--terminal-green)',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1',
                animation: 'blink var(--blink-speed) step-end infinite',
                pointerEvents: 'none',
                userSelect: 'none'
            });
            termLine.appendChild(zorkCursor);
        }
        if (!measureSpan) {
            measureSpan = document.createElement('span');
            measureSpan.style.visibility = 'hidden';
            measureSpan.style.position = 'absolute';
            measureSpan.style.whiteSpace = 'pre';
            measureSpan.style.pointerEvents = 'none';
            measureSpan.style.userSelect = 'none';
            termLine.appendChild(measureSpan);
        }
        termLine.style.position = 'relative';
    }

    function syncBlinkers() {
        // Optimized: Set duration once and let CSS handle sync
        const duration = '1.6s';
        document.documentElement.style.setProperty('--blink-speed', duration);
    }

    function updateZorkCursor() {
        if (!zorkCursor || !measureSpan) return;

        // Cache styles on first run to avoid repeated getComputedStyle calls
        if (!cachedInputStyles) {
            const inputStyles = window.getComputedStyle(termInput);
            cachedInputStyles = {
                font: inputStyles.font,
                letterSpacing: inputStyles.letterSpacing,
                paddingLeft: parseFloat(inputStyles.paddingLeft || '0')
            };
            measureSpan.style.font = cachedInputStyles.font;
            measureSpan.style.letterSpacing = cachedInputStyles.letterSpacing;
        }

        measureSpan.textContent = termInput.value || '';

        const offsetLeft = termInput.offsetLeft;
        const textWidth = measureSpan.offsetWidth;

        zorkCursor.style.left = `${offsetLeft + textWidth + cachedInputStyles.paddingLeft}px`;
        zorkCursor.style.top = `${termInput.offsetTop}px`;
        const active = document.activeElement === termInput && !termInput.disabled;
        zorkCursor.style.display = active ? 'inline' : 'none';
        zorkCursor.style.color = gameMode ? '#ccc' : 'var(--terminal-green)';
    }

    const helpText = `help
Standard Commands:
  help          - Display this help message
  theme [style] - Change terminal theme (matrix, midnight, retro, hacker)
  games         - List available console games
  riddles       - List available riddles
  riddle [id]   - Start a riddle (ex: riddle hats10)
  yatmal [text] - Rooftop rant of legend
  projects      - List the actual projects built by hyperkube
  publications  - List recent publications
  education     - Show education background
  neofetch      - Display system information (alias: netofetch)
  clear         - Clear the console
  zork          - Play Zork1: The Great Underground Empire
  quit          - Quit the current game (if playing)`;

    const blockedFsMessage = (cmd) => (
`╷
│ Error: Command not found: ${cmd}
╵

Note: This interactive terminal doesn't allow creating folders or modifying the host filesystem.

Try: help to list available commands, or simply say something to communicate with Hypercube.`
    );

    const historyLog = [];

    const riddleBank = {
        hats10: {
            id: 'hats10',
            title: 'The Hat Line (10 Prisoners)',
            category: 'Logic / Deduction',
            prompt: `Ten prisoners are lined up in a hallway, all facing forward. One by one, a guard places a hat on each head. Every hat is either red or blue. There are no mirrors, no reflections, and no way for anyone to see their own hat.

The prisoner at the back of the line can see the nine hats in front of them. Each person ahead sees one fewer, until the prisoner at the very front sees none at all.

Starting from the back, each prisoner must say exactly one word; either “red” or “blue.” Everyone hears every answer. If a prisoner correctly names the color of their own hat, they live. If they are wrong, they die. Remaining silent is not an option.

Before any hats are placed, the prisoners are allowed to meet and agree on a strategy.

The question is:
Can they come up with a strategy that guarantees at least 9 of them survive, no matter how the hats are assigned?

Commands: help, hint, reveal, quit`,
            hint: `Hint: Prisoner #1 can "sacrifice" their guess to transmit 1 bit of information to everyone else.
Think: odd/even (parity) of a color count.`,
            solution: `Beforehand, the prisoners agree that the first person will not try to guess their own hat. Instead, they will use their answer to send information.

When the hats are on, the last prisoner looks ahead and counts the red hats. If the number is even, they say “blue.” If it is odd, they say “red.” This single word tells everyone whether the total number of red hats is even or odd.

From there, each prisoner hears the clue, sees the hats in front of them, and subtracts what they already know. Since their own hat is the only unknown, they can deduce its color and answer correctly.

Only the first prisoner is at risk. Everyone else is guaranteed to survive.

Example:
If the first prisoner says “red,” that means an odd number of red hats lies ahead. The second prisoner sees eight red hats in front of them, an even number, so their own hat must be red to make the total odd.

Thus, no matter how the hats are assigned, at least nine prisoners live.`,
            // No automatic grading; this is a hint/reveal style riddle.
        },
        blueeyes: {
            id: 'blueeyes',
            title: 'Blue Eyes Island',
            category: 'Logic / Common Knowledge',
            prompt: `A group of people with assorted eye colors live on an island. They are perfect logicians, but no one knows the color of their own eyes. Everyone can see everyone else’s eye color, but they cannot communicate. Every night at midnight, a ferry arrives. Anyone who has deduced their own eye color must leave the island. On this island there are 100 blue-eyed people and 100 brown-eyed people, though no one knows these totals. So any given blue-eyed person can see 100 people with brown eyes and 99 people with blue eyes, but that does not tell him his own eye color; as far as he knows the totals could be 101 brown and 99 blue. Or 100 brown, 99 blue, and he could have red eyes. One day, a traveler visits and makes a single public announcement: “I can see someone who has blue eyes.” The traveler then leaves.

The question is:
Who leaves the island, and on which night?

Commands: help, hint, reveal, quit`,
            hint: `Hint: Work from small N (1, 2, 3...) and watch how the public announcement creates common knowledge.`,
            solution: `To simplify the logic, start with 4 people: 2 blue-eyed and 2 brown-eyed (and in general, eye colors could be anything).

After the traveler says, “I can see someone with blue eyes,” each blue-eyed person sees exactly one blue-eyed person. Each reasons: If I weren’t blue, there would be only 1 blue-eyed person total, and that person would see zero blue eyes and therefore leave on Night 1. But Night 1 passes and nobody leaves, so that possibility is eliminated. Both blue-eyed people conclude they must be blue, and they leave on Night 2. The brown-eyed people stay, because learning “I’m not blue” does not uniquely identify their color when other colors are possible.

Now generalize. If there are N blue-eyed people, each blue-eyed person sees N−1 blue-eyed people and uses the same chain of reasoning: if there were only N−1, they would leave on Night N−1; when that does not happen, N must be correct. Therefore, all N blue-eyed people leave on Night N.

In the original problem, N = 100, so all 100 blue-eyed people leave on Night 100, and the 100 brown-eyed people remain.`,
            // No automatic grading; this is a hint/reveal style riddle.
        }
    };

    let activeRiddleSession = null;

    function stopActiveRiddleSession() {
        if (!activeRiddleSession) return;
        activeRiddleSession = null;
        exitGameMode();
    }

    function startRiddleSession(riddleId) {
        const riddle = riddleBank[riddleId];
        if (!riddle) return `Unknown riddle "${riddleId}". Try: riddles`;
        if (activeRiddleSession) return 'A riddle is already running. Type quit to exit it.';

        enterGameMode();
        activeRiddleSession = { riddleId };
        return `${riddle.title}
Category: ${riddle.category}

${riddle.prompt}`;
    }

    function handleRiddleInput(rawInput) {
        const riddle = riddleBank[activeRiddleSession?.riddleId];
        if (!riddle) {
            stopActiveRiddleSession();
            return 'Riddle session ended (missing riddle).';
        }

        const input = (rawInput || '').trim();
        const lower = input.toLowerCase();
        if (!input) return null;

        if (lower === 'help') {
            return `Commands: hint, reveal, quit\nSubmit: type your strategy in plain English.`;
        }
        if (lower === 'quit' || lower === 'exit') {
            stopActiveRiddleSession();
            return 'Exited riddles.';
        }
        if (lower === 'hint') {
            return riddle.hint;
        }
        if (lower === 'reveal' || lower === 'answer' || lower === 'solution') {
            stopActiveRiddleSession();
            return riddle.solution;
        }

        return `No grading mode.\nType 'hint' for a nudge, 'reveal' for the solution, or 'quit' to exit.`;
    }

    const cmds = {
        help: () => helpText,
        cd: () => blockedFsMessage('cd'),
        cp: () => blockedFsMessage('cp'),
        mv: () => blockedFsMessage('mv'),
        rm: () => blockedFsMessage('rm'),
        mkdir: () => blockedFsMessage('mkdir'),
        touch: () => blockedFsMessage('touch'),
        chmod: () => blockedFsMessage('chmod'),
        chown: () => blockedFsMessage('chown'),
        apt: () => blockedFsMessage('apt'),
        git: () => blockedFsMessage('git'),
        make: () => blockedFsMessage('make'),
        npm: () => blockedFsMessage('npm'),
        pip: () => blockedFsMessage('pip'),
        clear: () => {
            resetToBanner();
            return null;
        },
        projects: () => (
`Projects:
  - Explainable AI (2025-12-15)
  - Portfolio Tracker (2025-10-02)
  - Energy Market Forecasting (2025-08-08)
  - Goal Tracker (2025-06-04)
  - Cost of Living Scraper (2025-04-12)
  - AI Resume Tailor (2024-08-22)
  - Rent vs Buy Simulator (2024-02-14)
  - Movie Recommendation System (2023-06-12)
  - Textbook Solutions (2022-09-05)
  - Anomaly Detection (2022-07-18)
  - Neural Style Transfer (pretrained VGG19) (2022-05-15)
  - MNIST: The "Hello World" of deep learning (2022-03-10)`
        ),
        publications: () => (
`Publications:
  - The Social Life of Stocks (2025-12-20)
  - Flood risk perceptions in Florida cities (2024-10-24)
  - Residential demand response in Ottawa (2023-07-24)
  - Residential DR determinants in Ontario (2021-10-16)
  - Residential demand response in Japan (2021-05-13)
  - Shinchi Town sustainability survey (2020-10-26)
  - Residential DSM/DER willingness in Japan (2019-12-02)
  - Sustainable space exploration (2019-09-27)
  - Chile's coastal flood checkup (2019-06-13)
  - Tokyo low emission building strategy (2018-07-14)
  - Flood Vulnerability and Gender Roles (2017-10-22)`
        ),
        education: () => (
`Education:
  - PhD, Sustainability Science — The University of Tokyo (2018–2021), Tokyo, Japan
    • Optimized smart grid energy efficiency with Markov decision processes
    • Japanese government Monbukagakusho: MEXT scholarship (≈$120k)
  - MSc, Sustainability Science — The University of Tokyo (2016–2018), Tokyo, Japan
  - BSc, Economics — University of Thessaly (2010–2015), Thessaly, Greece`
        ),
        yatmal: (_, raw) => {
            const text = raw.replace(/^yatmal\s*/i, "") || "You're tearing me apart, Lisa!";
            const gifUrl = "https://ift.tt/36uiRLW";
            return {
                html: true,
                content: `
                    <div style="display:flex;flex-direction:column;gap:4px;max-width:260px;">
                        <div style="font-family:var(--font-mono);color:#ccc;">${text}</div>
                        <img src="${gifUrl}" alt="YATMAL" style="width:100%;height:auto;display:block;border-radius:6px;border:1px solid rgba(255,255,255,0.12);image-rendering:pixelated;"/>
                    </div>
                `
            };
        },
        theme: (args) => {
            const choice = args.slice(1).join(" ") || "matrix";
            return applyTheme(choice);
        },
        neofetch: () => (
`hyperkube@dev
----------------
OS: Ubuntu 22.04.4 LTS (WSL2)
Kernel: 6.6.87.2-microsoft-standard-WSL2
Shell: /bin/js (browser)
Machine: Xenomorph (Microsoft WSL2)
CPU: Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz (4 vCPU)
GPU: NVIDIA GeForce RTX 2080
Memory: 11GiB total
Theme: ${terminalWindow?.dataset.termTheme || "matrix"}`
        ),
        netofetch: () => (
`hyperkube@dev
----------------
OS: Ubuntu 22.04.4 LTS (WSL2)
Kernel: 6.6.87.2-microsoft-standard-WSL2
Shell: /bin/js (browser)
Machine: Xenomorph (Microsoft WSL2)
CPU: Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz (4 vCPU)
GPU: NVIDIA GeForce RTX 2080
Memory: 11GiB total
Theme: ${terminalWindow?.dataset.termTheme || "matrix"}`
        ),
        games: () => (
`Games:
  - zork: Classic text adventure. Type 'zork' to explore The Great Underground Empire.
  - riddles: Bite-sized logic puzzles. Type 'riddles' to list.`
        ),
        riddles: () => (
`Riddles:
  - riddle hats10  (${riddleBank.hats10.category}) — ${riddleBank.hats10.title}
  - riddle blueeyes  (${riddleBank.blueeyes.category}) — ${riddleBank.blueeyes.title}
`
        ),
        riddle: (args) => {
            const id = (args[1] || '').trim();
            if (!id) return cmds.riddles();
            return startRiddleSession(id);
        },
        zork: () => {
            if (window.ZorkGame && !window.ZorkGame.isRunning()) {
                enterGameMode();
                window.ZorkGame.start((text) => {
                    printStaticOutput(text, true);
                });
                return "Starting Zork1: The Great Underground Empire...\nType 'quit' at any time to exit the game.\n";
            } else if (window.ZorkGame && window.ZorkGame.isRunning()) {
                return "Zork is already running!";
            } else {
                return "Error: Zork game not loaded.";
            }
        },
        quit: () => {
            if (window.ZorkGame && window.ZorkGame.isRunning()) {
                window.ZorkGame.stop();
                exitGameMode();
                return "Exited Zork.";
            }
            if (activeRiddleSession) {
                stopActiveRiddleSession();
                return "Exited riddles.";
            }
            return "No game is currently running.";
        }
    };

    const thinkingStates = [
        "Mental Mix-Ups",
        "Conflating",
        "Confusifying",
        "Muddling",
        "Garbling",
        "Jumbling",
        "Scrambling",
        "Tangling",
        "Melding",
        "Mushing",
        "Overthinking or Misthinking",
        "Ruminating",
        "Overcooking",
        "Spiraling",
        "Overloading",
        "Looping",
        "Glitching",
        "Short-circuiting",
        "Brain Chaos",
        "Discombobulating",
        "Befuddling",
        "Bedazzling",
        "Bamboozling",
        "Flummoxing",
        "Bewildering"
    ];
    let thinkingIndex = Math.floor(Math.random() * thinkingStates.length);
    let thinkingRepeat = 0;
    let thinkingRepeatTarget = 2 + Math.floor(Math.random() * 2);

    ensureCursorInfra();
    syncBlinkers();
    updateZorkCursor();

    function nextThinkingLabel() {
        if (thinkingRepeat >= thinkingRepeatTarget) {
            thinkingIndex = (thinkingIndex + 1) % thinkingStates.length;
            thinkingRepeat = 0;
            thinkingRepeatTarget = 2 + Math.floor(Math.random() * 2);
        }
        thinkingRepeat++;
        return thinkingStates[thinkingIndex];
    }

    function focusTerminal() {
        termDisplay.scrollTop = termDisplay.scrollHeight;
        termInput.focus();
        termInput.setSelectionRange(termInput.value.length, termInput.value.length);
        updateZorkCursor();
        syncBlinkers();
    }
    window.focusTerminal = focusTerminal;

    function enterGameMode() {
        ensureCursorInfra();
        gameMode = true;
        // Show minimalist ">" prompt for Zork
        if (termPrompt) {
            termPrompt.textContent = '>';
            termPrompt.style.display = '';
            termPrompt.style.color = '#ccc';
        }
        // Change input styling to plain white
        if (termInput) {
            termInput.style.color = '#ccc';
            termInput.style.caretColor = 'transparent';
            termInput.style.marginLeft = '6px';
        }
        if (zorkCursor) {
            zorkCursor.textContent = '_';
            zorkCursor.style.display = 'inline';
        }
        updateZorkCursor();
        syncBlinkers();
    }
    window.enterGameMode = enterGameMode;

    function exitGameMode() {
        // Show terminal prompt
        if (termPrompt) {
            termPrompt.innerHTML = defaultPromptHTML;
            termPrompt.style.display = '';
            termPrompt.style.color = 'var(--terminal-green)';
        }
        // Restore terminal input styling
        if (termInput) {
            termInput.style.color = 'var(--terminal-green)';
            termInput.style.caretColor = 'transparent';
            termInput.style.marginLeft = '8px';
        }
        if (zorkCursor) {
            zorkCursor.textContent = '|';
            zorkCursor.style.display = 'none';
        }
        gameMode = false;
        updateZorkCursor();
        syncBlinkers();
    }
    window.exitGameMode = exitGameMode;

    // Optimized: Use only necessary event listeners with passive option for better scroll performance
    termInput.addEventListener('input', updateZorkCursor, { passive: true });
    termInput.addEventListener('focus', updateZorkCursor, { passive: true });
    termInput.addEventListener('blur', updateZorkCursor, { passive: true });

    function printStaticOutput(text, tightSpacing = false) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `color: #aaa; margin-bottom: ${tightSpacing ? '2px' : '10px'}`;

        const pre = document.createElement('pre');
        pre.style.cssText = 'margin: 0; font-family: var(--font-mono); white-space: pre-wrap';
        pre.textContent = text;

        wrapper.appendChild(pre);
        termDisplay.insertBefore(wrapper, termLine);

        // Use requestAnimationFrame for smoother scroll
        requestAnimationFrame(() => {
            termDisplay.scrollTop = termDisplay.scrollHeight;
        });
    }
    window.printStaticOutput = printStaticOutput;

    function renderOutput(output) {
        if (!output) return;
        if (typeof output === 'object' && output.html) {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';
            wrapper.innerHTML = output.content;
            termDisplay.insertBefore(wrapper, termLine);
            requestAnimationFrame(() => {
                termDisplay.scrollTop = termDisplay.scrollHeight;
            });
            return;
        }
        printStaticOutput(output);
    }

    async function typeWriter(text, element) {
        element.textContent = '';
        const chars = text.split('');
        let currentText = '';

        for (const char of chars) {
            currentText += char;
            element.textContent = currentText;
            await new Promise((r) => setTimeout(r, 10));
        }

        // Single scroll at the end instead of per-character
        termDisplay.scrollTop = termDisplay.scrollHeight;
    }

    function getBootSequence(sessionId) {
        return [
            { text: "Booting AI Interface v1.0...", style: "color: #888; opacity: 0.5;" },
            { text: `Secure connection established. Session ID: ${sessionId}`, style: "color: #888; opacity: 0.5;" },
            { text: "TESSERACT is online!", style: "color: #e5e5e5; margin-top: 10px; font-weight: 600;" },
            { text: "Say hi, try 'help' for commands, or hit 'games' to play.", style: "color: #e5e5e5; margin-bottom: 15px;" }
        ];
    }

    async function runBootSequence() {
        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const bootSequence = getBootSequence(sessionId);

        if (!termDisplay.contains(bootLog)) {
            termDisplay.insertBefore(bootLog, termLine);
        }
        bootLog.innerHTML = '';

        // Use DocumentFragment to batch DOM operations
        const fragment = document.createDocumentFragment();

        for (let line of bootSequence) {
            await delay(400);
            const div = document.createElement('div');
            div.style.cssText = line.style;
            div.textContent = line.text;
            bootLog.appendChild(div);

            // Scroll once per iteration using RAF for smoothness
            requestAnimationFrame(() => {
                termDisplay.scrollTop = termDisplay.scrollHeight;
            });
        }
    }

    function resetToBanner() {
        if (window.ZorkGame && window.ZorkGame.isRunning()) {
            window.ZorkGame.stop();
        }
        exitGameMode();

        const currentLine = termLine;
        termDisplay.innerHTML = '';
        bootLog.innerHTML = '';
        termDisplay.appendChild(bootLog);
        termDisplay.appendChild(currentLine);
        runBootSequence();
    }

    applyTheme('matrix');
    runBootSequence();

    termInput.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return;
        const val = termInput.value.trim();
        if (!val) return;
        historyLog.push(val);

        // Check if Zork is running - use minimal prompt
        const isZorkRunning = window.ZorkGame && window.ZorkGame.isRunning();
        const isRiddleRunning = Boolean(activeRiddleSession);
        const isInteractiveRunning = isZorkRunning || isRiddleRunning;

        termDisplay.insertBefore(
            Object.assign(document.createElement('div'), {
                innerHTML: isInteractiveRunning ? val : `<span class="prompt-command">${TERMINAL_PROMPT}</span>&nbsp;${val}`,
                style: isInteractiveRunning ? 'margin-bottom:2px;color:#ccc' : 'margin-bottom:6px'
            }),
            termLine
        );
        termInput.value = '';
        updateZorkCursor();

        // Check if Zork is running and route input to game
        if (isZorkRunning) {
            // Special handling for quit command
            if (val.toLowerCase() === 'quit') {
                window.ZorkGame.stop();
                exitGameMode();
                printStaticOutput('Exited Zork.');
                termDisplay.scrollTop = termDisplay.scrollHeight;
                return;
            }
            // Send input to Zork
            window.ZorkGame.sendInput(val);
            requestAnimationFrame(() => {
                termDisplay.scrollTop = termDisplay.scrollHeight;
            });
            return;
        }

        if (isRiddleRunning) {
            const output = handleRiddleInput(val);
            renderOutput(output);
            return;
        }

        const tokens = val.split(/\s+/);
        const key = tokens[0].toLowerCase();
        const handler = cmds[key];
        if (typeof handler === 'function') {
            const output = handler(tokens, val);
            renderOutput(output);
            return;
        }
        if (typeof handler === 'string') {
            renderOutput(handler);
            return;
        }

        termInput.disabled = true;
        const loading = document.createElement('div');
        loading.style.color = '#ccc';
        loading.style.marginBottom = '10px';
        loading.innerText = `${nextThinkingLabel()}...`;
        termDisplay.insertBefore(loading, termLine);

        let response = "Error: AI not loaded.";
        if (window.queryLLM) {
            response = await window.queryLLM(val);
        } else {
            response = "System Error: LLM module missing. Check file path js/llm.js";
        }

        termDisplay.removeChild(loading);

        const responseDiv = document.createElement('div');
        responseDiv.style.cssText = 'color: #ccc; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere';
        termDisplay.insertBefore(responseDiv, termLine);

        await typeWriter(response, responseDiv);
        termInput.disabled = false;
        termInput.focus();
    });
})();
