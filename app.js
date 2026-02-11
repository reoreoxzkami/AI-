const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const uploadInput = document.getElementById("upload");
const editorSection = document.querySelector(".editor");

const brightnessInput = document.getElementById("brightness");
const contrastInput = document.getElementById("contrast");
const blurInput = document.getElementById("blur");
const grayscaleInput = document.getElementById("grayscale");
const saturateInput = document.getElementById("saturate");
const hueRotateInput = document.getElementById("hueRotate");

const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const blurValue = document.getElementById("blurValue");
const grayscaleValue = document.getElementById("grayscaleValue");
const saturateValue = document.getElementById("saturateValue");
const hueRotateValue = document.getElementById("hueRotateValue");

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const compareButton = document.getElementById("compare");
const rotateLeftButton = document.getElementById("rotateLeft");
const rotateRightButton = document.getElementById("rotateRight");
const flipHorizontalButton = document.getElementById("flipHorizontal");
const flipVerticalButton = document.getElementById("flipVertical");
const resetButton = document.getElementById("reset");
const downloadButton = document.getElementById("download");
const presetButtons = document.querySelectorAll(".preset");

const state = {
  image: null,
  brightness: 100,
  contrast: 100,
  blur: 0,
  grayscale: 0,
  saturate: 100,
  hueRotate: 0,
  rotation: 0,
  flipX: 1,
  flipY: 1,
  compare: false,
};

const defaultAdjustments = {
  brightness: 100,
  contrast: 100,
  blur: 0,
  grayscale: 0,
  saturate: 100,
  hueRotate: 0,
  rotation: 0,
  flipX: 1,
  flipY: 1,
};

const history = [];
const redoStack = [];

function snapshot() {
  return {
    brightness: state.brightness,
    contrast: state.contrast,
    blur: state.blur,
    grayscale: state.grayscale,
    saturate: state.saturate,
    hueRotate: state.hueRotate,
    rotation: state.rotation,
    flipX: state.flipX,
    flipY: state.flipY,
  };
}

function applySnapshot(data) {
  state.brightness = data.brightness;
  state.contrast = data.contrast;
  state.blur = data.blur;
  state.grayscale = data.grayscale;
  state.saturate = data.saturate;
  state.hueRotate = data.hueRotate;
  state.rotation = data.rotation;
  state.flipX = data.flipX;
  state.flipY = data.flipY;

  syncInputsWithState();
  updateValueLabels();
  drawImage();
}

function pushHistory() {
  if (!state.image) return;
  history.push(snapshot());
  if (history.length > 30) {
    history.shift();
  }
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  undoButton.disabled = history.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

function syncInputsWithState() {
  brightnessInput.value = state.brightness;
  contrastInput.value = state.contrast;
  blurInput.value = state.blur;
  grayscaleInput.value = state.grayscale;
  saturateInput.value = state.saturate;
  hueRotateInput.value = state.hueRotate;
}

function updateValueLabels() {
  brightnessValue.textContent = state.brightness;
  contrastValue.textContent = state.contrast;
  blurValue.textContent = state.blur;
  grayscaleValue.textContent = state.grayscale;
  saturateValue.textContent = state.saturate;
  hueRotateValue.textContent = state.hueRotate;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlaceholder() {
  clearCanvas();
  ctx.fillStyle = "#4b5f8a";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("画像を選択してください", canvas.width / 2, canvas.height / 2);
}

function fitCanvasToImage(img) {
  const maxWidth = 1200;
  const maxHeight = 800;
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  canvas.width = Math.floor(img.width * ratio);
  canvas.height = Math.floor(img.height * ratio);
}

function getFilterString() {
  if (state.compare) {
    return "none";
  }

  return `brightness(${state.brightness}%) contrast(${state.contrast}%) blur(${state.blur}px) grayscale(${state.grayscale}%) saturate(${state.saturate}%) hue-rotate(${state.hueRotate}deg)`;
}

function drawImage() {
  if (!state.image) {
    drawPlaceholder();
    return;
  }

  clearCanvas();

  ctx.save();
  ctx.filter = getFilterString();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipX, state.flipY);

  ctx.drawImage(state.image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  ctx.restore();
}

function resetAdjustments() {
  Object.assign(state, defaultAdjustments);
  syncInputsWithState();
  updateValueLabels();
  drawImage();
}

function setImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const img = new Image();
  img.onload = () => {
    state.image = img;
    fitCanvasToImage(img);
    history.length = 0;
    redoStack.length = 0;
    resetAdjustments();
    updateUndoRedoButtons();
  };
  img.src = URL.createObjectURL(file);
}

function applyPreset(name) {
  if (!state.image) return;
  pushHistory();

  if (name === "vivid") {
    state.brightness = 110;
    state.contrast = 120;
    state.saturate = 145;
    state.hueRotate = 5;
    state.grayscale = 0;
    state.blur = 0;
  }

  if (name === "mono") {
    state.brightness = 105;
    state.contrast = 110;
    state.saturate = 0;
    state.hueRotate = 0;
    state.grayscale = 100;
    state.blur = 0;
  }

  if (name === "warm") {
    state.brightness = 108;
    state.contrast = 108;
    state.saturate = 120;
    state.hueRotate = 330;
    state.grayscale = 0;
    state.blur = 0;
  }

  if (name === "cool") {
    state.brightness = 98;
    state.contrast = 112;
    state.saturate = 115;
    state.hueRotate = 25;
    state.grayscale = 0;
    state.blur = 0;
  }

  syncInputsWithState();
  updateValueLabels();
  drawImage();
}

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  setImageFromFile(file);
});

editorSection.addEventListener("dragover", (event) => {
  event.preventDefault();
  editorSection.classList.add("dragover");
});

editorSection.addEventListener("dragleave", () => {
  editorSection.classList.remove("dragover");
});

editorSection.addEventListener("drop", (event) => {
  event.preventDefault();
  editorSection.classList.remove("dragover");
  const file = event.dataTransfer?.files?.[0];
  setImageFromFile(file);
});

function bindSlider(input, key) {
  input.addEventListener("input", () => {
    if (!state.image) return;
    pushHistory();
    state[key] = Number(input.value);
    updateValueLabels();
    drawImage();
  });
}

bindSlider(brightnessInput, "brightness");
bindSlider(contrastInput, "contrast");
bindSlider(blurInput, "blur");
bindSlider(grayscaleInput, "grayscale");
bindSlider(saturateInput, "saturate");
bindSlider(hueRotateInput, "hueRotate");

rotateLeftButton.addEventListener("click", () => {
  if (!state.image) return;
  pushHistory();
  state.rotation -= 90;
  drawImage();
});

rotateRightButton.addEventListener("click", () => {
  if (!state.image) return;
  pushHistory();
  state.rotation += 90;
  drawImage();
});

flipHorizontalButton.addEventListener("click", () => {
  if (!state.image) return;
  pushHistory();
  state.flipX *= -1;
  drawImage();
});

flipVerticalButton.addEventListener("click", () => {
  if (!state.image) return;
  pushHistory();
  state.flipY *= -1;
  drawImage();
});

resetButton.addEventListener("click", () => {
  if (!state.image) return;
  pushHistory();
  resetAdjustments();
});

undoButton.addEventListener("click", () => {
  if (!state.image || history.length === 0) return;
  redoStack.push(snapshot());
  const previous = history.pop();
  applySnapshot(previous);
  updateUndoRedoButtons();
});

redoButton.addEventListener("click", () => {
  if (!state.image || redoStack.length === 0) return;
  history.push(snapshot());
  const next = redoStack.pop();
  applySnapshot(next);
  updateUndoRedoButtons();
});

compareButton.addEventListener("mousedown", () => {
  if (!state.image) return;
  state.compare = true;
  drawImage();
});

compareButton.addEventListener("mouseup", () => {
  if (!state.image) return;
  state.compare = false;
  drawImage();
});

compareButton.addEventListener("mouseleave", () => {
  if (!state.image) return;
  state.compare = false;
  drawImage();
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
  });
});

downloadButton.addEventListener("click", () => {
  if (!state.image) return;
  const link = document.createElement("a");
  link.download = "edited-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

updateValueLabels();
updateUndoRedoButtons();
drawPlaceholder();
