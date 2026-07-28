const uploadInput = document.querySelector("#uploadInput");
const cameraInput = document.querySelector("#cameraInput");
const selection = document.querySelector("#selection");
const selectionCount = document.querySelector("#selectionCount");
const selectionNames = document.querySelector("#selectionNames");
let selectedFiles = [];

document.querySelector("#uploadButton").addEventListener("click", () => uploadInput.click());
document.querySelector("#cameraButton").addEventListener("click", () => cameraInput.click());
document.querySelector("#clearButton").addEventListener("click", clearFiles);

uploadInput.addEventListener("change", addFiles);
cameraInput.addEventListener("change", addFiles);

function addFiles(event) {
  selectedFiles.push(...event.target.files);
  event.target.value = "";
  showFiles();
}

function clearFiles() {
  selectedFiles = [];
  showFiles();
}

function showFiles() {
  selection.hidden = selectedFiles.length === 0;
  selectionCount.textContent = `${selectedFiles.length} ${selectedFiles.length === 1 ? "memory" : "memories"} ready`;
  selectionNames.textContent = selectedFiles.map(file => file.name).join(", ");
}
