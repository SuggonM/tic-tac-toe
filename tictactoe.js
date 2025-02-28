const game = document.querySelector('#game');

const turn = game.querySelector('.game-turn');
const rstrt = game.querySelector('.game-restart');
const grid = game.querySelector('.game-grid');
const templates = document.querySelector('template');

const players = [
	{
		id: 0,
		name: 'Green',
		symbol: 'circle',
		html: '&cir;'
	},
	{
		id: 1,
		name: 'Red',
		symbol: 'cross',
		html: '&times;'
	}
];

const board = {
	player: null, // current player
	cells: null, // current board cell values

	initBoard: function() {
		this.player = Math.round(Math.random());
		switchPlayer();

		this.cells = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
		]
	}
};

board.initBoard();

// method to set the button's svg <title>
HTMLButtonElement.prototype.setSvgTitle = function(title = 'Mark here') {
	this.querySelector('svg > title').innerHTML = title;
}

// load external SVGs
// searches in main DOM and <template>'s shadow DOM
const svgs = [document, templates.content].flatMap(view =>
	[...view.querySelectorAll('svg[data-src]')]
);
for (const svg of svgs) {
	const request = await fetch(svg.dataset.src);
	const svgText = await request.text();
	const svgElem = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
	svg.replaceWith(svgElem);
};

// fetch board grid components from <template>

const components = {
	gridCell: () => templates.content.querySelector('.grid-cell').cloneNode(true),
	gridRule: () => templates.content.querySelector('.grid-rule').cloneNode(),
	gridRules: () => templates.content.querySelector('.grid-rules').cloneNode(),
	winnerLine: () => templates.content.querySelector('.winner-line').cloneNode(true)
};

for (let i = 0; i < 9; i++) {
	const cell = components.gridCell();
	cell.setSvgTitle();
	cell.addEventListener('click', cellClicked);
	grid.appendChild(cell);
}

const gridRules = components.gridRules();
grid.appendChild(gridRules);

for (let i = 0; i < 4; i++) {
	const rule = components.gridRule();
	gridRules.appendChild(rule);
}

const winnerLine = components.winnerLine();
grid.appendChild(winnerLine);

// rest of the game logic

function cellClicked(event) {
	event.currentTarget.setSvgTitle(players[board.player].html);
	event.currentTarget.dataset.player = players[board.player].name.toLowerCase();
	event.currentTarget.disabled = true;

	const chosenIndex = [...event.currentTarget.parentElement.children].indexOf(event.currentTarget);
	const row = Math.floor(chosenIndex / 3);
	const col = chosenIndex % 3;
	board.cells[row][col] = board.player;

	const winData = checkWinner();
	if (winData !== null) {
		win(winData);
		return;
	}

	const allCellsFull = board.cells.every(row => row.every(cell => cell !== null));
	if (allCellsFull) {
		turn.textContent = 'Draw';
		game.dataset.winner = 'draw';
		return;
	}

	switchPlayer();
}

function switchPlayer() {
	board.player = (board.player + 1) % 2;

	const playerColor = players[board.player].name;
	turn.textContent = `${playerColor}'s Turn`;
	game.dataset.turn = playerColor.toLowerCase();
}

function win(winData) {
	const playerColor = players[board.player].name;
	turn.textContent = `${playerColor} Wins!`;
	game.dataset.winner = playerColor.toLowerCase();

	if (winData.row !== undefined) {
		winnerLine.style.setProperty('--position', winData.row + 1);
	}
	if (winData.col !== undefined) {
		winnerLine.style.setProperty('--position', winData.col + 1);
		winnerLine.classList.add('vertical');
	}
	if (winData.diag) {
		winnerLine.classList.add('diagonal');
		if (winData.diag === 'right') {
			winnerLine.classList.add('anti');
		}
	}

	grid.querySelectorAll('.grid-cell:not([data-player])').forEach(cell => {
		cell.setSvgTitle('&mdash;');
		cell.disabled = true;
	});
}

function checkWinner() {
	const size = 3;
	const cells = board.cells;
	const diagL = cells[0][0];
	const diagR = cells[0][size - 1];
	let diagLwin = true
	let diagRwin = true;

	for (let i = 0; i < size; i++) {
		// Check row and column in one loop
		if (cells[i][0] !== null && cells[i].every(cell => cell === cells[i][0])) {
			return { winner: cells[i][0], row: i }; // Row win
		}
		if (cells[0][i] !== null && cells.every(row => row[i] === cells[0][i])) {
			return { winner: cells[0][i], col: i }; // Column win
		}

		// Check diagonals
		if (cells[i][i] !== diagL) diagLwin = false;
		if (cells[i][size - 1 - i] !== diagR) diagRwin = false;
	}

	if (diagL !== null && diagLwin) return { winner: diagL, diag: 'left' };
	if (diagR !== null && diagRwin) return { winner: diagR, diag: 'right' };

	return null; // No winner
}

// restart button, reverts all DOM modifications
rstrt.addEventListener('click', function() {
	board.initBoard();
	grid.querySelectorAll('.grid-cell').forEach(cell => {
		cell.setSvgTitle();
		delete cell.dataset.player;
		delete game.dataset.winner;
		winnerLine.classList.remove('vertical', 'diagonal', 'anti');
		winnerLine.removeAttribute('style');
		cell.disabled = false;
	});
});
