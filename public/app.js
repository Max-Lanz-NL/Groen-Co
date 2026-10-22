const config = window.GROEN_CO || {};
const number = String(config.whatsappNumber || "").replace(/[+\s()-]/g, "");
const validNumber = /^[1-9]\d{7,14}$/.test(number);
const contactMessage =
  config.whatsappMessage || "Hoi Max en Leo, ik heb een vraag over tuinonderhoud.";
document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  if (validNumber) {
    const message = link.dataset.message || contactMessage;
    link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    window.GroenWhatsApp?.enhance(link);
  } else {
    link.href = "/contact/#whatsapp";
    link.removeAttribute("target");
  }
});
document.querySelectorAll("[data-contact-status]").forEach((element) => {
  element.hidden = validNumber;
});
document.querySelectorAll("[data-whatsapp-ready]").forEach((element) => {
  element.hidden = !validNumber;
});
const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("#navigation");
if (menuButton && menu) {
  const close = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(expanded));
    menu.classList.toggle("is-open", expanded);
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      close();
      menuButton.focus();
    }
  });
}
document.querySelectorAll("[data-team-photo]").forEach((frame) => {
  if (!config.photos?.showTeam || !config.photos?.together) return;
  const img = document.createElement("img");
  img.alt = "Max en Leo, de oprichters van Groen & Co.";
  // Eerst laden, daarna pas tonen; een los lazy-img kan anders blijven wachten.
  img.loading = "eager";
  img.decoding = "async";
  img.addEventListener("load", () => {
    frame.replaceChildren(img);
    frame.classList.add("has-photo");
    frame.hidden = false;
  });
  img.src = config.photos.together;
});
const work = document.querySelector("[data-work-gallery]");
if (work && Array.isArray(config.photos?.work)) {
  config.photos.work.forEach((photo, i) => {
    const src = typeof photo === "string" ? photo : photo.src;
    if (!src) return;
    const img = document.createElement("img");
    img.alt = photo.alt || "Eigen werk van Groen & Co. — foto " + (i + 1);
    img.loading = "eager";
    img.decoding = "async";
    img.addEventListener("load", () => {
      work.closest("[data-work-section]").hidden = false;
      work.append(img);
    });
    img.src = src;
  });
}
document.querySelectorAll("[data-price]").forEach((element) => {
  const price = config.prices?.[element.dataset.price];
  if (price?.label) element.textContent = [price.label, price.unit].filter(Boolean).join(" · ");
});
