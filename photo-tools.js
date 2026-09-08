window.downloadPhotosZip = async function (files, fetchPhoto, button, status) {
  if (button.disabled || !files.length) return;
  button.disabled = true;
  const parts = [], directory = [];
  let offset = 0;
  const encoder = new TextEncoder();
  const table = Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    return value >>> 0;
  });
  try {
    if (files.length > 65535) throw new Error("Too many photos for one ZIP file.");
    for (let index = 0; index < files.length; index++) {
      status.textContent = `Preparing ZIP: ${index + 1} of ${files.length} photos…`;
      const file = files[index];
      const data = new Uint8Array(await (await fetchPhoto(file)).arrayBuffer());
      const name = encoder.encode(`${index + 1}-${file.name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")}`);
      if (offset + data.length + name.length + 30 > 0xffffffff) throw new Error("These photos exceed the 4 GB ZIP limit. Download photos individually.");
      let crc = 0xffffffff;
      for (const byte of data) crc = (crc >>> 8) ^ table[(crc ^ byte) & 255];
      crc = (crc ^ 0xffffffff) >>> 0;
      const header = new Uint8Array(30 + name.length);
      const view = new DataView(header.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x800, true);
      view.setUint16(12, 33, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, data.length, true);
      view.setUint32(22, data.length, true);
      view.setUint16(26, name.length, true);
      header.set(name, 30);
      const central = new Uint8Array(46 + name.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      central.set(header.subarray(4, 30), 6);
      centralView.setUint32(42, offset, true);
      central.set(name, 46);
      parts.push(header, data);
      directory.push(central);
      offset += header.length + data.length;
    }
    const directorySize = directory.reduce((sum, entry) => sum + entry.length, 0);
    if (offset + directorySize > 0xffffffff) throw new Error("These photos exceed the 4 GB ZIP limit. Download photos individually.");
    const end = new Uint8Array(22);
    const view = new DataView(end.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(8, files.length, true);
    view.setUint16(10, files.length, true);
    view.setUint32(12, directorySize, true);
    view.setUint32(16, offset, true);
    const url = URL.createObjectURL(new Blob([...parts, ...directory, end], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "wedding-photos.zip";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = `ZIP ready: ${files.length} photos. Your download has started.`;
  } catch (error) {
    status.textContent = `ZIP download failed: ${error.message}`;
  } finally {
    button.disabled = false;
  }
};

window.viewWeddingPhoto = async function (file, fetchPhoto) {
  const dialog = document.createElement("dialog");
  dialog.className = "guest-lightbox";
  dialog.setAttribute("aria-label", "Photo viewer");
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.addEventListener("click", () => dialog.close());
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = "Loading full photo…";
  const image = document.createElement("img");
  image.alt = "Your wedding photo enlarged";
  let url;
  dialog.append(close, status, image);
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    if (url) URL.revokeObjectURL(url);
    dialog.remove();
  }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
  try {
    const blob = await fetchPhoto(file);
    if (!dialog.open) return;
    url = URL.createObjectURL(blob);
    image.addEventListener("load", () => { status.hidden = true; }, { once: true });
    image.addEventListener("error", () => { status.textContent = "This image cannot be displayed. Please use Download."; }, { once: true });
    image.src = url;
  } catch (error) {
    status.textContent = error.message;
  }
};
