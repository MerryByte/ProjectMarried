const loginSection = document.querySelector("#loginSection");
const gallerySection = document.querySelector("#gallerySection");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const galleryStatus = document.querySelector("#galleryStatus");
const photoGrid = document.querySelector("#photoGrid");
const photoCount = document.querySelector("#photoCount");
const loadMoreButton = document.querySelector("#loadMoreButton");
const logoutButton = document.querySelector("#logoutButton");
const adminTabs = document.querySelector("#adminTabs");
const photosTab = document.querySelector("#photosTab");
const reservationsTab = document.querySelector("#reservationsTab");
const settingsTab = document.querySelector("#settingsTab");
const reservationsSection = document.querySelector("#reservationsSection");
const settingsSection = document.querySelector("#settingsSection");
const settingsForm = document.querySelector("#settingsForm");
const uploadUnlockAt = document.querySelector("#uploadUnlockAt");
const scheduleInputs = ["ceremonyTime", "ceremonyLocation", "celebrationTime", "celebrationLocation"];
const settingsStatus = document.querySelector("#settingsStatus");
const reservationStatus = document.querySelector("#reservationStatus");
const reservationRows = document.querySelector("#reservationRows");
const reservationTotals = document.querySelector("#reservationTotals");
const photoLightbox = document.querySelector("#photoLightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const lightboxClose = document.querySelector("#lightboxClose");
const lightboxPrevious = document.querySelector("#lightboxPrevious");
const lightboxNext = document.querySelector("#lightboxNext");
let objectUrls = [];
let galleryPhotos = [];
let activePhotoIndex = 0;
let activeConfig;
let activeToken;
let activeSession;
let thumbnailObserver;
let pendingGalleryPhotos = [];
let renderedPhotoCount = 0;
const GALLERY_PAGE_SIZE = 24;
const ADMIN_SESSION_KEY = "weddingGallerySession";

loginForm.addEventListener("submit", signIn);
logoutButton.addEventListener("click", signOut);
photosTab.addEventListener("click", () => switchView("photos"));
reservationsTab.addEventListener("click", () => switchView("reservations"));
settingsTab.addEventListener("click", () => switchView("settings"));
settingsForm.addEventListener("submit", saveUploadSettings);
loadMoreButton.addEventListener("click", renderNextPhotos);
lightboxClose.addEventListener("click", closeLightbox);
lightboxPrevious.addEventListener("click", () => showLightboxPhoto(activePhotoIndex - 1));
lightboxNext.addEventListener("click", () => showLightboxPhoto(activePhotoIndex + 1));
photoLightbox.addEventListener("click", event => {
  if (event.target === photoLightbox) closeLightbox();
});
photoLightbox.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") showLightboxPhoto(activePhotoIndex - 1);
  if (event.key === "ArrowRight") showLightboxPhoto(activePhotoIndex + 1);
});

restoreAdminSession();

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

    saveAdminSession(session);
    loginForm.password.value = "";
    await showGallery(config, session.access_token);
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

async function showGallery(config, token) {
  activeConfig = config;
  activeToken = token;
  loginSection.hidden = true;
  gallerySection.hidden = false;
  adminTabs.hidden = false;
  logoutButton.hidden = false;
  galleryStatus.textContent = "Loading photos…";

  try {
    const [photos, familyNames] = await Promise.all([
      discoverPhotos(config, token),
      loadFamilyNames(config, token),
    ]);

    photoGrid.replaceChildren();
    galleryPhotos = [];
    photoCount.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
    galleryStatus.textContent = photos.length ? "" : "No photos have been uploaded yet.";

    thumbnailObserver?.disconnect();
    thumbnailObserver = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => {
        thumbnailObserver.unobserve(entry.target);
        loadPhotoPreview(Number(entry.target.dataset.photoIndex));
      });
    }, { rootMargin: "500px" });

    pendingGalleryPhotos = photos.map(photo => ({ photo, familyName: photo.uploaderId ? familyNames.get(photo.uploaderId) || "Unknown reservation" : "Unknown guest" }));
    renderedPhotoCount = 0;
    renderNextPhotos();
  } catch (error) {
    galleryStatus.textContent = error.message;
    if (/401|JWT|authorized|permission/i.test(error.message)) signOut();
  }
}

async function loadFamilyNames(config, token) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rsvps?select=user_id,family_name`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
  });
  const rows = await response.json();
  if (!response.ok) throw new Error(rows.message || "Unable to match photos to reservations.");
  return new Map(rows.map(row => [row.user_id, row.family_name]));
}

async function discoverPhotos(config, token) {
  const topFolders = (await listFolder(config, token, "guest")).filter(item => !item.id);
  const photos = [];

  for (const topFolder of topFolders) {
    if (isUuid(topFolder.name)) {
      const dateFolders = (await listFolder(config, token, `guest/${topFolder.name}`)).filter(item => !item.id);
      for (const dateFolder of dateFolders) {
        const files = await listFolder(config, token, `guest/${topFolder.name}/${dateFolder.name}`);
        photos.push(...files
          .filter(isImageFile)
          .map(file => ({ ...file, uploaderId: topFolder.name, path: `guest/${topFolder.name}/${dateFolder.name}/${file.name}` })));
      }
    } else if (topFolder.name === "anonymous") {
      const dateFolders = (await listFolder(config, token, "guest/anonymous")).filter(item => !item.id);
      for (const dateFolder of dateFolders) {
        const files = await listFolder(config, token, `guest/anonymous/${dateFolder.name}`);
        photos.push(...files
          .filter(isImageFile)
          .map(file => ({ ...file, uploaderId: null, path: `guest/anonymous/${dateFolder.name}/${file.name}` })));
      }
    } else {
      const files = await listFolder(config, token, `guest/${topFolder.name}`);
      photos.push(...files
        .filter(isImageFile)
        .map(file => ({ ...file, uploaderId: null, path: `guest/${topFolder.name}/${file.name}` })));
    }
  }

  return photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isImageFile(file) {
  return file.id && file.metadata?.mimetype?.startsWith("image/");
}

async function switchView(view) {
  const showPhotos = view === "photos";
  const showReservations = view === "reservations";
  photosTab.classList.toggle("active", showPhotos);
  reservationsTab.classList.toggle("active", showReservations);
  settingsTab.classList.toggle("active", view === "settings");
  gallerySection.hidden = !showPhotos;
  reservationsSection.hidden = !showReservations;
  settingsSection.hidden = view !== "settings";
  if (showReservations) await loadReservations();
  if (view === "settings") await loadUploadSettings();
}

function renderNextPhotos() {
  const nextPhotos = pendingGalleryPhotos.slice(renderedPhotoCount, renderedPhotoCount + GALLERY_PAGE_SIZE);
  nextPhotos.forEach(({ photo, familyName }) => addPhoto(activeConfig, activeToken, photo, familyName));
  renderedPhotoCount += nextPhotos.length;
  loadMoreButton.hidden = renderedPhotoCount >= pendingGalleryPhotos.length;
}

async function loadUploadSettings() {
  settingsStatus.textContent = "Loading settings…";
  const fields = "upload_unlock_at,ceremony_time,ceremony_location,celebration_time,celebration_location";
  const response = await fetch(`${activeConfig.supabaseUrl}/rest/v1/site_settings?select=${fields}&id=eq.wedding&limit=1`, {
    headers: { apikey: activeConfig.anonKey, Authorization: `Bearer ${activeToken}` },
    cache: "no-store",
  });
  const rows = await response.json();
  if (!response.ok || !rows[0]) {
    settingsStatus.textContent = rows.message || "Site settings have not been installed yet.";
    return;
  }
  const date = new Date(rows[0].upload_unlock_at);
  uploadUnlockAt.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  scheduleInputs.forEach(id => {
    const key = id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    document.querySelector(`#${id}`).value = rows[0][key] || "";
  });
  settingsStatus.textContent = "";
}

async function saveUploadSettings(event) {
  event.preventDefault();
  const button = settingsForm.querySelector("button");
  const date = new Date(uploadUnlockAt.value);
  if (!Number.isFinite(date.getTime())) return;
  button.disabled = true;
  settingsStatus.textContent = "Saving…";
  const response = await fetch(`${activeConfig.supabaseUrl}/rest/v1/site_settings?id=eq.wedding`, {
    method: "PATCH",
    headers: { apikey: activeConfig.anonKey, Authorization: `Bearer ${activeToken}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      upload_unlock_at: date.toISOString(),
      ceremony_time: document.querySelector("#ceremonyTime").value || null,
      ceremony_location: document.querySelector("#ceremonyLocation").value.trim() || null,
      celebration_time: document.querySelector("#celebrationTime").value || null,
      celebration_location: document.querySelector("#celebrationLocation").value.trim() || null,
      updated_at: new Date().toISOString(),
    }),
  });
  const result = await response.json();
  button.disabled = false;
  settingsStatus.textContent = response.ok && result.length ? "Site settings saved." : result.message || "Unable to save the settings.";
  settingsStatus.className = `status${response.ok && result.length ? " success" : ""}`;
}

async function loadReservations() {
  reservationStatus.textContent = "Loading reservations…";
  const response = await fetch(`${activeConfig.supabaseUrl}/rest/v1/rsvps?select=family_name,contact_email,attending,adult_count,child_count,notes,created_at&order=created_at.desc`, {
    headers: { apikey: activeConfig.anonKey, Authorization: `Bearer ${activeToken}` },
  });
  const rows = await response.json();
  if (!response.ok) { reservationStatus.textContent = rows.message || "Unable to load reservations."; return; }

  const attending = rows.filter(row => row.attending);
  const adults = attending.reduce((sum, row) => sum + row.adult_count, 0);
  const children = attending.reduce((sum, row) => sum + row.child_count, 0);
  const cards = [[attending.length,"Families coming"],[adults,"Adults"],[children,"Children"],[adults + children,"Total guests"]];
  reservationTotals.replaceChildren(...cards.map(([value,label]) => {
    const card=document.createElement("div"); card.className="total";
    const strong=document.createElement("strong"); strong.textContent=value;
    const span=document.createElement("span"); span.textContent=label;
    card.append(strong,span); return card;
  }));
  reservationRows.replaceChildren(...rows.map(row => {
    const tr=document.createElement("tr");
    const values=[row.family_name,row.contact_email,row.attending?"Attending":"Declined",row.adult_count,row.child_count,row.adult_count+row.child_count,row.notes||"—",new Date(row.created_at).toLocaleDateString()];
    values.forEach((value,index) => { const td=document.createElement("td"); td.textContent=value; if(index===2)td.className=row.attending?"yes":"no"; if(index===6)td.className="notes"; tr.append(td); });
    return tr;
  }));
  reservationStatus.textContent = rows.length ? "" : "No reservations have been submitted yet.";
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

function addPhoto(config, token, photo, familyName) {
  const card = document.createElement("article");
  card.className = "photo";
  const viewButton = document.createElement("button");
  viewButton.className = "photo-view";
  viewButton.type = "button";
  viewButton.setAttribute("aria-label", "View photo full size");
  const image = document.createElement("img");
  image.alt = "Guest wedding memory";
  image.loading = "lazy";
  image.decoding = "async";
  const download = document.createElement("a");
  download.href = "#";
  download.textContent = "Download";
  const photoIndex = galleryPhotos.push({ config, token, photo, familyName, image, thumbnailUrl: null, fullUrl: null, previewPromise: null, fullPromise: null }) - 1;
  image.dataset.photoIndex = photoIndex;
  viewButton.addEventListener("click", () => openLightbox(photoIndex));
  download.addEventListener("click", event => downloadPhoto(event, photoIndex));
  const uploader = document.createElement("p");
  uploader.className = "photo-uploader";
  uploader.textContent = familyName;
  viewButton.append(image);
  card.append(viewButton, download, uploader);
  photoGrid.append(card);
  thumbnailObserver.observe(image);
}

async function loadPhotoPreview(index) {
  const entry = galleryPhotos[index];
  if (!entry || entry.thumbnailUrl) return entry?.thumbnailUrl;
  if (entry.previewPromise) return entry.previewPromise;

  entry.previewPromise = (async () => {
    const path = entry.photo.path.split("/").map(encodeURIComponent).join("/");
    const headers = { apikey: entry.config.anonKey, Authorization: `Bearer ${entry.token}` };
    let response = await fetch(`${entry.config.supabaseUrl}/storage/v1/render/image/authenticated/${entry.config.bucket}/${path}?width=640&height=640&resize=cover&quality=70`, { headers });
    let isFullSize = false;

    if (!response.ok) {
      response = await fetch(`${entry.config.supabaseUrl}/storage/v1/object/authenticated/${entry.config.bucket}/${path}`, { headers });
      isFullSize = true;
    }
    if (!response.ok) throw new Error(`Unable to load a photo (${response.status}).`);

    const objectUrl = URL.createObjectURL(await response.blob());
    objectUrls.push(objectUrl);
    entry.thumbnailUrl = objectUrl;
    if (isFullSize) entry.fullUrl = objectUrl;
    entry.image.addEventListener("load", () => entry.image.classList.add("loaded"), { once: true });
    entry.image.src = objectUrl;
    return objectUrl;
  })().catch(error => {
    entry.image.alt = "Photo could not be loaded";
    console.error(error);
  });

  return entry.previewPromise;
}

async function loadFullPhoto(index) {
  const entry = galleryPhotos[index];
  if (!entry || entry.fullUrl) return entry?.fullUrl;
  if (entry.fullPromise) return entry.fullPromise;

  entry.fullPromise = (async () => {
    const path = entry.photo.path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${entry.config.supabaseUrl}/storage/v1/object/authenticated/${entry.config.bucket}/${path}`, {
      headers: { apikey: entry.config.anonKey, Authorization: `Bearer ${entry.token}` },
    });
    if (!response.ok) throw new Error(`Unable to load the full photo (${response.status}).`);
    entry.fullUrl = URL.createObjectURL(await response.blob());
    objectUrls.push(entry.fullUrl);
    return entry.fullUrl;
  })();

  return entry.fullPromise;
}

async function downloadPhoto(event, index) {
  event.preventDefault();
  try {
    const url = await loadFullPhoto(index);
    const link = document.createElement("a");
    link.href = url;
    link.download = galleryPhotos[index].photo.name;
    link.click();
  } catch (error) {
    galleryStatus.textContent = error.message;
  }
}

async function openLightbox(index) {
  const loaded = await showLightboxPhoto(index);
  if (loaded) photoLightbox.showModal();
}

async function showLightboxPhoto(index) {
  if (!galleryPhotos.length) return;
  activePhotoIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[activePhotoIndex];
  const requestedIndex = activePhotoIndex;
  lightboxCaption.textContent = `Loading full photo… · ${requestedIndex + 1} of ${galleryPhotos.length}`;
  let fullUrl;
  try {
    fullUrl = await loadFullPhoto(requestedIndex);
  } catch (error) {
    lightboxCaption.textContent = error.message;
    return false;
  }
  if (activePhotoIndex !== requestedIndex) return;
  lightboxImage.src = fullUrl;
  lightboxCaption.textContent = `${photo.familyName} · ${activePhotoIndex + 1} of ${galleryPhotos.length}`;
  const hasMultiplePhotos = galleryPhotos.length > 1;
  lightboxPrevious.hidden = !hasMultiplePhotos;
  lightboxNext.hidden = !hasMultiplePhotos;
  return true;
}

function closeLightbox() {
  photoLightbox.close();
}

function signOut() {
  if (photoLightbox.open) closeLightbox();
  localStorage.removeItem(ADMIN_SESSION_KEY);
  activeSession = undefined;
  activeToken = undefined;
  thumbnailObserver?.disconnect();
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls = [];
  galleryPhotos = [];
  pendingGalleryPhotos = [];
  renderedPhotoCount = 0;
  loadMoreButton.hidden = true;
  photoGrid.replaceChildren();
  gallerySection.hidden = true;
  reservationsSection.hidden = true;
  settingsSection.hidden = true;
  adminTabs.hidden = true;
  logoutButton.hidden = true;
  loginSection.hidden = false;
  loginStatus.textContent = "";
}

function saveAdminSession(session) {
  activeSession = session;
  activeToken = session.access_token;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

async function restoreAdminSession() {
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return;
  try {
    activeConfig = await getConfig();
    activeSession = JSON.parse(stored);
    if (!activeSession.refresh_token) throw new Error("Saved session is incomplete.");
    if (!activeSession.expires_at || activeSession.expires_at * 1000 <= Date.now() + 60000) {
      const response = await fetch(`${activeConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: activeConfig.anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: activeSession.refresh_token }),
      });
      const refreshed = await response.json();
      if (!response.ok) throw new Error(refreshed.error_description || refreshed.message || "Session expired.");
      saveAdminSession(refreshed);
    } else {
      activeToken = activeSession.access_token;
    }
    await showGallery(activeConfig, activeToken);
  } catch (error) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    activeSession = undefined;
    activeToken = undefined;
    loginStatus.textContent = "Your session expired. Please sign in again.";
  }
}

async function getConfig() {
  if (window.WEDDING_CONFIG?.supabaseUrl && window.WEDDING_CONFIG?.anonKey) return window.WEDDING_CONFIG;
  const response = await fetch("/api/upload-config", { cache: "no-store" });
  const config = await response.json();
  if (!response.ok) throw new Error(config.error || "Gallery access is not configured.");
  return config;
}
