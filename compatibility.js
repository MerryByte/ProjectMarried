(function () {
  var gate = document.getElementById("uploadGate");
  var lock = document.getElementById("uploadLock");
  var cameraInput = document.getElementById("cameraInput");
  var uploadInput = document.getElementById("uploadInput");
  var cameraButton = document.getElementById("cameraButton");
  var floatingButton = document.getElementById("floatingCameraButton");
  var uploadButton = document.getElementById("uploadButton");

  function openFallback(input) {
    return function () {
      if (!window.weddingCameraAppReady && input && !gate.classList.contains("locked")) input.click();
    };
  }

  if (cameraButton) cameraButton.addEventListener("click", openFallback(cameraInput));
  if (floatingButton) floatingButton.addEventListener("click", openFallback(cameraInput));
  if (uploadButton) uploadButton.addEventListener("click", openFallback(uploadInput));

  var request = new XMLHttpRequest();
  request.open("GET", "/api/site-settings?select=upload_unlock_at&_=" + new Date().getTime(), true);
  request.onreadystatechange = function () {
    if (request.readyState !== 4 || request.status < 200 || request.status >= 300) return;
    try {
      var rows = JSON.parse(request.responseText);
      var unlockAt = rows[0] && Date.parse(rows[0].upload_unlock_at);
      if (!isNaN(unlockAt) && new Date().getTime() >= unlockAt) {
        gate.className = gate.className.replace(/\s*locked\b/g, "");
        lock.style.display = "none";
        if (floatingButton) floatingButton.setAttribute("aria-label", "Open camera");
      }
    } catch (error) {}
  };
  request.send();
})();
