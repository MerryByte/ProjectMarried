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
let selectedFiles = [];
let uploadsUnlocked = false;
let unlockMessage = "Photo and video sharing is not open yet.";
let toastTimer;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const RSVP_SESSION_KEY = "weddingRsvpSession";
const DEFAULT_UNLOCK_AT = "2026-12-14T08:00:00.000Z";

uploadButton.addEventListener("click", () => openPicker(uploadInput));
cameraButton.addEventListener("click", () => openPicker(cameraInput));
floatingCameraButton.addEventListener("click", () => openPicker(cameraInput, true));
cameraToastClose.addEventListener("click", dismissCameraToast);
document.querySelector("#clearButton").addEventListener("click", clearFiles);
submitButton.addEventListener("click", () => uploadFiles());
initializeUploadGate();

uploadInput.addEventListener("change", addFiles);
cameraInput.addEventListener("change", event => addFiles(event, true));

async function addFiles(event, uploadImmediately = false) {
  if (!uploadsUnlocked) return;
  const incomingFiles = [...event.target.files];
  const validFiles = incomingFiles.filter(file => file.type.startsWith("image/") && file.size <= MAX_FILE_SIZE);
  const rejectedCount = incomingFiles.length - validFiles.length;

  selectedFiles.push(...validFiles);
  event.target.value = "";
  showFiles();

  if (rejectedCount) {
    setStatus(`${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} skipped. Choose images up to 15 MB each.`, "error");
  } else {
    setStatus("");
  }

  if (uploadImmediately && validFiles.length) {
    await uploadFiles(validFiles);
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

async function uploadFiles(files = selectedFiles) {
  if (!files.length || !uploadsUnlocked) return;

  submitButton.disabled = true;
  const filesToUpload = [...files];
  const uploadedFiles = [];

  try {
    const config = await getUploadConfig();
    const uploader = await getUploaderIdentity(config);

    for (let index = 0; index < filesToUpload.length; index += 1) {
      setStatus(`Uploading ${index + 1} of ${filesToUpload.length}${uploader.familyName ? ` as ${uploader.familyName}` : ""}…`);
      await uploadFile(filesToUpload[index], config, uploader);
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
  cameraToastMessage.textContent = unlockMessage;
  cameraToast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(dismissCameraToast, 5000);
}

function dismissCameraToast() {
  cameraToast.hidden = true;
  clearTimeout(toastTimer);
}

async function initializeUploadGate() {
  let unlockAt = DEFAULT_UNLOCK_AT;
  try {
    const config = await getUploadConfig();
    const response = await fetch(`${config.supabaseUrl}/rest/v1/site_settings?select=upload_unlock_at&id=eq.wedding&limit=1`, {
      headers: { apikey: config.anonKey },
      cache: "no-store",
    });
    const rows = await response.json();
    if (response.ok && rows[0]?.upload_unlock_at) unlockAt = rows[0].upload_unlock_at;
  } catch (error) {
    console.warn("Using the default upload date.", error);
  }

  const unlockDate = new Date(unlockAt);
  uploadsUnlocked = Number.isFinite(unlockDate.getTime()) && Date.now() >= unlockDate.getTime();
  uploadGate.classList.toggle("locked", !uploadsUnlocked);
  uploadLock.hidden = uploadsUnlocked;
  if (!uploadsUnlocked) {
    unlockMessage = `Photo and video sharing opens ${new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(unlockDate)}.`;
    uploadLockMessage.textContent = unlockMessage;
    floatingCameraButton.setAttribute("aria-label", `Camera locked. ${unlockMessage}`);
  }
}

async function getUploadConfig() {
  if (window.WEDDING_CONFIG?.supabaseUrl && window.WEDDING_CONFIG?.anonKey) {
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
  if (!reservations[0]?.family_name) return anonymousUploader(config);

  return { userId: user.id, familyName: reservations[0].family_name, accessToken: session.access_token };
}

function anonymousUploader(config) {
  return { userId: null, familyName: null, accessToken: config.anonKey };
}

async function uploadFile(file, config, uploader) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const dateFolder = new Date().toISOString().slice(0, 10);
  const ownerFolder = uploader.userId || "anonymous";
  const objectName = `guest/${ownerFolder}/${dateFolder}/${createObjectId()}.${extension}`;
  const objectPath = objectName.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${config.bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${uploader.accessToken}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || details.error || `Upload failed (${response.status}).`);
  }
}

function createObjectId() {
  const webCrypto = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (typeof webCrypto?.getRandomValues === "function") {
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
