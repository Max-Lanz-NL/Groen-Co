const config = window.GROEN_CO || {};
const number = String(config.whatsappNumber || "").replace(/[+\s()-]/g, "");
const validNumber = /^[1-9]\d{7,14}$/.test(number);
const contactMessage =
  config.whatsappMessage ||
  "Hallo Max en Leo! Ik wil graag meer informatie over de diensten van Groen & Co.";
document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  if (validNumber) {
    link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(contactMessage);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
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
    if (e.key === "Escape") {
      close();
      menuButton.focus();
    }
  });
}
document.querySelectorAll("[data-team-photo]").forEach((frame) => {
  if (!config.photos?.together) return;
  const img = document.createElement("img");
  img.alt = "Max en Leo, de oprichters van Groen & Co.";
  img.loading = "lazy";
  img.decoding = "async";
  img.addEventListener("load", () => {
    frame.replaceChildren(img);
    frame.classList.add("has-photo");
  });
  img.src = config.photos.together;
});
const work = document.querySelector("[data-work-gallery]");
if (work && Array.isArray(config.photos?.work)) {
  config.photos.work.forEach((src, i) => {
    const img = document.createElement("img");
    img.alt = "Werkzaamheden van Groen & Co. in Arnhem en omgeving — foto " + (i + 1);
    img.loading = "lazy";
    img.addEventListener("load", () => {
      work.hidden = false;
      work.append(img);
    });
    img.src = src;
  });
}
if (config.siteUrl) {
  try {
    const base = new URL(config.siteUrl);
    if (["https:", "http:"].includes(base.protocol)) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = new URL(location.pathname, base).href;
      document.head.append(link);
    }
  } catch {
    /* Een ongeldige configuratie beïnvloedt de pagina niet. */
  }
}
