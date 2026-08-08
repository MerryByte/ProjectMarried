const loginSection = document.querySelector("#loginSection");
const gallerySection = document.querySelector("#gallerySection");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const galleryStatus = document.querySelector("#galleryStatus");
const photoGrid = document.querySelector("#photoGrid");
const photoCount = document.querySelector("#photoCount");
const logoutButton = document.querySelector("#logoutButton");
const adminTabs = document.querySelector("#adminTabs");
const photosTab = document.querySelector("#photosTab");
const reservationsTab = document.querySelector("#reservationsTab");
const reservationsSection = document.querySelector("#reservationsSection");
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
const ADMIN_SESSION_KEY = "weddingGallerySession";

loginForm.addEventListener("submit", signIn);
logoutButton.addEventListener("click", signOut);
photosTab.addEventListener("click", () => switchView("photos"));
reservationsTab.addEventListener("click", () => switchView("reservations"));
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
    const dateFolders = await listFolder(config, token, "guest");
    const folders = dateFolders.filter(item => !item.id);
    const fileGroups = await Promise.all(folders.map(folder => listFolder(config, token, `guest/${folder.name}`)));
    const photos = fileGroups.flatMap((files, index) => files
      .filter(file => file.id && file.metadata?.mimetype?.startsWith("image/"))
      .map(file => ({ ...file, path: `guest/${folders[index].name}/${file.name}` })))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    photoGrid.replaceChildren();
    galleryPhotos = [];
    photoCount.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
    galleryStatus.textContent = photos.length ? "" : "No photos have been uploaded yet.";

    for (const photo of photos) await addPhoto(config, token, photo);
  } catch (error) {
    galleryStatus.textContent = error.message;
    if (/401|JWT|authorized|permission/i.test(error.message)) signOut();
  }
}

async function switchView(view) {
  const showPhotos = view === "photos";
  photosTab.classList.toggle("active", showPhotos);
  reservationsTab.classList.toggle("active", !showPhotos);
  gallerySection.hidden = !showPhotos;
  reservationsSection.hidden = showPhotos;
  if (!showPhotos) await loadReservations();
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

async function addPhoto(config, token, photo) {
  const path = photo.path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/authenticated/${config.bucket}/${path}`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Unable to load a photo (${response.status}).`);

  const objectUrl = URL.createObjectURL(await response.blob());
  objectUrls.push(objectUrl);
  galleryPhotos.push({ objectUrl, name: photo.name });
  const photoIndex = galleryPhotos.length - 1;
  const card = document.createElement("article");
  card.className = "photo";
  const viewButton = document.createElement("button");
  viewButton.className = "photo-view";
  viewButton.type = "button";
  viewButton.setAttribute("aria-label", "View photo full size");
  const image = document.createElement("img");
  image.src = objectUrl;
  image.alt = "Guest wedding memory";
  image.loading = "lazy";
  viewButton.addEventListener("click", () => openLightbox(photoIndex));
  const download = document.createElement("a");
  download.href = objectUrl;
  download.download = photo.name;
  download.textContent = "Download";
  viewButton.append(image);
  card.append(viewButton, download);
  photoGrid.append(card);
}

function openLightbox(index) {
  showLightboxPhoto(index);
  photoLightbox.showModal();
}

function showLightboxPhoto(index) {
  if (!galleryPhotos.length) return;
  activePhotoIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[activePhotoIndex];
  lightboxImage.src = photo.objectUrl;
  lightboxCaption.textContent = `${activePhotoIndex + 1} of ${galleryPhotos.length}`;
  const hasMultiplePhotos = galleryPhotos.length > 1;
  lightboxPrevious.hidden = !hasMultiplePhotos;
  lightboxNext.hidden = !hasMultiplePhotos;
}

function closeLightbox() {
  photoLightbox.close();
}

function signOut() {
  if (photoLightbox.open) closeLightbox();
  localStorage.removeItem(ADMIN_SESSION_KEY);
  activeSession = undefined;
  activeToken = undefined;
  objectUrls.forEach(URL.revokeObjectURL);
  objectUrls = [];
  galleryPhotos = [];
  photoGrid.replaceChildren();
  gallerySection.hidden = true;
  reservationsSection.hidden = true;
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
