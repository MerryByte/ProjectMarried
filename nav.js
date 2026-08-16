document.querySelectorAll(".nav-toggle").forEach(button => {
  const menu = document.querySelector(`#${button.getAttribute("aria-controls")}`);
  if (!menu) return;
  const close = () => { button.setAttribute("aria-expanded", "false"); menu.classList.remove("open"); };
  button.addEventListener("click", event => { event.stopPropagation(); const open = button.getAttribute("aria-expanded") !== "true"; button.setAttribute("aria-expanded", String(open)); menu.classList.toggle("open", open); });
  menu.addEventListener("click", event => { if (event.target.closest("a")) close(); });
  document.addEventListener("click", event => { if (!menu.contains(event.target)) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
});
