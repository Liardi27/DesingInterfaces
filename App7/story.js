class Engine {
    constructor(storyData) {
        this.story = storyData;
        this.state = {
            currentSceneId: 'start',
            stats: {
                autonomy: 50,
                reputation: 50,
                knowledge: 10
            },
            history: [] // Track choices
        };

        this.ui = {
            background: document.getElementById('background-layer'),
            speaker: document.getElementById('speaker-name'),
            text: document.getElementById('dialogue-text'),
            choices: document.getElementById('choices-container'),
            continueBtn: document.getElementById('continue-indicator'),
            chars: {
                left: document.getElementById('char-left'),
                center: document.getElementById('char-center'),
                right: document.getElementById('char-right'),
            },
            bars: {
                autonomy: document.getElementById('bar-autonomy'),
                reputation: document.getElementById('bar-reputation'),
                knowledge: document.getElementById('bar-knowledge'),
            }
        };

        this.currentDialogueIndex = 0;
        this.isTyping = false;

        this.bindEvents();
        this.updateStatsUI();
    }

    bindEvents() {
        this.ui.continueBtn.addEventListener('click', () => {
            if (this.isTyping) {
                this.completeTyping();
            } else {
                this.nextDialogue();
            }
        });

        // Also allow clicking the text box to advance
        document.getElementById('dialogue-box').addEventListener('click', () => {
            if (this.isTyping) {
                this.completeTyping();
            } else if (!this.ui.continueBtn.classList.contains('hidden')) {
                this.nextDialogue();
            }
        });
    }

    start() {
        this.loadScene(this.state.currentSceneId);
    }

    loadScene(sceneId) {
        const scene = this.story[sceneId];
        if (!scene) {
            console.error(`Scene ${sceneId} not found`);
            return;
        }

        console.log(`Loading scene: ${sceneId}`);
        this.state.currentSceneId = sceneId;
        this.currentDialogueIndex = 0;

        // Update Background if changed
        if (scene.background) {
            this.u_setBackground(scene.background);
        }

        this.processDialogueLine();
    }

    processDialogueLine() {
        const scene = this.story[this.state.currentSceneId];
        const line = scene.dialogue[this.currentDialogueIndex];

        if (!line) {
            // End of dialogue, show choices
            this.showChoices(scene.choices);
            return;
        }

        // Update Characters
        this.updateCharacters(line.characters || scene.defaultCharacters);

        // Update Speaker
        this.ui.speaker.textContent = line.speaker;
        this.ui.speaker.style.color = this.getSpeakerColor(line.speaker);

        // Type Text
        this.typeText(line.text);
    }

    updateCharacters(charConfig) {
        // Reset all
        ['left', 'center', 'right'].forEach(pos => {
            this.ui.chars[pos].classList.add('hidden');
        });

        if (!charConfig) return;

        // Apply new config
        Object.keys(charConfig).forEach(pos => {
            if (this.ui.chars[pos]) {
                this.ui.chars[pos].src = charConfig[pos];
                this.ui.chars[pos].classList.remove('hidden');
            }
        });
    }

    typeText(text) {
        this.ui.text.textContent = '';
        this.ui.continueBtn.classList.add('hidden');
        this.ui.choices.classList.add('hidden');

        let i = 0;
        this.isTyping = true;
        this.currentFullText = text;

        this.typingInterval = setInterval(() => {
            this.ui.text.textContent += text.charAt(i);
            i++;
            if (i >= text.length) {
                this.completeTyping();
            }
        }, 30); // Typing speed
    }

    completeTyping() {
        clearInterval(this.typingInterval);
        this.ui.text.textContent = this.currentFullText;
        this.isTyping = false;
        this.ui.continueBtn.classList.remove('hidden');
    }

    nextDialogue() {
        this.currentDialogueIndex++;
        this.processDialogueLine();
    }

    showChoices(choices) {
        this.ui.continueBtn.classList.add('hidden');
        this.ui.choices.innerHTML = '';
        this.ui.choices.classList.remove('hidden');

        if (!choices) return; // Game Over or End?

        choices.forEach(choice => {
            const btn = document.createElement('div');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.dataset.type = choice.type || 'neutral'; // 'risky', 'strategic', 'evasive'

            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent clicking through to dialogue
                this.makeChoice(choice);
            };

            this.ui.choices.appendChild(btn);
        });
    }

    makeChoice(choice) {
        // Apply effects
        if (choice.effects) {
            this.applyStats(choice.effects);
        }

        // Move to next scene
        if (choice.nextScene) {
            this.loadScene(choice.nextScene);
        }
    }

    applyStats(effects) {
        // effects: { autonomy: 10, reputation: -5 }
        for (const [key, value] of Object.entries(effects)) {
            if (this.state.stats.hasOwnProperty(key)) {
                this.state.stats[key] = Math.max(0, Math.min(100, this.state.stats[key] + value));
                this.showNotification(`${key.toUpperCase()} ${value > 0 ? '+' : ''}${value}`);
            }
        }
        this.updateStatsUI();
    }

    updateStatsUI() {
        this.ui.bars.autonomy.style.width = `${this.state.stats.autonomy}%`;
        this.ui.bars.reputation.style.width = `${this.state.stats.reputation}%`;
        this.ui.bars.knowledge.style.width = `${this.state.stats.knowledge}%`;
    }

    showNotification(msg) {
        const area = document.getElementById('notification-area');
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = msg;
        area.appendChild(notif);

        // Auto remove handled by CSS animation mostly, but cleanup DOM
        setTimeout(() => notif.remove(), 3000);
    }

    u_setBackground(url) {
        this.ui.background.style.backgroundImage = `url('${url}')`;
    }

    getSpeakerColor(name) {
        switch (name) {
            case 'KAEL': return '#e1e1e6';
            case 'M.O.T.A.': return '#82aaff';
            case 'LA CUSTODIA': return '#dfa46a';
            default: return '#ccc';
        }
    }
}
