// Constants
const STORAGE_KEYS = {
  format: 'cistercian-date-format',
  showDecimals: 'cistercian-date-show-decimals',
  weight: 'cistercian-date-weight',
  aspectRatio: 'cistercian-date-aspect-ratio'
};

const DEFAULTS = {
  format: 'us',
  showDecimals: 'true',
  weight: '0.5',
  aspectRatio: '1'
};

// Cistercian number configuration
const CISTERCIAN = {
  characters: {
    1: [[1, 2]], 2: [[4, 5]], 3: [[1, 5]], 4: [[4, 2]],
    5: [[1, 2], [4, 2]], 6: [[2, 5]], 7: [[1, 2], [2, 5]],
    8: [[2, 5], [4, 5]], 9: [[1, 2], [2, 5], [4, 5]],
    10: [[0, 1]], 20: [[3, 4]], 30: [[3, 1]], 40: [[0, 4]],
    50: [[0, 1], [0,4]], 60: [[0, 3]], 70: [[0, 3], [0, 1]],
    80: [[0, 3], [3, 4]], 90: [[0, 1], [0, 3], [3, 4]],
    100: [[10, 11]], 200: [[7, 8]], 300: [[10, 8]], 400: [[7, 11]],
    500: [[7, 11], [10, 11]], 600: [[8, 11]], 700: [[10, 11], [8, 11]],
    800: [[7, 8], [8, 11]], 900: [[7, 8], [10, 11], [8, 11]],
    1000: [[9, 10]], 2000: [[6, 7]], 3000: [[6, 10]], 4000: [[9, 7]],
    5000: [[9, 7], [9, 10]], 6000: [[6, 9]], 7000: [[6, 9], [9, 10]],
    8000: [[6, 9], [6, 7]], 9000: [[6, 9], [6, 7], [9, 10]]
  },

  positions: (() => {
    const oneThird = 5/14;
    return {
      0: [0, 0], 1: [0.5, 0], 2: [1, 0],
      3: [0, oneThird], 4: [0.5, oneThird], 5: [1, oneThird],
      6: [0, 1 - oneThird], 7: [0.5, 1 - oneThird], 8: [1, 1 - oneThird],
      9: [0, 1], 10: [0.5, 1], 11: [1, 1]
    };
  })()
};

// Helper functions
const getStorage = (key) => localStorage.getItem(STORAGE_KEYS[key]) || DEFAULTS[key];
const setStorage = (key, value) => localStorage.setItem(STORAGE_KEYS[key], value);

function getDateParts() {
  const date = new Date();
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    year: date.getFullYear(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds()
  };
}

function getOrderedItems(dateParts) {
  const format = getStorage('format');
  const { year, month, day, hours, minutes, seconds } = dateParts;

  const formats = {
    iso: [year, month, day, hours, minutes, seconds],
    us: [month, day, year, hours, minutes, seconds],
    eu: [day, month, year, hours, minutes, seconds]
  };

  return formats[format] || formats.us;
}

// Drawing functions
function numberToCistercianCharacters(number) {
  if (number > 9999) {
    throw new Error('Number must be less than 10000');
  }
  let characters = [];
  let thousands = Math.floor(number / 1000);
  let hundreds = Math.floor((number % 1000) / 100);
  let tens = Math.floor((number % 100) / 10);
  let ones = number % 10;

  if (thousands > 0) {
    characters.push(...CISTERCIAN.characters[thousands * 1000]);
  }
  if (hundreds > 0) {
    characters.push(...CISTERCIAN.characters[hundreds * 100]);
  }
  if (tens > 0) {
    characters.push(...CISTERCIAN.characters[tens * 10]);
  }
  if (ones > 0) {
    characters.push(...CISTERCIAN.characters[ones]);
  }
  return characters;
}

function drawCistercianNumber(number, width, height, weight = 0, color = 'black') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  weight = Math.min(Math.max(weight, 0), 1);
  const lineWidth = 2 + weight * Math.sqrt(height * width) / 6;
  const margin = lineWidth;
  const halfMargin = margin / 2;

  canvas.width = width;
  canvas.height = height;

  // Setup context
  ctx.lineCap = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.clearRect(0, 0, width, height);

  // Draw center line
  ctx.beginPath();
  ctx.moveTo(width * 0.5, halfMargin);
  ctx.lineTo(width * 0.5, height - halfMargin);
  ctx.stroke();

  // Draw number segments
  const characters = numberToCistercianCharacters(number);

  characters.forEach(([start, end]) => {
    ctx.beginPath();
    ctx.moveTo(
      halfMargin + (width - margin) * CISTERCIAN.positions[start][0],
      halfMargin + (height - margin) * CISTERCIAN.positions[start][1]
    );
    ctx.lineTo(
      halfMargin + (width - margin) * CISTERCIAN.positions[end][0],
      halfMargin + (height - margin) * CISTERCIAN.positions[end][1]
    );
    ctx.stroke();
  });

  return canvas;
}

// Main drawing function
let timer;
function drawCounter() {
  const canvas = document.getElementById('cistercian-date');
  const ctx = canvas.getContext('2d');

  // Calculate dimensions
  const windowWidth = window.innerWidth;
  const maxWidth = 2 * Math.min(windowWidth * 0.9, 1500);
  const aspectRatio = parseFloat(getStorage('aspectRatio'));
  const numberOfDigits = 6;
  const spacing = 0.35;
  const totalSlices = numberOfDigits + (numberOfDigits - 1) * spacing;
  const widthWithoutSpacing = maxWidth / totalSlices;
  const widthWithSpacing = widthWithoutSpacing * (1 + spacing);
  const height = widthWithoutSpacing * aspectRatio;

  // Setup canvas
  canvas.width = maxWidth;
  canvas.height = height;
  canvas.style.width = `${maxWidth/2}px`;
  canvas.style.height = `${height/2}px`;
  ctx.clearRect(0, 0, maxWidth, height);

  // Draw numbers
  const weight = parseFloat(getStorage('weight'));
  const dateParts = getDateParts();
  const orderedItems = getOrderedItems(dateParts);

  orderedItems.forEach((value, index) => {
    ctx.drawImage(
      drawCistercianNumber(value, widthWithoutSpacing, height, weight),
      index * widthWithSpacing,
      0
    );
    document.querySelector(`.v${index + 1}`).textContent = value;
  });

  timer = setTimeout(drawCounter, 1000);
}

// UI Controls
function initializeControls() {
  const elements = {
    questionIcon: document.querySelector('.question-icon'),
    closeIcon: document.querySelector('.close-icon'),
    menu: document.querySelector('.menu'),
    formatRadios: document.querySelectorAll('input[name="dateFormat"]'),
    weightSlider: document.querySelector('#weightSlider'),
    aspectSlider: document.querySelector('#aspectSlider'),
    showDecimalsToggle: document.querySelector('#showDecimals'),
    datetimeDisplay: document.querySelector('.datetime')
  };

  // Initialize states
  document.querySelector(`input[value="${getStorage('format')}"]`).checked = true;
  elements.weightSlider.value = getStorage('weight');
  elements.aspectSlider.value = getStorage('aspectRatio');
  elements.showDecimalsToggle.checked = getStorage('showDecimals') === 'true';

  // Initialize decimal visibility
  document.body.classList.toggle('show-decimals', getStorage('showDecimals') === 'true');

  // Event listeners
  elements.questionIcon.addEventListener('click', () => {
    elements.questionIcon.style.display = 'none';
    elements.menu.classList.add('visible');
  });

  elements.closeIcon.addEventListener('click', () => {
    elements.menu.classList.remove('visible');
    elements.questionIcon.style.display = 'block';
  });

  elements.formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        setStorage('format', e.target.value);
        clearTimeout(timer);
        drawCounter();
      }
    });
  });

  elements.weightSlider.addEventListener('input', (e) => {
    setStorage('weight', e.target.value);
    clearTimeout(timer);
    drawCounter();
  });

  elements.aspectSlider.addEventListener('input', (e) => {
    setStorage('aspectRatio', e.target.value);
    clearTimeout(timer);
    drawCounter();
  });

  elements.showDecimalsToggle.addEventListener('change', (e) => {
    setStorage('showDecimals', e.target.checked);
    document.body.classList.toggle('show-decimals', e.target.checked);
  });
}
window.addEventListener('resize', () => {
  clearTimeout(timer);
  drawCounter();
});

// Stopwatch configuration
const STOPWATCH = {
  startTime: null,
  elapsedTime: 0,
  isRunning: false,
  timer: null,
  precision: 'seconds'
};

function initializeStopwatch() {
  const elements = {
    startStopButton: document.querySelector('#startStopButton'),
    resetButton: document.querySelector('#resetButton'),
    canvas: document.querySelector('#stopwatchCanvas'),
    decimal: document.querySelector('.stopwatch-decimal'),
    precisionRadios: document.querySelectorAll('input[name="precision"]')
  };

  function redrawStopwatch() {
    if (STOPWATCH.elapsedTime !== undefined) {
      const ctx = elements.canvas.getContext('2d');
      ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      drawStopwatchDisplay(ctx, Math.floor(STOPWATCH.precision === 'milliseconds' ?
        STOPWATCH.elapsedTime : STOPWATCH.elapsedTime / 1000));
    }
  }

  function resizeStopwatchCanvas() {
    const windowWidth = window.innerWidth;
    const maxWidth = 2 * Math.min(windowWidth * 0.9, 400);
    const aspectRatio = parseFloat(getStorage('aspectRatio'));
    elements.canvas.width = maxWidth;
    elements.canvas.height = maxWidth / 2 * aspectRatio;
    elements.canvas.style.width = `${maxWidth/2}px`;
    elements.canvas.style.height = `${maxWidth/4 * aspectRatio}px`;
    redrawStopwatch();
  }

  // Initial size setup
  resizeStopwatchCanvas();

  // Add aspect ratio change listener
  document.querySelector('#aspectSlider').addEventListener('input', resizeStopwatchCanvas);

  // Add line weight change listener
  document.querySelector('#weightSlider').addEventListener('input', redrawStopwatch);

  // Add resize listener
  window.addEventListener('resize', resizeStopwatchCanvas);

  function updateStopwatch() {
    if (!STOPWATCH.isRunning) return;

    const now = Date.now();
    STOPWATCH.elapsedTime = now - STOPWATCH.startTime;

    let displayValue;
    if (STOPWATCH.precision === 'milliseconds') {
      displayValue = Math.floor(STOPWATCH.elapsedTime);
      if (displayValue >= 9999) {
        toggleStopwatch();
        displayValue = 9999;
      } else {
        STOPWATCH.timer = requestAnimationFrame(updateStopwatch);
      }
    } else {
      displayValue = Math.floor(STOPWATCH.elapsedTime / 1000);
      if (displayValue >= 9999) {
        toggleStopwatch();
        displayValue = 9999;
      } else {
        STOPWATCH.timer = setTimeout(updateStopwatch, 1000);
      }
    }

    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    drawStopwatchDisplay(ctx, displayValue);
    elements.decimal.textContent = displayValue + (STOPWATCH.precision === 'milliseconds' ? 'ms' : 's');
  }

  function drawStopwatchDisplay(ctx, value) {
    const weight = parseFloat(getStorage('weight'));
    ctx.drawImage(
      drawCistercianNumber(value, elements.canvas.width/2, elements.canvas.height, weight),
      elements.canvas.width/4,
      0
    );
  }

  function toggleStopwatch() {
    if (STOPWATCH.isRunning) {
      // Stop
      STOPWATCH.isRunning = false;
      if (STOPWATCH.precision === 'milliseconds') {
        cancelAnimationFrame(STOPWATCH.timer);
      } else {
        clearTimeout(STOPWATCH.timer);
      }
      elements.startStopButton.textContent = 'Start';
    } else {
      // Start
      STOPWATCH.isRunning = true;
      // Reset if we were stopped at max value
      if (STOPWATCH.elapsedTime >= 9999) {
        STOPWATCH.elapsedTime = 0;
        STOPWATCH.startTime = null;
      }

      if (!STOPWATCH.startTime) {
        STOPWATCH.startTime = Date.now();
      } else {
        STOPWATCH.startTime = Date.now() - STOPWATCH.elapsedTime;
      }
      elements.startStopButton.textContent = 'Stop';
      updateStopwatch();
    }
  }

  function resetStopwatch() {
    STOPWATCH.isRunning = false;
    STOPWATCH.startTime = null;
    STOPWATCH.elapsedTime = 0;
    if (STOPWATCH.precision === 'milliseconds') {
      cancelAnimationFrame(STOPWATCH.timer);
    } else {
      clearTimeout(STOPWATCH.timer);
    }
    elements.startStopButton.textContent = 'Start';

    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawStopwatchDisplay(ctx, 0);
    elements.decimal.textContent = '0' + (STOPWATCH.precision === 'milliseconds' ? 'ms' : 's');
  }

  // Event listeners
  elements.startStopButton.addEventListener('click', toggleStopwatch);
  elements.resetButton.addEventListener('click', resetStopwatch);

  elements.precisionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        STOPWATCH.precision = e.target.value;
        resetStopwatch();
      }
    });
  });

  // Initialize display
  resetStopwatch();
}

function initializeGlyphBuilder() {
  const elements = {
    grid: document.querySelector('.grid'),
    result: document.querySelector('.build-a-glyph .result'),
    resultDecimal: document.querySelector('.build-a-glyph .result-decimal')
  };

  const state = {
    selected: {
      thousands: 0,
      hundreds: 0,
      tens: 0,
      ones: 0
    },
    cells: {
      thousands: [],
      hundreds: [],
      tens: [],
      ones: []
    }
  };

  function updateCellVisuals() {
    Object.entries(state.cells).forEach(([position, cells]) => {
      cells.forEach(({ cell, updateCell, value }) => {
        const isSelected = state.selected[position] === value;
        cell.classList.toggle('selected', isSelected);
        updateCell(isSelected);
      });
    });
  }

  function createGlyphCell(value, position) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';

    const canvas = document.createElement('canvas');
    const decimal = document.createElement('div');
    decimal.className = 'grid-cell-decimal decimal';
    decimal.textContent = value;

    function updateCell(isSelected) {
      const windowWidth = window.innerWidth;
      const maxWidth = 2 * Math.min(windowWidth * 0.15, 100);
      const aspectRatio = parseFloat(getStorage('aspectRatio'));
      canvas.width = maxWidth;
      canvas.height = maxWidth / 2 * aspectRatio;
      canvas.style.width = `${maxWidth/2}px`;
      canvas.style.height = `${maxWidth/4 * aspectRatio}px`;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const weight = parseFloat(getStorage('weight'));
      const color = isSelected ? '#000' : '#777';
      ctx.drawImage(
        drawCistercianNumber(value, canvas.width/2, canvas.height, weight, color),
        canvas.width/4,
        0
      );
    }

    const cellData = { cell, updateCell, value };
    state.cells[position].push(cellData);

    cell.appendChild(canvas);
    cell.appendChild(decimal);
    updateCell(false);

    cell.addEventListener('click', () => {
      const currentValue = state.selected[position];
      state.selected[position] = currentValue === value ? 0 : value;
      updateCellVisuals();
      updateResult();
    });

    return cellData;
  }

  function updateResult() {
    const { thousands, hundreds, tens, ones } = state.selected;
    const resultValue = thousands + hundreds + tens + ones;

    const windowWidth = window.innerWidth;
    const maxWidth = 2 * Math.min(windowWidth * 0.4, 400); // Increased size
    const aspectRatio = parseFloat(getStorage('aspectRatio'));
    elements.result.width = maxWidth;
    elements.result.height = maxWidth / 2 * aspectRatio;
    elements.result.style.width = `${maxWidth/2}px`;
    elements.result.style.height = `${maxWidth/4 * aspectRatio}px`;

    const ctx = elements.result.getContext('2d');
    ctx.clearRect(0, 0, elements.result.width, elements.result.height);

    const weight = parseFloat(getStorage('weight'));

      ctx.drawImage(
        drawCistercianNumber(resultValue, elements.result.width/2, elements.result.height, weight),
        elements.result.width/4,
        0
      );


    elements.resultDecimal.textContent = resultValue || '0';
  }

  // Create grid cells
  const cells = [];
  for (let i = 1; i <= 9; i++) {
    cells.push(createGlyphCell(i * 1000, 'thousands'));
    cells.push(createGlyphCell(i * 100, 'hundreds'));
    cells.push(createGlyphCell(i * 10, 'tens'));
    cells.push(createGlyphCell(i, 'ones'));
  }

  // Add cells to grid
  cells.forEach(({ cell }) => elements.grid.appendChild(cell));

  // Update control listeners
  document.querySelector('#weightSlider').addEventListener('input', () => {
    updateCellVisuals();
    updateResult();
  });

  document.querySelector('#aspectSlider').addEventListener('input', () => {
    updateCellVisuals();
    updateResult();
  });

  // Initial result
  updateResult();

  // Handle window resize
  window.addEventListener('resize', () => {
    updateCellVisuals();
    updateResult();
  });
}

// Initialize on ready
document.addEventListener('DOMContentLoaded', () => {
  initializeControls();
  initializeStopwatch();
  initializeGlyphBuilder();
  drawCounter();
});
