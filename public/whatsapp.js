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
        hedge: "electric-trimmer-top",
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
    const duration = {
      grass: 1400,
      hedge: 1700,
      weeds: 2600,
      leaves: 2600,
      care: 2600,
      sweep: 2400,
    }[kind];
    const ease = (value) => value * value * (3 - 2 * value);
    function toolPose(p) {
      const base = p * (width + 90) - 45;
      if (kind === "grass" || kind === "hedge")
        return { x: base, y: height / 2, angle: 0, contact: true };
      // Een werkende trekbeweging, gevolgd door een opgetilde teruggaande slag.
      const phase = (p * 4) % 1;
      const contact = phase < 0.68;
      const stroke = contact ? ease(phase / 0.68) : ease((phase - 0.68) / 0.32);
      const reach = kind === "weeds" ? 65 : 78;
      return {
        x: base + (contact ? reach * (0.45 - stroke) : reach * (-0.55 + stroke)),
        y:
          height / 2 + (contact ? Math.sin(stroke * Math.PI) * 4 : -9 * Math.sin(stroke * Math.PI)),
        angle: contact ? -0.22 + stroke * 0.4 : 0.18 - stroke * 0.4,
        contact,
      };
    }
    function leaf(x, y, size, angle, color, maple = false) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      if (maple) {
        ctx.moveTo(-size, 0);
        ctx.lineTo(-size * 0.35, -size * 0.2);
        ctx.lineTo(-size * 0.6, -size * 0.65);
        ctx.lineTo(0, -size * 0.4);
        ctx.lineTo(size * 0.2, -size * 0.85);
        ctx.lineTo(size * 0.45, -size * 0.3);
        ctx.lineTo(size, 0);
        ctx.lineTo(size * 0.45, size * 0.3);
        ctx.lineTo(size * 0.2, size * 0.85);
        ctx.lineTo(0, size * 0.4);
        ctx.lineTo(-size * 0.6, size * 0.65);
        ctx.lineTo(-size * 0.35, size * 0.2);
        ctx.closePath();
      } else {
        ctx.moveTo(-size, 0);
        ctx.quadraticCurveTo(-size * 0.1, -size * 0.85, size, 0);
        ctx.quadraticCurveTo(-size * 0.1, size * 0.85, -size, 0);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(198, 208, 148, .28)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(size * 0.8, 0);
      for (const sign of [-1, 1]) {
        ctx.moveTo(-size * 0.35, 0);
        ctx.lineTo(0, sign * size * 0.32);
        ctx.moveTo(size * 0.15, 0);
        ctx.lineTo(size * 0.4, sign * size * 0.24);
      }
      ctx.stroke();
      ctx.restore();
    }
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
        progress = Math.min((time - started) / duration, 1);
        const pose = toolPose(progress);
        const front = progress * (width + 80) - 20;
        blades.forEach((blade) => {
          if (kind === "grass" || kind === "hedge") {
            if (blade.x >= previousX && blade.x <= front) blade.level = 0;
          } else if (pose.contact && Math.abs(blade.x + blade.shift - (pose.x + 18)) < 27) {
            blade.level = Math.max(0, blade.level - dt * 5);
            blade.shift -= dt * (kind === "weeds" ? 14 : 75);
          }
          if (progress > 0.92) blade.level = Math.min(blade.level, (1 - progress) / 0.08);
        });
        previousX = front;
        if (pose.x > 0 && pose.x < width && dt > 0 && pose.contact) {
          for (let i = 0; i < (kind === "grass" ? 3 : 2); i++)
            particles.push({
              x: pose.x + 16,
              y: pose.y + (i % 2 ? 14 : -14),
              vx:
                kind === "leaves" || kind === "sweep"
                  ? -70 - Math.random() * 50
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
        const eased = ease(t);
        blades.forEach((blade) => {
          blade.level = blade.from + (1 - blade.from) * eased;
          blade.shift = blade.shiftFrom * (1 - eased);
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
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#454331";
        ctx.lineWidth = 1.2;
        for (let y = 9; y < height; y += 12) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.quadraticCurveTo(width * 0.5, y + 3, width, y);
          ctx.stroke();
        }
      }
      blades.forEach((blade) => {
        const type = kind === "care" ? blade.type : kind;
        if (type === "hedge") {
          const size = blade.base
            ? 4 + blade.length * 0.32
            : (3 + blade.length * 0.4) * blade.level;
          const trimmedY = Math.max(height * 0.16, Math.min(height * 0.84, blade.y));
          const y = blade.base ? trimmedY + (blade.y - trimmedY) * blade.level : blade.y;
          if (size > 0.2) leaf(blade.x, y, size, blade.dx * 4, blade.color);
          return;
        }
        if (["weeds", "leaves", "sweep"].includes(type)) {
          if (blade.level < 0.01) return;
          ctx.globalAlpha = blade.level;
          if (type === "weeds") {
            const size = (5 + blade.length * 0.45) * blade.level;
            const x = blade.x + blade.shift;
            const y = blade.y - (1 - blade.level) * 9;
            // Een herkenbare rozet met losse puntige bladeren en wortel bij lostrekken.
            for (let arm = 0; arm < 6; arm++) {
              const angle = (arm * Math.PI) / 3 + blade.dx;
              leaf(
                x + Math.cos(angle) * size * 0.45,
                y + Math.sin(angle) * size * 0.45,
                size * 0.65,
                angle,
                blade.color,
                true,
              );
            }
            if (blade.flower) {
              ctx.fillStyle = "#c1aa48";
              ctx.beginPath();
              ctx.ellipse(x, y, 1.8, 1.8, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            if (blade.level < 0.85) {
              ctx.strokeStyle = "#b19c6b";
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + 2, y + (1 - blade.level) * 14);
              ctx.lineTo(x - 2, y + (1 - blade.level) * 18);
              ctx.stroke();
            }
          } else if (type === "sweep" && blade.type !== "leaves") {
            ctx.fillStyle = "#96836a";
            ctx.fillRect(blade.x + blade.shift, blade.y, 1.7, 1.2);
          } else {
            const size = (4 + blade.length * 0.3) * (0.6 + 0.4 * blade.level);
            leaf(
              blade.x + blade.shift,
              blade.y,
              size,
              blade.dx * 4 + blade.shift * 0.03,
              blade.autumn,
              blade.maple,
            );
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
        const pose = toolPose(progress);
        ctx.save();
        ctx.translate(pose.x, pose.y);
        ctx.rotate(pose.angle);
        if (!pose.contact) ctx.globalAlpha = 0.7;
        const toolWidth = kind === "hedge" ? 80 : kind === "grass" ? 56 : 72;
        ctx.drawImage(mower, -toolWidth / 2, -22, toolWidth, 44);
        if (kind === "hedge") {
          // De tanden bewegen snel heen en weer; de hele machine blijft strak op koers.
          ctx.strokeStyle = "#c7d1c1";
          ctx.lineWidth = 1;
          const jitter = Math.sin(time * 0.12) * 1.4;
          for (let tooth = 2; tooth < 34; tooth += 4) {
            ctx.beginPath();
            ctx.moveTo(tooth + jitter, -3);
            ctx.lineTo(tooth + jitter + 1, -6);
            ctx.moveTo(tooth + jitter, 3);
            ctx.lineTo(tooth + jitter + 1, 6);
            ctx.stroke();
          }
        }
        ctx.restore();
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
          blade.shiftFrom = blade.shift;
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
      const colors = ["#3e6b37", "#507a3e", "#305d30", "#597e43", "#294f2c"];
      const density = { grass: 22, hedge: 25, weeds: 290, leaves: 28, care: 170, sweep: 75 }[kind];
      blades = Array.from({ length: Math.ceil((width * height) / density) }, (_, i) => ({
        x: random() * width,
        y: random() * (height + (kind === "leaves" || kind === "hedge" ? 0 : 12)),
        dx: random() * 1.6 - 0.8,
        length: 6 + random() * 9,
        level: 1,
        from: 1,
        shift: 0,
        shiftFrom: 0,
        base: i % 3 !== 0,
        maple: i % 3 === 0,
        flower: i % 4 === 0,
        color: colors[Math.floor(random() * colors.length)],
        autumn: ["#9c7946", "#b19556", "#807344", "#976141"][Math.floor(random() * 4)],
        type:
          kind === "care"
            ? ["weeds", "leaves", "weeds"][i % 3]
            : ["grass", "weeds", "leaves"][i % 3],
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
