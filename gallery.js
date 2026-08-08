const loginSection = document.querySelector("#loginSection");
const gallerySection = document.querySelector("#gallerySection");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const galleryStatus = document.querySelector("#galleryStatus");
const photoGrid = document.querySelector("#photoGrid");
const photoCount = document.querySelector("#photoCount");
const logoutButton = document.querySelector("#logoutButton");
let objectUrls = [];

loginForm.addEventListener("submit", signIn);
logoutButton.addEventListener("click", signOut);

async function signIn(event) {
  event.preventDefault();
  const submitButton = loginForm.querySelector("button");
  submitButton.disabled = true;
  loginStatus.textContent = "Signing in…";

  try {
    const config = await getConfig();
    const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginForm.email.value.trim(),
        password: loginForm.password.value,
      }),
    });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error_description || session.msg || "Sign-in failed.");

    sessionStorage.setItem("weddingGalleryToken", session.access_token);
    loginForm.password.value = "";
    await showGallery(config, session.access_token);
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

async function showGallery(config, token) {
  loginSection.hidden = true;
  gallerySection.hidden = false;
  logoutButton.hidden = false;
  galleryStatus.textContent = "Loading photos…";

  try {
    const dateFolders = await listFolder(config, token, "guest");
    const folders = dateFolders.filter(item => !item.id);
    const fileGroups = await Promise.all(folders.map(folder => listFolder(config, token, `guest/${folder.name}`)));
    const photos = fileGroups.flatMap((files, index) => files
      .filter(file => file.id && file.metadata?.mimetype?.startsWith("image/"))
      .map(file => ({ ...file, path: `guest/${folders[index].name}/${file.name}` })))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    photoGrid.replaceChildren();
    photoCount.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
    galleryStatus.textContent = photos.length ? "" : "No photos have been uploaded yet.";

    for (const photo of photos) await addPhoto(config, token, photo);
  } catch (error) {
    galleryStatus.textContent = error.message;
    if (/401|JWT|authorized|permission/i.test(error.message)) signOut();
  }
}

async function listFolder(config, token, prefix) {
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/list/${config.bucket}`, {
    method: "POST",
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error || `Unable to list photos (${response.status}).`);
  return result;
}

async function addPhoto(config, token, photo) {
  const path = photo.path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/authenticated/${config.bucket}/${path}`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Unable to load a photo (${response.status}).`);

  const objectUrl = URL.createObjectURL(await response.blob());
  objectUrls.push(objectUrl);
  const card = document.createElement("article");
  card.className = "photo";
  const image = document.createElement("img");
  image.src = objectUrl;
  image.alt = "Guest wedding memory";
  image.loading = "lazy";
  const download = document.createElement("a");
  download.href = objectUrl;
  download.download = photo.name;
  download.textContent = "Download";
  card.append(image, download);
  photoGrid.append(card);
}

function signOut() {
  sessionStorage.removeItem("weddingGalleryToken");
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls = [];
  photoGrid.replaceChildren();
  gallerySection.hidden = true;
  logoutButton.hidden = true;
  loginSection.hidden = false;
  loginStatus.textContent = "";
}

async function getConfig() {
  if (window.WEDDING_CONFIG?.supabaseUrl && window.WEDDING_CONFIG?.anonKey) return window.WEDDING_CONFIG;
  const response = await fetch("/api/upload-config", { cache: "no-store" });
  const config = await response.json();
  if (!response.ok) throw new Error(config.error || "Gallery access is not configured.");
  return config;
}
