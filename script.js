const uploadInput = document.querySelector("#uploadInput");
const cameraInput = document.querySelector("#cameraInput");
const selection = document.querySelector("#selection");
const selectionCount = document.querySelector("#selectionCount");
const selectionNames = document.querySelector("#selectionNames");
const submitButton = document.querySelector("#submitButton");
const uploadStatus = document.querySelector("#uploadStatus");
const uploadButton = document.querySelector("#uploadButton");
const cameraButton = document.querySelector("#cameraButton");
const floatingCameraButton = document.querySelector("#floatingCameraButton");
const uploadLock = document.querySelector("#uploadLock");
const uploadLockMessage = document.querySelector("#uploadLockMessage");
const uploadGate = document.querySelector("#uploadGate");
const cameraToast = document.querySelector("#cameraToast");
const cameraToastMessage = document.querySelector("#cameraToastMessage");
const cameraToastClose = document.querySelector("#cameraToastClose");
const cameraRecorder = document.querySelector("#cameraRecorder");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraResolution = document.querySelector("#cameraResolution");
const cameraRecorderClose = document.querySelector("#cameraRecorderClose");
const takePhotoButton = document.querySelector("#takePhotoButton");
const recordVideoButton = document.querySelector("#recordVideoButton");
const stopVideoButton = document.querySelector("#stopVideoButton");
const cameraZoomControl = document.querySelector("#cameraZoomControl");
const cameraZoom = document.querySelector("#cameraZoom");
const cameraZoomValue = document.querySelector("#cameraZoomValue");
const cameraExposureControl = document.querySelector("#cameraExposureControl");
const cameraExposureButton = document.querySelector("#cameraExposureButton");
const cameraExposureValue = document.querySelector("#cameraExposureValue");
const cameraSwitchButton = document.querySelector("#cameraSwitchButton");
const cameraZoomButtons = document.querySelectorAll("[data-zoom]");
const cameraExposureButtons = document.querySelectorAll("[data-exposure]");
const recordingDuration = document.querySelector("#recordingDuration");
const captureFeedback = document.querySelector("#captureFeedback");
const captureFeedbackText = document.querySelector("#captureFeedbackText");
const captureFeedbackIcon = document.querySelector("#captureFeedbackIcon");
const captureProgress = document.querySelector("#captureProgress");
const captureProgressText = document.querySelector("#captureProgressText");
const saveCaptureButton = document.querySelector("#saveCaptureButton");
let selectedFiles = [];
let uploadsUnlocked = false;
let unlockMessage = "Photo sharing is not open yet.";
let toastTimer;
let cameraStream;
let mediaRecorder;
let recordedChunks = [];
let recordingTimer;
let recordingClock;
let recordingStartedAt;
let discardRecording = false;
let pinchStartDistance;
let pinchStartZoom;
let hardwareCameraZoom = false;
let digitalCameraZoom = 1;
let hardwareCameraExposure = false;
let digitalCameraExposure = 0;
let cameraExposureMinimum = -2;
let cameraExposureMaximum = 2;
let cameraFacingMode = "environment";
let lastCapturedFile;
let captureFeedbackTimer;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 20;
const MAX_UPLOAD_ATTEMPTS = 3;
const RSVP_SESSION_KEY = "weddingRsvpSession";
const CAMERA_NOTICE_KEY = "weddingCameraNoticeDismissed";
const DEFAULT_UNLOCK_AT = "2026-12-14T08:00:00.000Z";

uploadButton.addEventListener("click", () => openPicker(uploadInput));
cameraButton.addEventListener("click", () => openHighQualityCamera(true));
floatingCameraButton.addEventListener("click", () => openHighQualityCamera(true));
cameraToastClose.addEventListener("click", () => dismissCameraToast(true));
cameraRecorderClose.addEventListener("click", closeHighQualityCamera);
takePhotoButton.addEventListener("click", takeHighResolutionPhoto);
recordVideoButton.addEventListener("click", startHighResolutionVideo);
stopVideoButton.addEventListener("click", stopHighResolutionVideo);
cameraZoom.addEventListener("input", applyCameraZoom);
cameraExposureButton.addEventListener("click", () => { cameraExposureControl.hidden = !cameraExposureControl.hidden; });
cameraExposureButtons.forEach(button => button.addEventListener("click", () => setCameraExposure(Number(button.dataset.exposure))));
cameraZoomButtons.forEach(button => button.addEventListener("click", () => setCameraZoom(Number(button.dataset.zoom))));
cameraSwitchButton.addEventListener("click", switchCamera);
cameraPreview.addEventListener("touchstart", startCameraPinch, { passive: false });
cameraPreview.addEventListener("touchmove", moveCameraPinch, { passive: false });
cameraPreview.addEventListener("touchend", endCameraPinch);
saveCaptureButton.addEventListener("click", saveLastCapture);
cameraRecorder.addEventListener("cancel", event => { event.preventDefault(); closeHighQualityCamera(); });
window.addEventListener("pagehide", stopCameraStream);
document.querySelector("#clearButton").addEventListener("click", clearFiles);
submitButton.addEventListener("click", () => uploadFiles());
initializeUploadGate();
initializeSchedule();
window.weddingCameraAppReady = true;

uploadInput.addEventListener("change", addFiles);
cameraInput.addEventListener("change", event => addFiles(event, true));

async function addFiles(event, uploadImmediately = false) {
  if (!uploadsUnlocked) return;
  const incomingFiles = [...event.target.files];
  const availableSlots = Math.max(0, MAX_FILES_PER_BATCH - selectedFiles.length);
  const validFiles = incomingFiles.filter(file => {
    if (file.type.startsWith("image/")) return file.size <= MAX_IMAGE_SIZE;
    if (file.type.startsWith("video/")) return file.size <= MAX_VIDEO_SIZE;
    return false;
  }).slice(0, availableSlots);
  const rejectedCount = incomingFiles.length - validFiles.length;
  if (validFiles.some(file => file.type.startsWith("image/") && file.size > 1.5 * 1024 * 1024)) setStatus("Optimizing photos for a faster upload…");
  const optimizedFiles = await Promise.all(validFiles.map(optimizeImage));

  selectedFiles.push(...optimizedFiles);
  event.target.value = "";
  showFiles();

  if (rejectedCount) {
    setStatus(`${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} skipped. Images can be 15 MB and videos 50 MB.`, "error");
  } else {
    setStatus("");
  }

  if (uploadImmediately && optimizedFiles.length) {
    await uploadFiles(optimizedFiles);
  }
}

async function optimizeImage(file) {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 1.5 * 1024 * 1024 || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", .82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: file.lastModified });
  } catch (error) {
    console.warn("Photo optimization skipped.", error);
    return file;
  }
}

function clearFiles() {
  selectedFiles = [];
  showFiles();
  setStatus("");
}

function showFiles() {
  selection.hidden = selectedFiles.length === 0;
  submitButton.hidden = selectedFiles.length === 0;
  selectionCount.textContent = `${selectedFiles.length} ${selectedFiles.length === 1 ? "memory" : "memories"} ready`;
  selectionNames.textContent = selectedFiles.map(file => file.name).join(", ");
}

async function uploadFiles(files = selectedFiles, onProgress) {
  if (!files.length || !uploadsUnlocked) return;

  submitButton.disabled = true;
  const filesToUpload = [...files];
  const uploadedFiles = [];

  try {
    const config = await getUploadConfig();
    const uploader = await getUploaderIdentity(config);

    for (let index = 0; index < filesToUpload.length; index += 1) {
      const label = `Uploading ${index + 1} of ${filesToUpload.length}${uploader.familyName ? ` as ${uploader.familyName}` : ""}`;
      await uploadFile(filesToUpload[index], config, uploader, percent => {
        setStatus(`${label} · ${percent}%`);
        if (onProgress) onProgress(percent, index, filesToUpload.length);
      });
      uploadedFiles.push(filesToUpload[index]);
    }

    selectedFiles = selectedFiles.filter(file => !uploadedFiles.includes(file));
    showFiles();
    setStatus(`${filesToUpload.length} ${filesToUpload.length === 1 ? "memory was" : "memories were"} uploaded. Thank you!`, "success");
  } catch (error) {
    console.error(error);
    selectedFiles = selectedFiles.filter(file => !uploadedFiles.includes(file));
    showFiles();
    setStatus(error.message || "The upload failed. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

function openPicker(input, showToast = false) {
  if (uploadsUnlocked) {
    input.click();
    return;
  }
  if (!showToast) return;
  if (cameraNoticeWasDismissed()) return;
  cameraToastMessage.textContent = unlockMessage;
  cameraToast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dismissCameraToast(false), 5000);
}

async function openHighQualityCamera(showToast = false) {
  if (!uploadsUnlocked) {
    if (showToast) {
      cameraToastMessage.textContent = unlockMessage;
      cameraToast.hidden = false;
    }
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    cameraInput.click();
    return;
  }
  try {
    cameraRecorder.setAttribute("open", "");
    cameraRecorder.classList.add("active");
    document.documentElement.classList.add("camera-open");
  } catch {
    cameraInput.click();
    return;
  }
  cameraResolution.textContent = "Starting high-quality camera…";
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: cameraFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: true,
    });
    cameraPreview.srcObject = cameraStream;
    await cameraPreview.play();
    const videoTrack = cameraStream.getVideoTracks()[0];
    const settings = videoTrack && videoTrack.getSettings ? videoTrack.getSettings() : {};
    cameraResolution.textContent = settings.width && settings.height
      ? `Recording at ${settings.width} × ${settings.height}`
      : "High-quality camera ready";
    const capabilities = videoTrack && videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
    hardwareCameraZoom = !!(capabilities && capabilities.zoom);
    if (hardwareCameraZoom) {
      cameraZoom.min = capabilities.zoom.min;
      cameraZoom.max = capabilities.zoom.max;
      cameraZoom.step = capabilities.zoom.step || .1;
      cameraZoom.value = settings.zoom || capabilities.zoom.min;
      cameraZoomValue.value = `${Number(cameraZoom.value).toFixed(1)}×`;
      cameraZoomControl.hidden = false;
      cameraResolution.textContent += " · Pinch to zoom";
    } else {
      digitalCameraZoom = 1;
      cameraZoom.min = 1;
      cameraZoom.max = 3;
      cameraZoom.step = .1;
      cameraZoom.value = 1;
      cameraZoomValue.value = "1.0×";
      cameraZoomControl.hidden = false;
      cameraResolution.textContent += " · Digital pinch to zoom";
    }
    cameraZoomButtons.forEach(button => {
      const value = Number(button.dataset.zoom);
      button.disabled = value < Number(cameraZoom.min) || value > Number(cameraZoom.max);
    });
    updateZoomButtons();
    hardwareCameraExposure = !!(capabilities && capabilities.exposureCompensation);
    if (hardwareCameraExposure) {
      cameraExposureMinimum = capabilities.exposureCompensation.min;
      cameraExposureMaximum = capabilities.exposureCompensation.max;
    } else {
      cameraExposureMinimum = -2;
      cameraExposureMaximum = 2;
    }
    cameraExposureButtons.forEach(button => {
      const value = Number(button.dataset.exposure);
      button.disabled = value < cameraExposureMinimum || value > cameraExposureMaximum;
    });
    digitalCameraExposure = 0;
    updateExposureButtons(0);
    cameraExposureButton.hidden = false;
    cameraExposureControl.hidden = true;
  } catch (error) {
    closeHighQualityCamera();
    setStatus("High-quality camera could not open. Opening your phone camera instead.", "error");
    cameraInput.click();
  }
}

async function applyCameraZoom() {
  const track = cameraStream && cameraStream.getVideoTracks()[0];
  if (!track) return;
  const zoom = Number(cameraZoom.value);
  cameraZoomValue.value = `${zoom.toFixed(1)}×`;
  updateZoomButtons();
  if (!hardwareCameraZoom) {
    digitalCameraZoom = zoom;
    cameraPreview.style.transform = `scale(${zoom})`;
    return;
  }
  try {
    await track.applyConstraints({ advanced: [{ zoom }] });
  } catch (error) {
    console.warn("Camera zoom is unavailable.", error);
  }
}

function setCameraZoom(value) {
  cameraZoom.value = Math.min(Number(cameraZoom.max), Math.max(Number(cameraZoom.min), value));
  applyCameraZoom();
}

function updateZoomButtons() {
  const active = Number(cameraZoom.value);
  cameraZoomButtons.forEach(button => button.classList.toggle("active", Math.abs(Number(button.dataset.zoom) - active) < .06));
}

function setCameraExposure(value) {
  const exposure = Math.min(cameraExposureMaximum, Math.max(cameraExposureMinimum, value));
  cameraExposureControl.hidden = true;
  updateExposureButtons(exposure);
  applyCameraExposure(exposure);
}

function updateExposureButtons(exposure) {
  cameraExposureValue.textContent = exposure > 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1);
  cameraExposureButtons.forEach(button => button.classList.toggle("active", Number(button.dataset.exposure) === exposure));
}

async function applyCameraExposure(exposure) {
  const track = cameraStream && cameraStream.getVideoTracks()[0];
  if (!track) return;
  if (!hardwareCameraExposure) {
    digitalCameraExposure = exposure;
    cameraPreview.style.filter = `brightness(${Math.pow(2, exposure / 2)})`;
    return;
  }
  try {
    await track.applyConstraints({ advanced: [{ exposureCompensation: exposure }] });
  } catch (error) {
    console.warn("Camera exposure control is unavailable.", error);
  }
}

function switchCamera() {
  cameraFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
  closeHighQualityCamera();
  openHighQualityCamera(false);
}

function startCameraPinch(event) {
  if (event.touches.length !== 2 || cameraZoomControl.hidden) return;
  event.preventDefault();
  pinchStartDistance = getTouchDistance(event.touches);
  pinchStartZoom = Number(cameraZoom.value);
}

function moveCameraPinch(event) {
  if (event.touches.length !== 2 || !pinchStartDistance || cameraZoomControl.hidden) return;
  event.preventDefault();
  const ratio = getTouchDistance(event.touches) / pinchStartDistance;
  const minimum = Number(cameraZoom.min);
  const maximum = Number(cameraZoom.max);
  cameraZoom.value = Math.min(maximum, Math.max(minimum, pinchStartZoom * ratio));
  applyCameraZoom();
}

function endCameraPinch() {
  pinchStartDistance = undefined;
  pinchStartZoom = undefined;
}

function getTouchDistance(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

async function takeHighResolutionPhoto() {
  if (!cameraStream || !cameraPreview.videoWidth) return;
  takePhotoButton.disabled = true;
  const readyMessage = cameraResolution.textContent;
  const canvas = document.createElement("canvas");
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  const captureContext = canvas.getContext("2d");
  if (!hardwareCameraExposure && digitalCameraExposure && "filter" in captureContext) {
    captureContext.filter = `brightness(${Math.pow(2, digitalCameraExposure / 2)})`;
  }
  if (!hardwareCameraZoom && digitalCameraZoom > 1) {
    const sourceWidth = cameraPreview.videoWidth / digitalCameraZoom;
    const sourceHeight = cameraPreview.videoHeight / digitalCameraZoom;
    const sourceX = (cameraPreview.videoWidth - sourceWidth) / 2;
    const sourceY = (cameraPreview.videoHeight - sourceHeight) / 2;
    captureContext.drawImage(cameraPreview, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  } else {
    captureContext.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .95));
  if (!blob) {
    takePhotoButton.disabled = false;
    return;
  }
  const file = new File([blob], `wedding-${Date.now()}.jpg`, { type: "image/jpeg" });
  setLastCapturedFile(file);
  cameraResolution.textContent = "Photo captured · Uploading automatically…";
  const uploaded = await uploadCapturedFile(file, "Photo");
  if (cameraStream) {
    cameraResolution.textContent = uploaded ? "Photo uploaded · Ready for another" : "Upload failed · Photo kept for retry";
    setTimeout(() => { if (cameraStream) cameraResolution.textContent = readyMessage; }, 1600);
  }
  takePhotoButton.disabled = false;
}

function startHighResolutionVideo() {
  if (!cameraStream || (mediaRecorder && mediaRecorder.state === "recording")) return;
  const mimeTypes = ["video/mp4;codecs=h264,aac", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
  const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";
  recordedChunks = [];
  discardRecording = false;
  try {
    mediaRecorder = new MediaRecorder(cameraStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 8000000,
      audioBitsPerSecond: 128000,
    });
  } catch {
    mediaRecorder = new MediaRecorder(cameraStream);
  }
  mediaRecorder.addEventListener("dataavailable", event => { if (event.data.size) recordedChunks.push(event.data); });
  mediaRecorder.addEventListener("stop", finishHighResolutionVideo, { once: true });
  mediaRecorder.start(1000);
  recordVideoButton.hidden = true;
  takePhotoButton.hidden = true;
  cameraSwitchButton.hidden = true;
  stopVideoButton.hidden = false;
  recordingStartedAt = Date.now();
  recordingDuration.hidden = false;
  updateRecordingDuration();
  recordingClock = setInterval(updateRecordingDuration, 250);
  recordingTimer = setTimeout(stopHighResolutionVideo, 45000);
}

function updateRecordingDuration() {
  const seconds = Math.min(45, Math.floor((Date.now() - recordingStartedAt) / 1000));
  recordingDuration.textContent = `Recording · 00:${String(seconds).padStart(2, "0")} / 00:45`;
}

function stopHighResolutionVideo() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
}

async function finishHighResolutionVideo() {
  clearTimeout(recordingTimer);
  clearInterval(recordingClock);
  if (discardRecording) return;
  const type = (mediaRecorder.mimeType || (recordedChunks[0] && recordedChunks[0].type) || "video/webm").split(";")[0];
  const blob = new Blob(recordedChunks, { type });
  const extension = type.includes("mp4") ? "mp4" : "webm";
  const file = new File([blob], `wedding-${Date.now()}.${extension}`, { type });
  recordVideoButton.hidden = false;
  takePhotoButton.hidden = false;
  cameraSwitchButton.hidden = false;
  stopVideoButton.hidden = true;
  recordingDuration.hidden = true;
  setLastCapturedFile(file);
  if (file.size > MAX_VIDEO_SIZE) {
    setStatus("The recording exceeded 50 MB. Please record a shorter video.", "error");
    showCaptureFeedback("Video saved · Too large to upload", true, 0, true);
    return;
  }
  await uploadCapturedFile(file, "Video");
}

function setLastCapturedFile(file) {
  lastCapturedFile = file;
  saveCaptureButton.hidden = false;
}

function showCaptureFeedback(message, flash = false, percent = 0, autoHide = false) {
  clearTimeout(captureFeedbackTimer);
  captureFeedbackText.textContent = message;
  captureProgress.value = percent;
  captureProgressText.textContent = `${percent}%`;
  captureFeedbackIcon.textContent = percent === 100 ? "✓" : "↑";
  captureFeedback.hidden = false;
  if (flash) {
    cameraRecorder.classList.remove("flash");
    void cameraRecorder.offsetWidth;
    cameraRecorder.classList.add("flash");
  }
  if (autoHide) captureFeedbackTimer = setTimeout(() => { captureFeedback.hidden = true; }, 2200);
}

async function saveLastCapture() {
  if (!lastCapturedFile) return;
  try {
    if (navigator.canShare && navigator.canShare({ files: [lastCapturedFile] })) {
      await navigator.share({ files: [lastCapturedFile], title: "Wedding memory" });
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
  }
  const url = URL.createObjectURL(lastCapturedFile);
  const link = document.createElement("a");
  link.href = url;
  link.download = lastCapturedFile.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function uploadCapturedFile(file, typeLabel) {
  selectedFiles.push(file);
  showFiles();
  showCaptureFeedback(`${typeLabel} taken · Uploading`, true, 0);
  await uploadFiles([file], percent => showCaptureFeedback(`${typeLabel} taken · Uploading`, false, percent));
  const uploaded = !selectedFiles.includes(file);
  showCaptureFeedback(uploaded ? `${typeLabel} uploaded` : `${typeLabel} taken · Upload failed`, false, uploaded ? 100 : captureProgress.value, true);
  return uploaded;
}

function closeHighQualityCamera() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    discardRecording = true;
    mediaRecorder.stop();
  }
  clearTimeout(recordingTimer);
  clearInterval(recordingClock);
  stopCameraStream();
  recordVideoButton.hidden = false;
  takePhotoButton.hidden = false;
  cameraSwitchButton.hidden = false;
  stopVideoButton.hidden = true;
  takePhotoButton.disabled = false;
  recordingDuration.hidden = true;
  captureFeedback.hidden = true;
  clearTimeout(captureFeedbackTimer);
  cameraZoomControl.hidden = true;
  cameraExposureControl.hidden = true;
  hardwareCameraZoom = false;
  digitalCameraZoom = 1;
  hardwareCameraExposure = false;
  digitalCameraExposure = 0;
  cameraPreview.style.transform = "";
  cameraPreview.style.filter = "";
  cameraRecorder.classList.remove("active");
  cameraRecorder.removeAttribute("open");
  document.documentElement.classList.remove("camera-open");
}

function stopCameraStream() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = undefined;
  cameraPreview.srcObject = null;
}

function dismissCameraToast(remember = false) {
  cameraToast.hidden = true;
  clearTimeout(toastTimer);
  if (remember && unlockMessage) {
    try { localStorage.setItem(CAMERA_NOTICE_KEY, unlockMessage); } catch {}
  }
}

function cameraNoticeWasDismissed() {
  try { return localStorage.getItem(CAMERA_NOTICE_KEY) === unlockMessage; } catch { return false; }
}

async function initializeUploadGate() {
  let unlockAt = DEFAULT_UNLOCK_AT;
  try {
    const config = await getUploadConfig();
    const response = await fetch(`/api/site-settings?select=upload_unlock_at&_=${Date.now()}`, { cache: "no-store" });
    const rows = await response.json();
    if (response.ok && rows[0] && rows[0].upload_unlock_at) unlockAt = rows[0].upload_unlock_at;
  } catch (error) {
    console.warn("Using the default upload date.", error);
  }

  const unlockDate = parseSiteDate(unlockAt);
  uploadsUnlocked = Number.isFinite(unlockDate.getTime()) && Date.now() >= unlockDate.getTime();
  uploadGate.classList.toggle("locked", !uploadsUnlocked);
  uploadLock.hidden = uploadsUnlocked;
  if (!uploadsUnlocked) {
    unlockMessage = `Photo sharing opens ${new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month:"long", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" }).format(unlockDate)}.`;
    uploadLockMessage.textContent = unlockMessage;
    floatingCameraButton.setAttribute("aria-label", `Camera locked. ${unlockMessage}`);
  }
}

async function initializeSchedule() {
  try {
    const config = await getUploadConfig();
    const fields = "upload_unlock_at,ceremony_time,ceremony_location,celebration_time,celebration_location";
    const response = await fetch(`/api/site-settings?select=${encodeURIComponent(fields)}&_=${Date.now()}`, { cache: "no-store" });
    let rows = await response.json();
    if (!response.ok || !rows[0]) {
      const fallback = await fetch(`/api/site-settings?select=upload_unlock_at&_=${Date.now()}`, { cache: "no-store" });
      rows = await fallback.json();
      if (!fallback.ok || !rows[0]) return;
    }
    const weddingDate = parseSiteDate(rows[0].upload_unlock_at);
    if (Number.isFinite(weddingDate.getTime())) {
      const options = { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" };
      document.querySelector("#weddingDateShort").textContent = new Intl.DateTimeFormat("en-US", options).format(weddingDate);
      document.querySelector("#weddingDateLong").textContent = new Intl.DateTimeFormat("en-US", { ...options, month: "long" }).format(weddingDate);
    }
    for (const event of ["ceremony", "celebration"]) {
      const time = rows[0][`${event}_time`];
      const location = rows[0][`${event}_location`];
      if (time) document.querySelector(`#${event}Time`).textContent = formatScheduleTime(time);
      if (location) document.querySelector(`#${event}Location`).textContent = location;
    }
  } catch (error) {
    console.warn("Using default schedule details.", error);
  }
}

function parseSiteDate(value) {
  if (value instanceof Date) return value;
  const normalized = String(value || "").trim().replace(" ", "T");
  return new Date(normalized);
}

function formatScheduleTime(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
  if (!match) return value || "Time to be announced";
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
}

async function getUploadConfig() {
  if (window.WEDDING_CONFIG && window.WEDDING_CONFIG.supabaseUrl && window.WEDDING_CONFIG.anonKey) {
    return window.WEDDING_CONFIG;
  }

  const response = await fetch("/api/upload-config", { cache: "no-store" });
  const config = await response.json();

  if (!response.ok) {
    throw new Error(config.error || "Photo uploads are not configured.");
  }

  return config;
}

async function getUploaderIdentity(config) {
  const stored = localStorage.getItem(RSVP_SESSION_KEY);
  if (!stored) {
    return anonymousUploader(config);
  }

  let session;
  try {
    session = JSON.parse(stored);
  } catch {
    localStorage.removeItem(RSVP_SESSION_KEY);
    return anonymousUploader(config);
  }

  if (!session.refresh_token) {
    localStorage.removeItem(RSVP_SESSION_KEY);
    return anonymousUploader(config);
  }

  if (!session.expires_at || session.expires_at * 1000 <= Date.now() + 60000) {
    const refreshResponse = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const refreshed = await refreshResponse.json();
    if (!refreshResponse.ok) {
      localStorage.removeItem(RSVP_SESSION_KEY);
      return anonymousUploader(config);
    }
    session = refreshed;
    localStorage.setItem(RSVP_SESSION_KEY, JSON.stringify(session));
  }

  const authHeaders = { apikey: config.anonKey, Authorization: `Bearer ${session.access_token}` };
  const userResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: authHeaders });
  if (!userResponse.ok) {
    localStorage.removeItem(RSVP_SESSION_KEY);
    return anonymousUploader(config);
  }
  const user = await userResponse.json();
  const rsvpResponse = await fetch(`${config.supabaseUrl}/rest/v1/rsvps?select=family_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: authHeaders });
  const reservations = await rsvpResponse.json();
  if (!rsvpResponse.ok) throw new Error(reservations.message || "Unable to load your reservation name.");
  if (!reservations[0] || !reservations[0].family_name) return anonymousUploader(config);

  return { userId: user.id, familyName: reservations[0].family_name, accessToken: session.access_token };
}

function anonymousUploader(config) {
  return { userId: null, familyName: null, accessToken: config.anonKey };
}

async function uploadFile(file, config, uploader, onProgress) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const dateFolder = new Date().toISOString().slice(0, 10);
  const ownerFolder = uploader.userId || "anonymous";
  const objectName = `guest/${ownerFolder}/${dateFolder}/${createObjectId()}.${extension}`;
  const objectPath = objectName.split("/").map(encodeURIComponent).join("/");
  const url = `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${objectPath}`;
  const headers = { apikey: config.anonKey, Authorization: `Bearer ${uploader.accessToken}`, "Content-Type": file.type, "x-upsert": "false" };

  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    const result = await uploadRequest(url, headers, file, onProgress);
    if (result.ok) return;
    const canRetry = result.status === 0 || result.status >= 500;
    if (!canRetry || attempt === MAX_UPLOAD_ATTEMPTS) {
      throw new Error(result.message || `Upload failed (${result.status || "network error"}).`);
    }
    setStatus(`Connection interrupted. Retrying (${attempt + 1}/${MAX_UPLOAD_ATTEMPTS})…`);
    await new Promise(resolve => setTimeout(resolve, attempt * 700));
  }
}

function uploadRequest(url, headers, file, onProgress) {
  return new Promise(resolve => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.addEventListener("progress", event => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    });
    request.addEventListener("load", () => {
      let details = {};
      try { details = JSON.parse(request.responseText); } catch {}
      resolve({ ok: request.status >= 200 && request.status < 300, status: request.status, message: details.message || details.error });
    });
    request.addEventListener("error", () => resolve({ ok: false, status: 0, message: "Network connection lost." }));
    request.addEventListener("timeout", () => resolve({ ok: false, status: 0, message: "Upload timed out." }));
    request.timeout = 45000;
    request.send(file);
  });
}

function createObjectId() {
  const webCrypto = window.crypto;

  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function setStatus(message, type = "") {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status${type ? ` ${type}` : ""}`;
}
