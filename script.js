const uploadInput = document.querySelector("#uploadInput");
const cameraInput = document.querySelector("#cameraInput");
const selection = document.querySelector("#selection");
const selectionCount = document.querySelector("#selectionCount");
const selectionNames = document.querySelector("#selectionNames");
const submitButton = document.querySelector("#submitButton");
const uploadStatus = document.querySelector("#uploadStatus");
let selectedFiles = [];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

document.querySelector("#uploadButton").addEventListener("click", () => uploadInput.click());
document.querySelector("#cameraButton").addEventListener("click", () => cameraInput.click());
document.querySelector("#clearButton").addEventListener("click", clearFiles);
submitButton.addEventListener("click", uploadFiles);

uploadInput.addEventListener("change", addFiles);
cameraInput.addEventListener("change", addFiles);

function addFiles(event) {
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

async function uploadFiles() {
  if (!selectedFiles.length) return;

  submitButton.disabled = true;
  const filesToUpload = [...selectedFiles];

  try {
    const config = await getUploadConfig();

    for (let index = 0; index < filesToUpload.length; index += 1) {
      setStatus(`Uploading ${index + 1} of ${filesToUpload.length}…`);
      await uploadFile(filesToUpload[index], config);
    }

    selectedFiles = [];
    showFiles();
    setStatus(`${filesToUpload.length} ${filesToUpload.length === 1 ? "memory was" : "memories were"} uploaded. Thank you!`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "The upload failed. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
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

async function uploadFile(file, config) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const dateFolder = new Date().toISOString().slice(0, 10);
  const objectName = `guest/${dateFolder}/${crypto.randomUUID()}.${extension}`;
  const objectPath = objectName.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${config.bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
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

function setStatus(message, type = "") {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status${type ? ` ${type}` : ""}`;
}
