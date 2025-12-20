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
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalExpandButton = document.getElementById('terminal-expand');
    const TERMINAL_PROMPT = '[guest@hyperkube.dev ~]$';

    if (termPrompt) termPrompt.textContent = TERMINAL_PROMPT;
    const defaultPromptHTML = TERMINAL_PROMPT;

    if (!bootLog || !termDisplay || !termLine || !termInput) return;

    // Ensure Ctrl+F5 reloads even if a game runtime captured keydown.
    window.addEventListener('keydown', (e) => {
        if (!e || e.isComposing) return;
        if (e.key !== 'F5' || !e.ctrlKey) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.reload();
    }, true);

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

    const coreHelpLines = [
        'help          - Display this help message',
        'theme [style] - Change terminal theme (matrix, midnight, retro, hacker)',
        'yatmal        - Rooftop rant of legend',
        'projects      - List the actual projects built by hyperkube',
        'publications  - List recent publications',
        'education     - Show education background',
        'neofetch      - Display system information',
        'clear         - Clear the console'
    ];

    function renderHelpText(extraLines) {
        const lines = coreHelpLines.concat(Array.isArray(extraLines) ? extraLines : []);
        const sorted = lines
            .slice()
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        return `Commands:\n${sorted.map((line) => `  ${line}`).join('\n')}`;
    }

    const blockedFsMessage = (cmd) => (
`╷
│ Error: Command not found: ${cmd}
╵

Note: This interactive terminal doesn't allow creating folders or modifying the host filesystem.

Try: help to list available commands, or simply say something to communicate with Hypercube.`
    );

    const historyLog = [];

    const cmds = {
        help: () => {
            const gameHelp = window.TerminalGameRegistry?.getHelpLines?.();
            return renderHelpText(gameHelp);
        },
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
        yatmal: () => {
            const text = "You're tearing me apart, Lisa!";
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
`OS: Ubuntu 22.04.4 LTS (WSL2)
Kernel: 6.6.87.2-microsoft-standard-WSL2
Shell: /bin/js (browser)
Machine: Xenomorph (Microsoft WSL2)
CPU: Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz (4 vCPU)
GPU: NVIDIA GeForce RTX 2080
Memory: 11GiB total
Theme: ${terminalWindow?.dataset.termTheme || "matrix"}`
        ),
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

    function setTerminalExpanded(expanded) {
        if (!terminalWindow) return;
        terminalWindow.classList.toggle('terminal-expanded', expanded);
        document.body.classList.toggle('terminal-expanded-lock', expanded);
        if (terminalOverlay) {
            terminalOverlay.classList.toggle('visible', expanded);
        }
        if (terminalExpandButton) {
            terminalExpandButton.setAttribute('aria-pressed', expanded ? 'true' : 'false');
            terminalExpandButton.setAttribute('aria-label', expanded ? 'Collapse terminal' : 'Expand terminal');
        }
        if (expanded) focusTerminal();
    }

    function toggleTerminalExpand(event) {
        if (event) event.stopPropagation();
        const expanded = !terminalWindow?.classList.contains('terminal-expanded');
        setTerminalExpanded(expanded);
    }
    window.toggleTerminalExpand = toggleTerminalExpand;

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
        
        if (termLine && termLine.parentNode === termDisplay) {
            termDisplay.insertBefore(wrapper, termLine);
        } else {
            termDisplay.appendChild(wrapper);
            // If termLine exists but is detached or elsewhere, consider appending it back? 
            // For now, just ensure content is added.
            if (termLine) termDisplay.appendChild(termLine);
        }

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
            
            if (termLine && termLine.parentNode === termDisplay) {
                termDisplay.insertBefore(wrapper, termLine);
            } else {
                termDisplay.appendChild(wrapper);
                if (termLine) termDisplay.appendChild(termLine);
            }
            
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
            if (termLine && termLine.parentNode === termDisplay) {
                termDisplay.insertBefore(bootLog, termLine);
            } else {
                termDisplay.appendChild(bootLog);
                if (termLine) termDisplay.appendChild(termLine);
            }
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
        window.TerminalGameRegistry?.stopAllGames?.({ exitGameMode });
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

    async function handleTerminalKeydown(e) {
        if (e.key !== 'Enter') return;
        const val = termInput.value.trim();
        if (!val) return;
        historyLog.push(val);

        const gameCtx = { enterGameMode, exitGameMode, printStaticOutput, renderOutput };
        const activeGame = window.TerminalGameRegistry?.getActiveGame?.();
        const isInteractiveRunning = Boolean(activeGame);

        const echoDiv = Object.assign(document.createElement('div'), {
            innerHTML: isInteractiveRunning ? val : `<span class="prompt-command">${TERMINAL_PROMPT}</span>&nbsp;${val}`,
            style: isInteractiveRunning ? 'margin-bottom:2px;color:#ccc' : 'margin-bottom:6px'
        });

        if (termLine && termLine.parentNode === termDisplay) {
            termDisplay.insertBefore(echoDiv, termLine);
        } else {
            termDisplay.appendChild(echoDiv);
            if (termLine) termDisplay.appendChild(termLine);
        }

        termInput.value = '';
        updateZorkCursor();

        if (isInteractiveRunning && typeof activeGame.handleInput === 'function') {
            const output = activeGame.handleInput(val, gameCtx);
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

        const gameHandler = window.TerminalGameRegistry?.getCommandHandlers?.(gameCtx)?.[key];
        if (typeof gameHandler === 'function') {
            const output = gameHandler(tokens, val);
            renderOutput(output);
            return;
        }

        termInput.disabled = true;
        const loading = document.createElement('div');
        loading.style.color = '#ccc';
        loading.style.marginBottom = '10px';
        loading.innerText = `${nextThinkingLabel()}...`;
        
        if (termLine && termLine.parentNode === termDisplay) {
            termDisplay.insertBefore(loading, termLine);
        } else {
            termDisplay.appendChild(loading);
            if (termLine) termDisplay.appendChild(termLine);
        }

        let response = "Error: AI not loaded.";
        if (window.queryLLM) {
            response = await window.queryLLM(val);
        } else {
            response = "System Error: LLM module missing. Check file path js/llm.js";
        }

        if (loading.parentNode === termDisplay) {
            termDisplay.removeChild(loading);
        }

        const responseDiv = document.createElement('div');
        responseDiv.style.cssText = 'color: #ccc; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere';
        
        if (termLine && termLine.parentNode === termDisplay) {
            termDisplay.insertBefore(responseDiv, termLine);
        } else {
            termDisplay.appendChild(responseDiv);
            if (termLine) termDisplay.appendChild(termLine);
        }

        await typeWriter(response, responseDiv);
        termInput.disabled = false;
        termInput.focus();
    }

    function rebindTerminalInput() {
        if (!termInput) return;
        termInput.disabled = false;
        termInput.readOnly = false;
        termInput.removeAttribute('disabled');
        termInput.style.pointerEvents = 'auto';
        termInput.removeEventListener('keydown', handleTerminalKeydown);
        termInput.addEventListener('keydown', handleTerminalKeydown);
        termInput.focus();
    }
    window.rebindTerminalInput = rebindTerminalInput;

    // Input guard to recover from external key handlers (e.g., DOOM runtime) that swallow keystrokes.
    let inputGuardInstalled = false;
    let inputGuardArmed = false;

    function guardKeyToAction(event) {
        if (!event || event.isComposing) return null;
        if (event.metaKey || event.ctrlKey || event.altKey) return null;
        if (event.key === 'Backspace') return { type: 'backspace' };
        if (event.key === 'Delete') return { type: 'delete' };
        if (event.key === 'Enter') return { type: 'enter' };
        if (event.key.length === 1) return { type: 'char', value: event.key };
        return null;
    }

    function guardApply(action) {
        if (!termInput) return;
        const start = termInput.selectionStart ?? termInput.value.length;
        const end = termInput.selectionEnd ?? start;
        let nextValue = termInput.value;
        let nextPos = start;

        if (action.type === 'char') {
            nextValue = nextValue.slice(0, start) + action.value + nextValue.slice(end);
            nextPos = start + action.value.length;
        } else if (action.type === 'backspace') {
            if (start !== end) {
                nextValue = nextValue.slice(0, start) + nextValue.slice(end);
                nextPos = start;
            } else if (start > 0) {
                nextValue = nextValue.slice(0, start - 1) + nextValue.slice(end);
                nextPos = start - 1;
            }
        } else if (action.type === 'delete') {
            if (start !== end) {
                nextValue = nextValue.slice(0, start) + nextValue.slice(end);
                nextPos = start;
            } else if (start < nextValue.length) {
                nextValue = nextValue.slice(0, start) + nextValue.slice(start + 1);
                nextPos = start;
            }
        } else if (action.type === 'enter') {
            // Let the normal handler process the current value.
            handleTerminalKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
            return;
        }

        termInput.value = nextValue;
        termInput.setSelectionRange(nextPos, nextPos);
        updateZorkCursor();
    }

    function inputGuardHandler(event) {
        if (!inputGuardArmed) return;
        const action = guardKeyToAction(event);
        if (!action) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (termInput && !termInput.disabled && !termInput.readOnly) {
            termInput.focus();
        }
        guardApply(action);
    }

    function ensureInputGuard() {
        if (inputGuardInstalled) return;
        window.addEventListener('keydown', inputGuardHandler, true);
        inputGuardInstalled = true;
    }

    window.enableTerminalInputGuard = function enableTerminalInputGuard() {
        inputGuardArmed = true;
        ensureInputGuard();
    };

    window.disableTerminalInputGuard = function disableTerminalInputGuard() {
        inputGuardArmed = false;
    };

    termInput.addEventListener('keydown', handleTerminalKeydown);
})();
