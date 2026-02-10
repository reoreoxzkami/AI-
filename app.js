const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const uploadInput = document.getElementById("upload");
const brightnessInput = document.getElementById("brightness");
const contrastInput = document.getElementById("contrast");
const blurInput = document.getElementById("blur");
const grayscaleInput = document.getElementById("grayscale");

const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const blurValue = document.getElementById("blurValue");
const grayscaleValue = document.getElementById("grayscaleValue");

const rotateLeftButton = document.getElementById("rotateLeft");
const rotateRightButton = document.getElementById("rotateRight");
const flipHorizontalButton = document.getElementById("flipHorizontal");
const flipVerticalButton = document.getElementById("flipVertical");
const resetButton = document.getElementById("reset");
const downloadButton = document.getElementById("download");

const state = {
  image: null,
  brightness: 100,
  contrast: 100,
  blur: 0,
  grayscale: 0,
  rotation: 0,
  flipX: 1,
  flipY: 1,
};

function updateValueLabels() {
  brightnessValue.textContent = state.brightness;
  contrastValue.textContent = state.contrast;
  blurValue.textContent = state.blur;
  grayscaleValue.textContent = state.grayscale;
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

function drawImage() {
  if (!state.image) {
    drawPlaceholder();
    return;
  }

  clearCanvas();

  ctx.save();
  ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) blur(${state.blur}px) grayscale(${state.grayscale}%)`;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipX, state.flipY);

  ctx.drawImage(state.image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  ctx.restore();
}

function resetAdjustments() {
  state.brightness = 100;
  state.contrast = 100;
  state.blur = 0;
  state.grayscale = 0;
  state.rotation = 0;
  state.flipX = 1;
  state.flipY = 1;

  brightnessInput.value = state.brightness;
  contrastInput.value = state.contrast;
  blurInput.value = state.blur;
  grayscaleInput.value = state.grayscale;

  updateValueLabels();
  drawImage();
}

uploadInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    state.image = img;
    fitCanvasToImage(img);
    resetAdjustments();
  };
  img.src = URL.createObjectURL(file);
});

brightnessInput.addEventListener("input", () => {
  state.brightness = Number(brightnessInput.value);
  updateValueLabels();
  drawImage();
});

contrastInput.addEventListener("input", () => {
  state.contrast = Number(contrastInput.value);
  updateValueLabels();
  drawImage();
});

blurInput.addEventListener("input", () => {
  state.blur = Number(blurInput.value);
  updateValueLabels();
  drawImage();
});

grayscaleInput.addEventListener("input", () => {
  state.grayscale = Number(grayscaleInput.value);
  updateValueLabels();
  drawImage();
});

rotateLeftButton.addEventListener("click", () => {
  state.rotation -= 90;
  drawImage();
});

rotateRightButton.addEventListener("click", () => {
  state.rotation += 90;
  drawImage();
});

flipHorizontalButton.addEventListener("click", () => {
  state.flipX *= -1;
  drawImage();
});

flipVerticalButton.addEventListener("click", () => {
  state.flipY *= -1;
  drawImage();
});

resetButton.addEventListener("click", () => {
  if (!state.image) return;
  resetAdjustments();
});

downloadButton.addEventListener("click", () => {
  if (!state.image) return;
  const link = document.createElement("a");
  link.download = "edited-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

updateValueLabels();
drawPlaceholder();
