/**
 * Riddles game module.
 */
(function () {
    const registry = window.TerminalGameRegistry;
    if (!registry) return;

    const riddleBank = {
        hats10: {
            id: 'hats10',
            title: 'The Hat Line',
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

Thus, no matter how the hats are assigned, at least nine prisoners live.`
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

In the original problem, N = 100, so all 100 blue-eyed people leave on Night 100, and the 100 brown-eyed people remain.`
        },
        boolos: {
            id: 'boolos',
            title: 'The Hardest Logic Puzzle Ever',
            category: 'Logic / Deduction',
            prompt: `There are three beings—call them A, B, and C. Each is exactly one of:

True: always tells the truth
False: always lies
Random: answers randomly (truthfully or falsely), independently each time

They understand your language, but they answer every yes/no question in their own language using only two words: “da” and “ja.” You do not know which means “yes” and which means “no.”

You may ask exactly three yes/no questions total, directed to any one being per question (you can choose which being each time). Each question must be answered with da or ja.

Goal: Determine which being is True, which is False, and which is Random, within those three questions.

This is Boolos’ famous puzzle, commonly called “The Hardest Logic Puzzle Ever.”

Commands: help, hint, reveal, quit`,
            hint: `Hint: Use a “universal translator” question form that cancels out truth/lie AND the unknown meaning of “da/ja”, like:
“If I asked you P, would you say ‘ja’?”
Then use branching to ensure your later questions go to a non-Random being.`,
            solution: `Key tool (the “universal translator”):
For a non-Random being (True or False), the question:
  Q(P): “If I asked you P, would you say ‘ja’?”
will be answered with:
  - “ja” iff P is true
  - “da” iff P is false
regardless of which word means “yes” and regardless of whether the being is True or False.

Now the 3-question strategy:

1) Ask A: Q(“Is B Random?”)
   - If A answers “ja”, set D = C.
   - If A answers “da”, set D = B.
   (D is guaranteed to be non-Random: if A is Random then both B and C are non-Random anyway; if A is not Random, A’s answer tells you which of B/C is Random, so you pick the other.)

2) Ask D: Q(“Is A Random?”)
   - If D answers “ja”, then A is Random.
   - If D answers “da”, then A is not Random, so the Random one is the remaining being among {B, C} that is not D.

3) Ask D: Q(“Are you True?”)
   - If D answers “ja”, then D is True and the other non-Random being is False.
   - If D answers “da”, then D is False and the other non-Random being is True.

At that point you have identified True, False, and Random within exactly three questions.`
        }
    };

    let activeRiddleId = null;

    function start(ctx, riddleId) {
        const id = String(riddleId || '').trim().toLowerCase();
        const riddle = riddleBank[id];
        if (!riddle) return `Unknown riddle "${riddleId}". Try: riddles`;
        if (activeRiddleId) return 'A riddle is already running. Type quit to exit it.';

        if (typeof ctx?.enterGameMode === 'function') ctx.enterGameMode();
        activeRiddleId = id;

        return `${riddle.title}\nCategory: ${riddle.category}\n\n${riddle.prompt}`;
    }

    function stop(ctx) {
        if (!activeRiddleId) return null;
        activeRiddleId = null;
        if (typeof ctx?.exitGameMode === 'function') ctx.exitGameMode();
        return 'Exited riddles.';
    }

    function handleInput(rawInput, ctx) {
        const riddle = riddleBank[activeRiddleId];
        if (!riddle) return stop(ctx) || 'Exited riddles.';

        const input = (rawInput || '').trim();
        const lower = input.toLowerCase();
        if (!input) return null;

        if (lower === 'help') {
            return `Commands: hint, reveal, quit\nSubmit: type your strategy in plain English.`;
        }
        if (lower === 'quit' || lower === 'exit') {
            return stop(ctx);
        }
        if (lower === 'hint') {
            return riddle.hint;
        }
        if (lower === 'reveal' || lower === 'answer' || lower === 'solution') {
            activeRiddleId = null;
            if (typeof ctx?.exitGameMode === 'function') ctx.exitGameMode();
            return riddle.solution;
        }

        return `No grading mode.\nType 'hint' for a nudge, 'reveal' for the solution, or 'quit' to exit.`;
    }

    function renderRiddleList() {
        const lines = Object.values(riddleBank)
            .map((r) => `  - riddle ${r.id} — ${r.title}`)
            .sort((a, b) => a.localeCompare(b));
        return `Riddles:\n${lines.join('\n')}\n`;
    }

    registry.register({
        id: 'riddles',
        title: 'Riddles',
        description: "Bite-sized logic puzzles. Type 'riddles' to list.",
        help: [
            'riddles       - List available riddles',
            'riddle [id]   - Start a riddle (ex: riddle hats10)'
        ],
        isRunning: () => Boolean(activeRiddleId),
        stop,
        handleInput,
        commands: (ctx) => ({
            riddles: () => renderRiddleList(),
            riddle: (args) => {
                const id = (args?.[1] || '').trim();
                if (!id) return renderRiddleList();
                return start(ctx, id);
            }
        })
    });
})();
