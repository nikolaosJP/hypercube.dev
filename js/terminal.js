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
            prompt: `• 10 prisoners are marched into a hallway and lined up single-file like the world’s least fun conga line. A guard walks down the row
  and drops a hat on each head. The hats come in exactly two colors: red and blue. That’s it. No “maybe teal.” No “I’m colorblind,
  your honor.” Just red or blue, because the universe loves binary choices when your life depends on them.

  Here’s the setup:

  - Everyone faces forward, so you can only see hats in front of you.
  - Prisoner #1 (at the very back) can see 9 hats.
  - Prisoner #2 can see 8 hats.
  - …
  - Prisoner #10 (at the front) sees 0 hats, which is very on-brand for being last in line: no information, but still fully judged.
  - Nobody can see their own hat.
  - Starting with #1 and moving forward, each prisoner must say exactly one word: “red” or “blue.”
  - Everyone hears everything that’s said.
  - Guess right: live. Guess wrong: die.
  - Before the hats go on, the prisoners are allowed to agree on a strategy, like a doomed fantasy football league.

  The question is:

  Can they come up with a strategy that guarantees at least 9 of them survive, no matter how the hats are assigned?

Type your solution (free-text) or commands: help, hint, reveal, quit`,
            hint: `Hint: Prisoner #1 can "sacrifice" their guess to transmit 1 bit of information to everyone else.
Think: odd/even (parity) of a color count.`,
            solution: `Solution (guarantees 9 survivors):
1) Agree on a rule: Prisoner #1 announces parity of (say) RED hats in front.
   - If #1 sees an EVEN number of red hats ahead, they say "red".
   - If #1 sees an ODD number of red hats ahead, they say "blue".
   (This first call may be wrong about their own hat; it's a message.)

2) Now each prisoner #2–#10 can deduce their own hat:
   - They can see all hats ahead, and they’ve heard the parity message.
   - They keep track of how many red hats are still "unaccounted for" based on what they see ahead and what earlier prisoners must have had.
   - If their counted reds ahead match the announced parity, their hat is BLUE; otherwise it’s RED.

Result: Prisoner #1 might die, but prisoners #2–#10 all know their hat color with certainty → at least 9 survive.`,
            grader: (raw) => {
                const text = (raw || '').toLowerCase();
                const hasParity = /\b(parity|odd|even|xor|mod\s*2|modulo)\b/.test(text);
                const mentionsFirst = /\b(prisoner\s*#?1|#?1\b|first|back)\b/.test(text);
                const mentionsCountColor = /\b(count|number|how many)\b/.test(text) && /\b(red|blue)\b/.test(text);
                const mentionsDeduce = /\b(deduce|infer|determin|figure out|know)\b/.test(text) && /\b(own|my)\b/.test(text);
                const score = [hasParity, mentionsFirst, mentionsCountColor, mentionsDeduce].filter(Boolean).length;

                return {
                    correct: score >= 3,
                    score,
                    checks: { hasParity, mentionsFirst, mentionsCountColor, mentionsDeduce }
                };
            }
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
        activeRiddleSession = { riddleId, solved: false, attempts: 0 };
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

        if (activeRiddleSession.solved) {
            return `Already solved. Type 'reveal' for the full solution, or 'quit' to exit.`;
        }

        activeRiddleSession.attempts += 1;
        const grade = riddle.grader(input);

        const missing = [];
        if (!grade.checks.hasParity) missing.push('parity/odd-even bit');
        if (!grade.checks.mentionsFirst) missing.push('prisoner #1 sends the bit');
        if (!grade.checks.mentionsCountColor) missing.push('count hats ahead + color');
        if (!grade.checks.mentionsDeduce) missing.push('others deduce own hat');

        if (grade.correct) {
            activeRiddleSession.solved = true;
            return `Correct.\nType 'reveal' to see the canonical solution, or 'quit' to exit.`;
        }

        const nextHint = missing.length
            ? `Missing piece(s): ${missing.join(', ')}.`
            : `Close, but missing a key detail.`;
        return `Not quite.\n${nextHint}\nTry again, or type 'hint'.`;
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
  - hats10  (${riddleBank.hats10.category}) — ${riddleBank.hats10.title}

Run: riddle hats10`
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
