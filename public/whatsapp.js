// Het gras, maaien en teruggroeien delen één onderdeel op alle WhatsApp-knoppen.
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

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = window.matchMedia("(hover: hover)");
    const mower = new Image();
    mower.src = "/images/mower-top.svg";
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
              vx: -35 - Math.random() * 70,
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
        const t = Math.min((time - started) / 3200, 1);
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
      ctx.fillStyle = "#163e29";
      ctx.fillRect(0, 0, width, height);
      blades.forEach((blade) => {
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
        ctx.strokeStyle = "rgba(170, 201, 100, " + Math.min(particle.life * 4, 1) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x + Math.cos(particle.angle) * 4,
          particle.y + Math.sin(particle.angle) * 4,
        );
        ctx.stroke();
      });
      if (mowing && mower.complete && mower.naturalWidth) {
        ctx.drawImage(mower, progress * (width + 80) - 68, height / 2 - 22, 56, 44);
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
      }, 2000);
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
      blades = Array.from({ length: Math.ceil((width * height) / 22) }, () => ({
        x: random() * width,
        y: random() * (height + 12),
        dx: random() * 1.6 - 0.8,
        length: 6 + random() * 9,
        level: 1,
        from: 1,
        color: colors[Math.floor(random() * colors.length)],
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
