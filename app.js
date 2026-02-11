const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const uploadInput = document.getElementById("upload");
const editorSection = document.querySelector(".editor");
const statusText = document.getElementById("statusText");
const installButton = document.getElementById("installApp");

const controlKeys = [
  "brightness",
  "contrast",
  "blur",
  "grayscale",
  "saturate",
  "hueRotate",
  "sepia",
  "invert",
];

const controls = Object.fromEntries(controlKeys.map((key) => [key, document.getElementById(key)]));
const values = Object.fromEntries(controlKeys.map((key) => [key, document.getElementById(`${key}Value`)]));

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const compareButton = document.getElementById("compare");
const rotateLeftButton = document.getElementById("rotateLeft");
const rotateRightButton = document.getElementById("rotateRight");
const flipHorizontalButton = document.getElementById("flipHorizontal");
const flipVerticalButton = document.getElementById("flipVertical");
const resetButton = document.getElementById("reset");
const downloadButton = document.getElementById("download");
const downloadJpegButton = document.getElementById("downloadJpeg");
const presetButtons = document.querySelectorAll(".preset");

const defaultState = {
  brightness: 100,
  contrast: 100,
  blur: 0,
  grayscale: 0,
  saturate: 100,
  hueRotate: 0,
  sepia: 0,
  invert: 0,
  rotation: 0,
  flipX: 1,
  flipY: 1,
};

const state = {
  image: null,
  ...defaultState,
  compare: false,
};

const history = [];
const redoStack = [];
let installPromptEvent = null;

function setStatus(text) {
  statusText.textContent = text;
}

function saveSettings() {
  const persisted = Object.fromEntries(controlKeys.map((key) => [key, state[key]]));
  localStorage.setItem("photoFlowSettings", JSON.stringify(persisted));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem("photoFlowSettings");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    for (const key of controlKeys) {
      if (typeof parsed[key] === "number") state[key] = parsed[key];
    }
  } catch {
    setStatus("設定の読み込みに失敗したため初期値を利用します");
  }
}

function snapshot() {
  return {
    brightness: state.brightness,
    contrast: state.contrast,
    blur: state.blur,
    grayscale: state.grayscale,
    saturate: state.saturate,
    hueRotate: state.hueRotate,
    sepia: state.sepia,
    invert: state.invert,
    rotation: state.rotation,
    flipX: state.flipX,
    flipY: state.flipY,
  };
}

function applySnapshot(data) {
  Object.assign(state, data);
  syncInputsWithState();
  updateValueLabels();
  saveSettings();
  drawImage();
}

function pushHistory() {
  if (!state.image) return;
  history.push(snapshot());
  if (history.length > 40) history.shift();
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  undoButton.disabled = history.length === 0;
  redoButton.disabled = redoStack.length === 0;
}

function syncInputsWithState() {
  for (const key of controlKeys) {
    controls[key].value = state[key];
  }
}

function formatValue(key, num) {
  if (key === "blur") return `${num}`;
  if (key === "hueRotate") return `${num}`;
  return `${num}`;
}

function updateValueLabels() {
  for (const key of controlKeys) {
    values[key].textContent = formatValue(key, state[key]);
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlaceholder() {
  clearCanvas();
  ctx.fillStyle = "#4b5f8a";
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("画像を選択またはドロップしてください", canvas.width / 2, canvas.height / 2);
}

function fitCanvasToImage(img) {
  const maxWidth = 1400;
  const maxHeight = 1000;
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  canvas.width = Math.floor(img.width * ratio);
  canvas.height = Math.floor(img.height * ratio);
}

function getFilterString() {
  if (state.compare) return "none";

  return `brightness(${state.brightness}%) contrast(${state.contrast}%) blur(${state.blur}px) grayscale(${state.grayscale}%) saturate(${state.saturate}%) hue-rotate(${state.hueRotate}deg) sepia(${state.sepia}%) invert(${state.invert}%)`;
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
  Object.assign(state, defaultState);
  syncInputsWithState();
  updateValueLabels();
  saveSettings();
  drawImage();
  setStatus("編集内容をリセットしました");
}

function setImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("画像ファイルを選択してください");
    return;
  }

  const img = new Image();
  img.onload = () => {
    state.image = img;
    fitCanvasToImage(img);
    history.length = 0;
    redoStack.length = 0;
    loadSettings();
    syncInputsWithState();
    updateValueLabels();
    drawImage();
    updateUndoRedoButtons();
    setStatus(`${file.name} を読み込みました`);
  };
  img.src = URL.createObjectURL(file);
}

function applyPreset(name) {
  if (!state.image) return;
  pushHistory();

  const presets = {
    vivid: { brightness: 110, contrast: 125, saturate: 150, hueRotate: 5, grayscale: 0, sepia: 0, invert: 0, blur: 0 },
    mono: { brightness: 105, contrast: 110, saturate: 0, hueRotate: 0, grayscale: 100, sepia: 0, invert: 0, blur: 0 },
    warm: { brightness: 108, contrast: 108, saturate: 120, hueRotate: 330, grayscale: 0, sepia: 14, invert: 0, blur: 0 },
    cool: { brightness: 98, contrast: 112, saturate: 115, hueRotate: 25, grayscale: 0, sepia: 0, invert: 0, blur: 0 },
    cinematic: { brightness: 96, contrast: 128, saturate: 92, hueRotate: 350, grayscale: 12, sepia: 24, invert: 0, blur: 0 },
  };

  const preset = presets[name];
  if (!preset) return;

  Object.assign(state, preset);
  syncInputsWithState();
  updateValueLabels();
  saveSettings();
  drawImage();
  setStatus(`プリセット ${name} を適用しました`);
}

function download(format) {
  if (!state.image) return;
  const link = document.createElement("a");
  const ext = format === "image/jpeg" ? "jpg" : "png";
  link.download = `edited-image.${ext}`;
  link.href = canvas.toDataURL(format, 0.92);
  link.click();
  setStatus(`${ext.toUpperCase()} で保存しました`);
}

function setupCompareButton() {
  const activate = () => {
    if (!state.image) return;
    state.compare = true;
    drawImage();
  };
  const deactivate = () => {
    if (!state.image) return;
    state.compare = false;
    drawImage();
  };

  compareButton.addEventListener("pointerdown", activate);
  compareButton.addEventListener("pointerup", deactivate);
  compareButton.addEventListener("pointerleave", deactivate);
  compareButton.addEventListener("pointercancel", deactivate);
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    if (ctrlOrCmd && !event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoButton.click();
    }

    if (ctrlOrCmd && event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      redoButton.click();
    }

    if (!ctrlOrCmd && event.key.toLowerCase() === "r") {
      rotateRightButton.click();
    }

    if (!ctrlOrCmd && event.key.toLowerCase() === "f") {
      flipHorizontalButton.click();
    }
  });
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    installPromptEvent = null;
    installButton.hidden = true;
    setStatus("インストール操作を完了しました");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(() => setStatus("Service Workerを登録しました"))
      .catch(() => setStatus("Service Worker登録に失敗しました"));
  }
}

uploadInput.addEventListener("change", (event) => setImageFromFile(event.target.files?.[0]));

editorSection.addEventListener("dragover", (event) => {
  event.preventDefault();
  editorSection.classList.add("dragover");
});
editorSection.addEventListener("dragleave", () => editorSection.classList.remove("dragover"));
editorSection.addEventListener("drop", (event) => {
  event.preventDefault();
  editorSection.classList.remove("dragover");
  setImageFromFile(event.dataTransfer?.files?.[0]);
});

for (const key of controlKeys) {
  controls[key].addEventListener("input", () => {
    if (!state.image) return;
    pushHistory();
    state[key] = Number(controls[key].value);
    updateValueLabels();
    saveSettings();
    drawImage();
  });
}

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
  applySnapshot(history.pop());
  updateUndoRedoButtons();
});

redoButton.addEventListener("click", () => {
  if (!state.image || redoStack.length === 0) return;
  history.push(snapshot());
  applySnapshot(redoStack.pop());
  updateUndoRedoButtons();
});

downloadButton.addEventListener("click", () => download("image/png"));
downloadJpegButton.addEventListener("click", () => download("image/jpeg"));

presetButtons.forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.preset)));

setupCompareButton();
setupKeyboardShortcuts();
setupInstallPrompt();
registerServiceWorker();

loadSettings();
syncInputsWithState();
updateValueLabels();
updateUndoRedoButtons();
drawPlaceholder();
setStatus("準備完了: 画像を選択してください");
