// Iedere dienst krijgt zijn eigen tuinachtergrond en gereedschap.
// Alleen de achtergrond beweegt: linktekst, focus en klikgebied blijven intact.
window.GroenWhatsApp = {
  enhance(link) {
    if (!link.classList.contains("button") || link.querySelector(".button-grass")) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.className = "button-grass";
    canvas.setAttribute("aria-hidden", "true");
    link.classList.add("whatsapp-button");
    link.append(canvas);

    const effects = {
      grasmaaien: "grass",
      snoeien: "hedge",
      onkruid: "weeds",
      bladeren: "leaves",
      tuinonderhoud: "care",
      buitenklussen: "sweep",
    };
    const kind = effects[link.closest(".service-row")?.id] || "grass";
    link.dataset.gardenEffect = kind;
    const regrowDelay = 1000;
    const regrowDuration = 2000;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = window.matchMedia("(hover: hover)");
    const mower = new Image();
    mower.src =
      "/images/" +
      {
        grass: "mower-top",
        hedge: "shears-top",
        weeds: "weeder-top",
        leaves: "rake-top",
        care: "garden-tools-top",
        sweep: "broom-top",
      }[kind] +
      ".svg";
    let width = 0,
      height = 0,
      blades = [],
      particles = [];
    let hovering = false,
      focusing = false,
      mowing = false,
      growing = false;
    let progress = 0,
      previousX = -50,
      started = 0,
      lastFrame = 0;
    let frame = 0,
      growTimer = 0;
    const setState = (state) => {
      link.dataset.grassState = state;
    };
    const cancelGrowth = () => {
      clearTimeout(growTimer);
      growTimer = 0;
      growing = false;
    };

    function paint() {
      const time = performance.now();
      frame = 0;
      const dt = Math.min((time - lastFrame) / 1000 || 0, 0.04);
      lastFrame = time;
      if (mowing) {
        progress = Math.min((time - started) / 1400, 1);
        const front = progress * (width + 80) - 20;
        blades.forEach((blade) => {
          if (blade.x >= previousX && blade.x <= front) blade.level = 0;
        });
        previousX = front;
        if (front > 0 && front < width && dt > 0) {
          for (let i = 0; i < 3; i++)
            particles.push({
              x: front - 10,
              y: height / 2 + (i % 2 ? 14 : -14),
              vx:
                kind === "leaves" || kind === "sweep"
                  ? 75 + Math.random() * 80
                  : -35 - Math.random() * 70,
              vy: (i % 2 ? 1 : -1) * (20 + Math.random() * 65),
              life: 0.3 + Math.random() * 0.25,
              angle: Math.random() * 6.28,
            });
        }
        if (progress === 1) {
          mowing = false;
          setState("mown");
        }
      }
      if (growing) {
        const t = Math.min((time - started) / regrowDuration, 1);
        const eased = t * t * (3 - 2 * t);
        blades.forEach((blade) => {
          blade.level = blade.from + (1 - blade.from) * eased;
        });
        if (t === 1) {
          growing = false;
          setState("ready");
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = kind === "hedge" ? "#153821" : kind === "grass" ? "#163e29" : "#29372e";
      ctx.fillRect(0, 0, width, height);
      if (["weeds", "leaves", "sweep"].includes(kind)) {
        ctx.strokeStyle = "#1b2a22";
        ctx.lineWidth = 2;
        for (let y = 0; y < height; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          for (let x = y % 44 ? 18 : 0; x < width; x += 36) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 22);
            ctx.stroke();
          }
        }
      }
      if (kind === "care") {
        ctx.fillStyle = "#35382a";
        ctx.fillRect(0, 0, width, height * 0.48);
      }
      blades.forEach((blade) => {
        const type = kind === "care" ? blade.type : kind;
        if (type === "hedge") {
          const size = 2 + blade.level * blade.length * 0.38;
          ctx.fillStyle = blade.color;
          ctx.beginPath();
          ctx.ellipse(blade.x, blade.y, size, size * 0.65, blade.dx * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#26472a";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(blade.x - size * 0.5, blade.y);
          ctx.lineTo(blade.x + size * 0.5, blade.y);
          ctx.stroke();
          return;
        }
        if (["weeds", "leaves", "sweep"].includes(type)) {
          if (blade.level < 0.01) return;
          ctx.globalAlpha = blade.level;
          if (type === "weeds") {
            const size = blade.length * 0.55 * blade.level;
            ctx.strokeStyle = "#64804c";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(blade.x, blade.y);
            ctx.lineTo(blade.x, blade.y - size);
            ctx.stroke();
            ctx.fillStyle = blade.color;
            for (let side of [-1, 1]) {
              ctx.beginPath();
              ctx.ellipse(
                blade.x + side * size * 0.35,
                blade.y - size * 0.6,
                size * 0.5,
                size * 0.22,
                side * 0.7,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(
                blade.x + side * size * 0.35,
                blade.y,
                size * 0.5,
                size * 0.22,
                -side * 0.7,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            }
          } else if (type === "sweep" && blade.type !== "leaves") {
            ctx.fillStyle = "#96836a";
            ctx.fillRect(blade.x, blade.y, 1.7, 1.2);
          } else {
            const size = (3 + blade.length * 0.22) * blade.level;
            ctx.fillStyle = blade.autumn;
            ctx.beginPath();
            ctx.ellipse(blade.x, blade.y, size, size * 0.5, blade.dx * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#b2a275";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(blade.x, blade.y);
            ctx.lineTo(blade.x + size * blade.dx, blade.y + size * 0.4);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          return;
        }
        const length = 1.5 + blade.level * blade.length;
        ctx.strokeStyle = blade.color;
        ctx.lineWidth = blade.level > 0.4 ? 1.15 : 1.6;
        ctx.beginPath();
        ctx.moveTo(blade.x, blade.y);
        ctx.quadraticCurveTo(
          blade.x + blade.dx * length * 0.25,
          blade.y - length * 0.5,
          blade.x + blade.dx * length,
          blade.y - length * 0.65,
        );
        ctx.stroke();
      });

      particles = particles.filter((particle) => particle.life > 0);
      particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        particle.angle += dt * 9;
        const autumn = kind === "leaves" || kind === "sweep";
        ctx.strokeStyle =
          "rgba(" +
          (autumn ? "194, 157, 93, " : "170, 201, 100, ") +
          Math.min(particle.life * 4, 1) +
          ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x + Math.cos(particle.angle) * 4,
          particle.y + Math.sin(particle.angle) * 4,
        );
        ctx.stroke();
        if (autumn || kind === "hedge") {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.ellipse(particle.x, particle.y, autumn ? 3 : 2, 1.4, particle.angle, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      if (mowing && mower.complete && mower.naturalWidth) {
        const bob = kind === "grass" ? 0 : Math.sin(progress * Math.PI * 12) * 2.5;
        ctx.drawImage(mower, progress * (width + 80) - 68, height / 2 - 22 + bob, 56, 44);
      }
      if (mowing || growing || particles.length) frame = requestAnimationFrame(paint);
    }

    function start() {
      cancelGrowth();
      if (motion.matches || mowing) return;
      // Een al gemaaid gazon hoeft niet opnieuw: teruggaan annuleert de groeitimer.
      if (blades.every((blade) => blade.level < 0.01)) {
        setState("mown");
        return;
      }
      mowing = true;
      progress = 0;
      previousX = -50;
      started = performance.now();
      lastFrame = started;
      setState("mowing");
      if (!frame) frame = requestAnimationFrame(paint);
    }

    function leave() {
      if (hovering || focusing || motion.matches) return;
      clearTimeout(growTimer);
      growTimer = setTimeout(() => {
        if (hovering || focusing) return;
        growing = true;
        mowing = false;
        blades.forEach((blade) => {
          blade.from = blade.level;
        });
        started = performance.now();
        lastFrame = started;
        setState("growing");
        if (!frame) frame = requestAnimationFrame(paint);
      }, regrowDelay);
    }

    function resize() {
      cancelAnimationFrame(frame);
      frame = 0;
      cancelGrowth();
      mowing = false;
      particles = [];
      width = link.clientWidth;
      height = link.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Vaste zaadwaarde: geen flikkerende of bij iedere frame veranderende sprieten.
      let seed = 127;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      const colors = ["#365f34", "#426c3b", "#2e562e", "#4b713d", "#244d2d"];
      const density = kind === "grass" ? 22 : kind === "hedge" ? 42 : 170;
      blades = Array.from({ length: Math.ceil((width * height) / density) }, (_, i) => ({
        x: random() * width,
        y: random() * (height + 12),
        dx: random() * 1.6 - 0.8,
        length: 6 + random() * 9,
        level: 1,
        from: 1,
        color: colors[Math.floor(random() * colors.length)],
        autumn: ["#9c7946", "#b19556", "#807344", "#976141"][Math.floor(random() * 4)],
        type: ["grass", "weeds", "leaves"][i % 3],
      }));
      setState("ready");
      paint();
    }

    link.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || !mouse.matches) return;
      hovering = true;
      start();
    });
    link.addEventListener("pointerleave", () => {
      hovering = false;
      leave();
    });
    link.addEventListener("focus", () => {
      focusing = link.matches(":focus-visible");
      if (focusing) start();
    });
    link.addEventListener("blur", () => {
      focusing = false;
      leave();
    });
    motion.addEventListener("change", resize);
    new ResizeObserver(resize).observe(link);
    resize();
  },
};
