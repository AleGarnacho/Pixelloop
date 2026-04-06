/* ===== Photobooth – tanpa frame ===== */

let capturedPhotos = [];
let photoCount = 0;

const screens = document.querySelectorAll(".screen");
const videoFeed = document.getElementById("video-feed");
const stripFrames = document.querySelectorAll(".strip-frame");
const captureManualBtn = document.getElementById("capture-manual-btn");
const actionButtons = document.getElementById("action-buttons");
const remainingShotsDisplay = document.getElementById("remaining-shots");

/* ===== NAV ===== */
function goToScreen(id) {
  screens.forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "camera-screen") startCameraSession();
  else stopCamera();
}

/* ===== CAMERA ===== */
async function startCameraSession() {
  capturedPhotos = [];
  photoCount = 0;
  remainingShotsDisplay.textContent = 6;

  stripFrames.forEach((f) => {
    f.style.backgroundImage = "none";
    f.style.border = "1px dashed var(--color-dark-brown)";
  });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
      audio: false,
    });
    videoFeed.srcObject = stream;
    videoFeed.style.display = "block";
    videoFeed.style.objectFit = "cover";
    videoFeed.style.transform = "scaleX(-1)";
    captureManualBtn.style.display = "block";
    captureManualBtn.disabled = false;
  } catch (err) {
    alert("Tidak bisa akses kamera. Pastikan izinnya diaktifkan.");
    console.error(err);
    goToScreen("start-screen");
  }
}

function stopCamera() {
  if (videoFeed.srcObject) {
    videoFeed.srcObject.getTracks().forEach((t) => t.stop());
    videoFeed.srcObject = null;
  }
}

/* ===== COUNTDOWN & SHOOT ===== */
function triggerPhotoSession() {
  if (photoCount >= 6) return alert("Sesi foto sudah selesai!");
  captureManualBtn.disabled = true;

  const overlay = document.createElement("div");
  overlay.id = "countdown-overlay";
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    display: "grid",
    placeItems: "center",
    fontSize: "72px",
    color: "#fff",
    textShadow: "0 0 20px #000",
    background: "rgba(0,0,0,.2)",
    zIndex: 5,
  });
  document.getElementById("camera-view-port").appendChild(overlay);

  let c = 5;
  overlay.textContent = c;
  const iv = setInterval(() => {
    c--;
    if (c > 0) overlay.textContent = c;
    else {
      overlay.textContent = "📸";
      setTimeout(() => {
        overlay.remove();
        takePhoto();
      }, 300);
      clearInterval(iv);
    }
  }, 800);
}

/* ===== CAPTURE ===== */
function takePhoto() {
  if (!videoFeed.videoWidth) {
    alert("Kamera belum siap.");
    captureManualBtn.disabled = false;
    return;
  }

  const W = 1080,
    H = 810;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // cover-crop 4:3
  const vw = videoFeed.videoWidth,
    vh = videoFeed.videoHeight;
  const vr = vw / vh,
    cr = W / H;
  let sx, sy, sw, sh;
  if (vr > cr) {
    sh = vh;
    sw = vh * cr;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    sw = vw;
    sh = vw / cr;
    sx = 0;
    sy = (vh - sh) / 2;
  }

  ctx.drawImage(videoFeed, sx, sy, sw, sh, 0, 0, W, H);

  const dataURL = canvas.toDataURL("image/jpeg", 0.92);

  capturedPhotos.push(dataURL);
  if (stripFrames[photoCount]) {
    const f = stripFrames[photoCount];
    f.style.backgroundImage = `url(${dataURL})`;
    f.style.backgroundSize = "cover";
    f.style.backgroundPosition = "center";
    f.style.border = "none";
  }

  photoCount++;
  remainingShotsDisplay.textContent = 6 - photoCount;

  if (photoCount < 6)
    setTimeout(() => (captureManualBtn.disabled = false), 400);
  else finishSession();
}

/* ===== EXPORT STRIP ===== */
function createFinalPhotoStrip(cb) {
  const cols = 2,
    rows = 3,
    pad = 20;
  const pw = 400,
    ph = 300;
  const canvas = document.createElement("canvas");
  canvas.width = pw * cols + pad * (cols + 1);
  canvas.height = ph * rows + pad * (rows + 1);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let loaded = 0;
  if (!capturedPhotos.length) return cb(canvas.toDataURL("image/jpeg", 0.92));

  capturedPhotos.forEach((url, i) => {
    const img = new Image();
    img.onload = () => {
      const x = pad + (i % cols) * (pw + pad);
      const y = pad + Math.floor(i / cols) * (ph + pad);
      ctx.drawImage(img, x, y, pw, ph);
      if (++loaded === capturedPhotos.length)
        cb(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = url;
  });
}

function saveFinalPhoto() {
  const btn = document.getElementById("save-button");
  btn.textContent = "Processing...";
  btn.disabled = true;

  setTimeout(() => {
    createFinalPhotoStrip((url) => {
      const a = document.createElement("a");
      a.download = `photobooth-${Date.now()}.jpeg`;
      a.href = url;
      a.click();
      btn.textContent = "📥 SAVE FOTO (JPEG)";
      btn.disabled = false;
      alert("Foto strip berhasil diunduh!");
    });
  }, 400);
}

function finishSession() {
  stopCamera();
  captureManualBtn.style.display = "none";
  actionButtons.style.display = "flex";
}

/* expose utk onclick HTML */
window.goToScreen = goToScreen;
window.triggerPhotoSession = triggerPhotoSession;
window.saveFinalPhoto = saveFinalPhoto;

/* init */
document.addEventListener("DOMContentLoaded", () => goToScreen("start-screen"));
