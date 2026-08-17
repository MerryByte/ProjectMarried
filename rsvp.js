const rsvpSection = document.querySelector("#rsvpSection");
const rsvpForm = document.querySelector("#rsvpForm");
const rsvpStatus = document.querySelector("#rsvpStatus");
const logoutButton = document.querySelector("#logoutButton");
const accountTabs = document.querySelector("#accountTabs");
const rsvpTab = document.querySelector("#rsvpTab");
const photosTab = document.querySelector("#photosTab");
const myPhotosSection = document.querySelector("#myPhotosSection");
const myPhotosStatus = document.querySelector("#myPhotosStatus");
const myPhotosGrid = document.querySelector("#myPhotosGrid");
const RSVP_SESSION_KEY = "weddingRsvpSession";
const ACCOUNT_SECTION_KEY = "weddingAccountSection";
let session = null;
let config = null;
let photosLoaded = false;
let photoObjectUrls = [];

rsvpForm.addEventListener("submit", saveRsvp);
logoutButton.addEventListener("click", logout);
rsvpTab.addEventListener("click", () => switchSection("rsvp"));
photosTab.addEventListener("click", () => switchSection("photos"));
window.addEventListener("pagehide", revokePhotoUrls);
restoreSession();

function saveSession(value) {
  session = value;
  localStorage.setItem(RSVP_SESSION_KEY, JSON.stringify(value));
}

async function restoreSession() {
  let stored = null;
  try {
    stored = localStorage.getItem(RSVP_SESSION_KEY);
  } catch {
    window.location.href = location.hash === "#photos" ? "login.html?photos=1" : "login.html?rsvp=1";
    return;
  }
  if (!stored) {
    window.location.replace(location.hash === "#photos" ? "login.html?photos=1" : "login.html?rsvp=1");
    return;
  }
  try {
    config = await getConfig();
    session = JSON.parse(stored);
    if (!session.refresh_token) throw new Error("Saved session is incomplete.");
    if (!session.expires_at || session.expires_at * 1000 <= Date.now() + 60000) await refreshSession();
    await openAccount();
  } catch {
    localStorage.removeItem(RSVP_SESSION_KEY);
    session = null;
    window.location.replace("login.html?expired=1&rsvp=1");
  }
}

async function refreshSession() {
  const response = await api("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: { apikey: config.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const refreshed = await response.json();
  if (!response.ok) throw new Error(refreshed.error_description || refreshed.message || "Session expired.");
  saveSession(refreshed);
}

async function openAccount() {
  const userResponse = await api("/auth/v1/user", { headers: authHeaders() });
  if (!userResponse.ok) throw new Error("Unable to restore your account session.");
  session.user = await userResponse.json();
  localStorage.setItem(RSVP_SESSION_KEY, JSON.stringify(session));
  accountTabs.hidden = false;
  rsvpSection.hidden = false;
  logoutButton.hidden = false;
  let preferredSection = "rsvp";
  try { preferredSection = localStorage.getItem(ACCOUNT_SECTION_KEY) || preferredSection; } catch {}
  if (location.hash === "#photos" || preferredSection === "photos") await switchSection("photos");

  const response = await api(`/rest/v1/rsvps?select=*&user_id=eq.${encodeURIComponent(session.user.id)}`, { headers: authHeaders() });
  if (!response.ok) return;
  const rows = await response.json();
  if (!rows[0]) return;
  const row = rows[0];
  document.querySelector("#familyName").value = row.family_name;
  document.querySelector(`input[name=attending][value="${row.attending}"]`).checked = true;
  document.querySelector("#adultCount").value = row.adult_count;
  document.querySelector("#childCount").value = row.child_count;
  document.querySelector("#notes").value = row.notes || "";
}

async function switchSection(section) {
  const showPhotos = section === "photos";
  try { localStorage.setItem(ACCOUNT_SECTION_KEY, showPhotos ? "photos" : "rsvp"); } catch {}
  rsvpTab.classList.toggle("active", !showPhotos);
  photosTab.classList.toggle("active", showPhotos);
  rsvpSection.hidden = showPhotos;
  myPhotosSection.hidden = !showPhotos;
  if (showPhotos && !photosLoaded) await loadMyPhotos();
}

async function loadMyPhotos() {
  photosLoaded = true;
  myPhotosStatus.textContent = "Loading your memories…";
  try {
    const root = `guest/${session.user.id}`;
    const dateFolders = (await listStorageFolder(root)).filter(item => !item.id);
    const files = [];
    for (const folder of dateFolders) {
      const items = await listStorageFolder(`${root}/${folder.name}`);
      files.push(...items.filter(item => item.id && /^(image|video)\//.test(item.metadata?.mimetype || "")).map(item => ({ ...item, path: `${root}/${folder.name}/${item.name}` })));
    }
    files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    myPhotosGrid.replaceChildren();
    if (!files.length) {
      myPhotosStatus.textContent = "You have not uploaded any signed-in photos or videos yet.";
      return;
    }
    myPhotosStatus.textContent = `${files.length} ${files.length === 1 ? "memory" : "memories"}`;
    for (const file of files) addMyPhoto(file);
  } catch (error) {
    photosLoaded = false;
    myPhotosStatus.textContent = error.message;
  }
}

async function listStorageFolder(prefix) {
  const response = await api(`/storage/v1/object/list/${config.bucket}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error || "Unable to load your memories.");
  return result;
}

async function addMyPhoto(file) {
  const card = document.createElement("article");
  card.className = "my-photo";
  const isVideo = file.metadata?.mimetype?.startsWith("video/");
  if (isVideo) card.classList.add("video-card");
  const media = document.createElement(isVideo ? "video" : "img");
  if (isVideo) {
    media.controls = true;
    media.preload = "auto";
    media.playsInline = true;
  } else {
    media.alt = "Your wedding photo";
    media.loading = "lazy";
    media.decoding = "async";
  }
  const download = document.createElement("a");
  download.textContent = "Download";
  download.href = "#";
  download.addEventListener("click", event => downloadMyPhoto(event, file));
  card.append(media, download);
  myPhotosGrid.append(card);

  const path = file.path.split("/").map(encodeURIComponent).join("/");
  const headers = authHeaders();
  let response = isVideo
    ? await api(`/storage/v1/object/authenticated/${config.bucket}/${path}`, { headers })
    : await api(`/storage/v1/render/image/authenticated/${config.bucket}/${path}?width=640&height=640&resize=cover&quality=72`, { headers });
  if (!response.ok) response = await api(`/storage/v1/object/authenticated/${config.bucket}/${path}`, { headers });
  if (!response.ok) {
    if (!isVideo) media.alt = "Media unavailable";
    return;
  }
  const responseBlob = await response.blob();
  const mediaBlob = isVideo && file.metadata?.mimetype
    ? new Blob([await responseBlob.arrayBuffer()], { type: file.metadata.mimetype })
    : responseBlob;
  const url = URL.createObjectURL(mediaBlob);
  photoObjectUrls.push(url);
  if (isVideo) {
    const createPoster = () => createVideoPoster(media);
    media.addEventListener("loadeddata", createPoster, { once: true });
    media.addEventListener("seeked", createPoster, { once: true });
    media.addEventListener("loadedmetadata", () => {
      try {
        if (Number.isFinite(media.duration) && media.duration > .2) {
          media.currentTime = Math.min(1, media.duration / 10);
        }
      } catch {}
    }, { once: true });
  }
  media.src = url;
}

function createVideoPoster(video) {
  if (!video.videoWidth || !video.videoHeight) return;
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    video.poster = canvas.toDataURL("image/jpeg", .78);
  } catch {}
}

async function downloadMyPhoto(event, file) {
  event.preventDefault();
  const link = event.currentTarget;
  const originalText = link.textContent;
  link.textContent = "Preparing…";
  const path = file.path.split("/").map(encodeURIComponent).join("/");
  const response = await api(`/storage/v1/object/authenticated/${config.bucket}/${path}`, { headers: authHeaders() });
  if (!response.ok) {
    link.textContent = "Try again";
    return;
  }
  const url = URL.createObjectURL(await response.blob());
  const download = document.createElement("a");
  download.href = url;
  download.download = file.name;
  download.click();
  URL.revokeObjectURL(url);
  link.textContent = originalText;
}

async function saveRsvp(event) {
  event.preventDefault();
  const button = rsvpForm.querySelector("button[type=submit]");
  const attending = document.querySelector("input[name=attending]:checked").value === "true";
  const adults = Number(document.querySelector("#adultCount").value);
  const children = Number(document.querySelector("#childCount").value);
  if (attending && adults + children < 1) {
    rsvpStatus.textContent = "Enter at least one guest.";
    return;
  }
  button.disabled = true;
  rsvpStatus.className = "status";
  rsvpStatus.textContent = "Saving…";
  const response = await api("/rest/v1/rsvps?on_conflict=user_id", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ user_id: session.user.id, family_name: document.querySelector("#familyName").value.trim(), attending, adult_count: attending ? adults : 0, child_count: attending ? children : 0, notes: document.querySelector("#notes").value.trim() || null }),
  });
  button.disabled = false;
  if (!response.ok) {
    const error = await response.json();
    rsvpStatus.textContent = error.message || "Unable to save reservation.";
    return;
  }
  rsvpStatus.className = "status success";
  rsvpStatus.textContent = "Your reservation has been saved. Thank you!";
}

function authHeaders() {
  return { apikey: config.anonKey, Authorization: `Bearer ${session.access_token}` };
}

function api(path, options = {}) {
  return fetch(`${config.supabaseUrl}${path}`, options);
}

function revokePhotoUrls() {
  photoObjectUrls.forEach(URL.revokeObjectURL);
  photoObjectUrls = [];
}

function logout() {
  revokePhotoUrls();
  localStorage.removeItem(RSVP_SESSION_KEY);
  session = null;
  window.location.replace("login.html");
}

async function getConfig() {
  if (window.WEDDING_CONFIG?.supabaseUrl && window.WEDDING_CONFIG?.anonKey) return window.WEDDING_CONFIG;
  const response = await fetch("/api/upload-config", { cache: "no-store" });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "RSVP is not configured.");
  return value;
}
