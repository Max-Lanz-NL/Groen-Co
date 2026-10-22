// Eén herbruikbaar onderdeel voor alle WhatsApp-knoppen. Navigatie werkt ook
// zonder dit decoratieve detail; de illustratie ontvangt geen muis- of focus-events.
window.GroenWhatsApp = {
  enhance(link) {
    if (!link.classList.contains("button") || link.querySelector(".mower-lane")) return;
    link.classList.add("whatsapp-button");
    const lane = document.createElement("span");
    lane.className = "mower-lane";
    lane.setAttribute("aria-hidden", "true");
    lane.innerHTML = `<svg class="mower" viewBox="0 0 64 36" focusable="false" aria-hidden="true">
      <path d="M22 24 12 5H4" fill="none" stroke="#e8ecd8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m21 23 5-7h21l9 9v4H19z" fill="#547d45" stroke="#e8ecd8" stroke-width="1"/>
      <path d="M29 16v-6h13l3 6" fill="#123b2a" stroke="#e8ecd8" stroke-width="1"/>
      <path d="M33 10V7h6v3" fill="#e8ecd8"/>
      <path d="M20 26h36" stroke="#b6c49d" stroke-width="1.5"/>
      <g fill="#17221c" stroke="#e8ecd8" stroke-width="1"><circle cx="26" cy="29" r="5"/><circle cx="49" cy="29" r="5"/></g>
      <g fill="#aeb5a5"><circle cx="26" cy="29" r="1.5"/><circle cx="49" cy="29" r="1.5"/></g>
    </svg>`;
    link.append(lane);
  },
};
