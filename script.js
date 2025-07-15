let words = []; // Will be populated dynamically
const fallingWordsContainer = document.getElementById('falling-words');
const typingInput = document.getElementById('typing-input');
const scoreValueElement = document.getElementById('score-value');
const wordArea = document.getElementById('word-area'); // To append score feedback

let activeWords = [];
let score = 0;
let gameInterval;

// Game settings
const wordFallDuration = 5000; // milliseconds for word to fall
const wordSpawnInterval = 1500; // milliseconds between new words

async function loadWords() {
    try {
        const response = await fetch('words.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        console.log('Words loaded:', words);
        startGame(); // Start the game only after words are loaded
    } catch (error) {
        console.error('Could not load words:', error);
        // Fallback to static words or display an error message to the user
        words = ["error", "loading", "words", "fallback"];
        startGame();
    }
}

function spawnWord() {
    if (words.length === 0) {
        console.warn("No words available to spawn.");
        return;
    }
    const wordText = words[Math.floor(Math.random() * words.length)];
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');
    wordElement.textContent = wordText;

    const startX = Math.random() * (fallingWordsContainer.offsetWidth - 150); // -150 for word width
    wordElement.style.left = `${startX}px`;
    wordElement.style.transitionDuration = `${wordFallDuration / 1000}s`;

    fallingWordsContainer.appendChild(wordElement);
    activeWords.push({ element: wordElement, text: wordText, typed: false, missed: false });

    // Start the fall animation
    setTimeout(() => {
        wordElement.style.transform = `translateY(${fallingWordsContainer.offsetHeight}px)`;
    }, 50); // Small delay to ensure transition applies

    // Remove word after it falls
    setTimeout(() => {
        if (wordElement.parentNode && !wordElement.dataset.typed) { // Check if it was not typed
            // Capture current position before removal
            const currentWordY = wordElement.offsetTop;
            const currentWordX = wordElement.offsetLeft + wordElement.offsetWidth / 2;

            wordElement.parentNode.removeChild(wordElement);
            activeWords = activeWords.filter(w => w.element !== wordElement);
            updateScore(-1, currentWordX, currentWordY); // Pass the word's actual Y position
        }
    }, wordFallDuration + 100); // A little extra time
}

function checkInput() {
    const typedText = typingInput.value.trim();
    if (typedText === '') return;

    let matchedWord = null;
    let matchedIndex = -1;

    for (let i = 0; i < activeWords.length; i++) {
        if (activeWords[i].text === typedText && !activeWords[i].typed) {
            matchedWord = activeWords[i];
            matchedIndex = i;
            break;
        }
    }

    if (matchedWord) {
        matchedWord.typed = true;
        matchedWord.element.dataset.typed = 'true'; // Mark as typed to prevent score deduction on fall
        matchedWord.element.style.backgroundColor = 'green'; // Visual feedback
        matchedWord.element.style.opacity = '0';
        updateScore(1, matchedWord.element.offsetLeft + matchedWord.element.offsetWidth / 2, matchedWord.element.offsetTop); // Show +1 feedback
        setTimeout(() => {
            if (matchedWord.element.parentNode) {
                matchedWord.element.parentNode.removeChild(matchedWord.element);
                activeWords.splice(matchedIndex, 1);
            }
        }, 500);
    }
    typingInput.value = '';
}

function updateScore(change, x, y) {
    score += change;
    scoreValueElement.textContent = score;

    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('score-feedback');
    feedbackElement.textContent = (change > 0 ? '+' : '') + change;
    feedbackElement.classList.add(change > 0 ? 'plus' : 'minus');

    feedbackElement.style.left = `${x}px`;
    feedbackElement.style.top = `${y}px`; // Start directly at the word's Y position
    wordArea.appendChild(feedbackElement);

    // Animate feedback
    setTimeout(() => {
        feedbackElement.style.opacity = '1';
        feedbackElement.style.transform = `translateY(-50px)`; // Move up 50px from its initial position
    }, 10);

    setTimeout(() => {
        feedbackElement.style.opacity = '0';
        feedbackElement.style.transform = `translateY(-100px)`; // Move further up 100px
        setTimeout(() => {
            if (feedbackElement.parentNode) {
                feedbackElement.parentNode.removeChild(feedbackElement);
            }
        }, 500);
    }, 500);
}

function startGame() {
    gameInterval = setInterval(spawnWord, wordSpawnInterval);
    typingInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkInput();
        }
    });
    typingInput.focus();
}

// Initial call to load words and start the game
loadWords();
