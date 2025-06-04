let gameState = {
  words: [...todaysPuzzle.words],
  selectedWords: [],
  solvedGroups: [],
  mistakes: 0,
  gameWon: false,
  previousGuesses: [],
  guessHistory: []
};

function initGame() {
  shuffleArray(gameState.words);
  renderGrid();
  updateStats();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  gameState.words.forEach(word => {
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    wordCard.textContent = word;
    wordCard.addEventListener('click', () => toggleWord(word));

    if (gameState.selectedWords.includes(word)) {
      wordCard.classList.add('selected');
    }

    grid.appendChild(wordCard);
  });
}

function toggleWord(word) {
  if (gameState.gameWon) return;

  const index = gameState.selectedWords.indexOf(word);
  if (index > -1) {
    gameState.selectedWords.splice(index, 1);
  } else if (gameState.selectedWords.length < 4) {
    gameState.selectedWords.push(word);
  }

  renderGrid();
}

function submitGuess() {
  if (gameState.selectedWords.length !== 4 || gameState.gameWon) return;

  const sortedGuess = [...gameState.selectedWords].sort().join(',');

  if (gameState.previousGuesses.includes(sortedGuess)) {
    showMessage('You already tried that combination!', 'error');
    return;
  }

  const correctGroup = todaysPuzzle.groups.find(group =>
    gameState.selectedWords.every(word => group.words.includes(word)) &&
    group.words.every(word => gameState.selectedWords.includes(word))
  );

  if (correctGroup) {
    gameState.guessHistory.push({ type: 'correct', difficulty: correctGroup.difficulty });
    gameState.solvedGroups.push(correctGroup);
    gameState.words = gameState.words.filter(word => !correctGroup.words.includes(word));
    gameState.selectedWords = [];

    showMessage(`Correct! ${correctGroup.category}`, 'success');
    renderSolvedGroup(correctGroup);
    renderGrid();
    updateStats();

    if (gameState.solvedGroups.length === 4) {
      gameWon();
    }
  } else {
    gameState.previousGuesses.push(sortedGuess);

    const oneAwayGroup = todaysPuzzle.groups.find(group => {
      const matches = gameState.selectedWords.filter(word => group.words.includes(word)).length;
      return matches === 3;
    });

    if (oneAwayGroup) {
      gameState.guessHistory.push({ type: 'one-away' });
      showMessage('One away! Try again.', 'warning');
    } else {
      gameState.guessHistory.push({ type: 'wrong' });
      showMessage('Not quite right. Try again!', 'error');
    }

    gameState.mistakes++;
    gameState.selectedWords = [];
    renderGrid();
    updateStats();

    if (gameState.mistakes >= 4) {
      gameOver();
    }
  }
}

function renderSolvedGroup(group) {
  const container = document.getElementById('solved-groups');
  const div = document.createElement('div');
  div.className = `solved-group difficulty-${group.difficulty}`;

  group.words.forEach(word => {
    const card = document.createElement('div');
    card.className = 'word-card correct';
    card.textContent = word;
    div.appendChild(card);
  });

  const title = document.createElement('div');
  title.className = 'category-title';
  title.textContent = group.category;
  div.appendChild(title);

  container.appendChild(div);
}

function showMessage(text, type) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = `message ${type} show`;

  setTimeout(() => {
    message.classList.remove('show');
  }, 3000);
}

function updateStats() {
  document.getElementById('mistakes').textContent = gameState.mistakes;
  document.getElementById('groups-found').textContent = gameState.solvedGroups.length;
}

function gameWon() {
  gameState.gameWon = true;
  showMessage("Congratulations! You've solved it!", 'success');

  setTimeout(() => {
    showModal('🎉', 'Congratulations!', 'You solved today\'s History Connections puzzle!');
  }, 1500);
}

function gameOver() {
  gameState.gameWon = true;
  showMessage('Game Over! Better luck tomorrow.', 'error');

  const unsolved = todaysPuzzle.groups.filter(group =>
    !gameState.solvedGroups.some(solved => solved.category === group.category)
  );

  revealUnsolvedGroups(unsolved, 0);
}

function revealUnsolvedGroups(groups, i) {
  if (i >= groups.length) {
    setTimeout(() => {
      showModal('😔', 'Game Over', 'Better luck with tomorrow\'s puzzle!');
    }, 1000);
    return;
  }

  const group = groups[i];
  gameState.words = gameState.words.filter(w => !group.words.includes(w));
  showMessage(`${group.category}: ${group.words.join(', ')}`, 'warning');

  renderSolvedGroupWithAnimation(group, () => {
    renderGrid();
    setTimeout(() => {
      revealUnsolvedGroups(groups, i + 1);
    }, 2000);
  });
}

function renderSolvedGroupWithAnimation(group, callback) {
  const container = document.getElementById('solved-groups');
  const div = document.createElement('div');
  div.className = `solved-group difficulty-${group.difficulty}`;
  div.style.opacity = '0';
  div.style.transform = 'translateY(-20px)';
  div.style.transition = 'all 0.5s ease';

  group.words.forEach(word => {
    const card = document.createElement('div');
    card.className = 'word-card correct';
    card.textContent = word;
    div.appendChild(card);
  });

  const title = document.createElement('div');
  title.className = 'category-title';
  title.textContent = group.category;
  div.appendChild(title);

  container.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '1';
    div.style.transform = 'translateY(0)';
    setTimeout(callback, 500);
  }, 100);
}

function showModal(emoji, title, message) {
  document.getElementById('modal-emoji').textContent = emoji;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  document.getElementById('modal-groups').textContent = `${gameState.solvedGroups.length}/4`;
  document.getElementById('modal-mistakes').textContent = `${gameState.mistakes}/4`;
  renderGuessHistory();
  document.getElementById('modal-overlay').classList.add('show');
}

function renderGuessHistory() {
  const grid = document.getElementById('modal-guess-grid');
  grid.innerHTML = '';
  gameState.guessHistory.forEach(guess => {
    const row = document.createElement('div');
    row.className = 'modal-guess-row';
    for (let i = 0; i < 4; i++) {
      const circle = document.createElement('div');
      circle.className = 'modal-guess-circle';
      if (guess.type === 'correct') {
        circle.classList.add('guess-correct');
      } else if (guess.type === 'one-away') {
        circle.classList.add('guess-one-away');
      } else {
        circle.classList.add('guess-wrong');
      }
      row.appendChild(circle);
    }
    grid.appendChild(row);
  });
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

function shuffleWords() {
  if (gameState.gameWon) return;
  shuffleArray(gameState.words);
  renderGrid();
}

function deselectAll() {
  if (gameState.gameWon) return;
  gameState.selectedWords = [];
  renderGrid();
}

function shareResults() {
  const emojiMap = ['🟨', '🟩', '🟦', '🟪'];
  let result = 'History Connections\n';

  gameState.solvedGroups.forEach(group => {
    const i = ['yellow', 'green', 'blue', 'purple'].indexOf(group.difficulty);
    result += emojiMap[i].repeat(4) + '\n';
  });

  if (navigator.share) {
    navigator.share({ title: 'History Connections', text: result });
  } else {
    navigator.clipboard.writeText(result).then(() => {
      showMessage('Results copied to clipboard!', 'success');
    });
  }
}

// Event listeners
document.getElementById('submit').addEventListener('click', submitGuess);
document.getElementById('shuffle').addEventListener('click', shuffleWords);
document.getElementById('deselect').addEventListener('click', deselectAll);
document.getElementById('share-btn').addEventListener('click', shareResults);
document.getElementById('modal-share-btn').addEventListener('click', shareResults);
document.getElementById('modal-close').addEventListener('click', hideModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') hideModal();
});

// Initialize the game
initGame();
