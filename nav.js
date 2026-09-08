document.querySelectorAll(".nav-toggle").forEach(button => {
  const menu = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  if (!menu) return;
  const loginLink = menu.querySelector('a[href="login.html"]');
  const logoutControl = menu.querySelector("#logoutButton");
  if (loginLink) {
    const updateAccountLink = () => {
      let signedIn = logoutControl ? !logoutControl.hidden : false;
      if (!logoutControl) {
        try {
          signedIn = ["weddingRsvpSession", "weddingGallerySession"].some(key => {
            const saved = JSON.parse(localStorage.getItem(key) || "null");
            return Boolean(saved?.access_token && (saved.refresh_token || saved.expires_at * 1000 > Date.now()));
          });
        } catch {}
      }
      loginLink.textContent = signedIn ? "Log out" : "Login";
      loginLink.dataset.signedIn = String(signedIn);
    };
    if (logoutControl) {
      logoutControl.style.display = "none";
      new MutationObserver(updateAccountLink).observe(logoutControl, { attributes: true, attributeFilter: ["hidden"] });
    }
    loginLink.addEventListener("click", event => {
      if (loginLink.dataset.signedIn !== "true") return;
      event.preventDefault();
      if (logoutControl) logoutControl.click();
      else {
        localStorage.removeItem("weddingRsvpSession");
        localStorage.removeItem("weddingGallerySession");
        window.location.replace("login.html");
      }
    });
    window.addEventListener("storage", updateAccountLink);
    window.addEventListener("pageshow", updateAccountLink);
    updateAccountLink();
  }
  const close = () => { button.setAttribute("aria-expanded", "false"); menu.classList.remove("open"); };
  button.addEventListener("click", event => { event.stopPropagation(); const open = button.getAttribute("aria-expanded") !== "true"; button.setAttribute("aria-expanded", String(open)); menu.classList.toggle("open", open); });
  menu.addEventListener("click", event => { if (event.target.closest("a")) close(); });
  document.addEventListener("click", event => { if (!menu.contains(event.target)) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
});
