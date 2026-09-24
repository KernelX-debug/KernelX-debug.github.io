document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const precisePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const header = document.querySelector(".site-header");

  try {
    const savedFaction = localStorage.getItem("angel-faction");
    if (savedFaction === "hero" || savedFaction === "villain") root.dataset.faction = savedFaction;
  } catch (_) { /* Storage can be disabled in private mode. */ }

  function syncFaction() {
    const hero = root.dataset.faction === "hero";
    themeToggle.setAttribute("aria-pressed", String(hero));
    themeToggle.setAttribute("aria-label", hero ? "Cambiar a facción villano" : "Cambiar a facción héroe");
    themeLabel.textContent = hero ? "Héroe" : "Villano";
    document.querySelector('meta[name="theme-color"]').content = hero ? "#e8faff" : "#0d0e15";
  }
  let pulseTimer;
  function pulseNav() {
    header.classList.remove("nav-hit");
    void header.offsetWidth;
    header.classList.add("nav-hit");
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => header.classList.remove("nav-hit"), 450);
  }
  themeToggle.addEventListener("click", () => {
    root.dataset.faction = root.dataset.faction === "villain" ? "hero" : "villain";
    try { localStorage.setItem("angel-faction", root.dataset.faction); } catch (_) {}
    syncFaction();
    pulseNav();
  });
  syncFaction();

  function closeMenu() {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");
    mobileNav.hidden = true;
  }
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileNav.hidden = !open;
    pulseNav();
  });
  document.querySelectorAll(".desktop-nav a, .mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => { pulseNav(); closeMenu(); });
  });
  addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  addEventListener("resize", () => { if (innerWidth > 900) closeMenu(); });

  const heroVisual = document.getElementById("hero-visual");
  const avatarSwitch = document.getElementById("avatar-switch");
  avatarSwitch.addEventListener("click", () => {
    const boosted = heroVisual.classList.toggle("is-boosted");
    avatarSwitch.setAttribute("aria-pressed", String(boosted));
    avatarSwitch.setAttribute("aria-label", boosted ? "Desactivar aura del avatar" : "Activar aura del avatar");
    avatarSwitch.querySelector("span").textContent = boosted ? "AURA ACTIVADA" : "ACTIVAR AURA";
  });
  if (precisePointer && !reduceMotion) {
    const pointerGlow = document.getElementById("pointer-glow");
    addEventListener("pointermove", (event) => {
      pointerGlow.style.transform = `translate(${event.clientX - 224}px, ${event.clientY - 224}px)`;
    }, { passive: true });
    heroVisual.addEventListener("pointermove", (event) => {
      const rect = heroVisual.getBoundingClientRect();
      heroVisual.style.setProperty("--image-x", `${((event.clientX - rect.left) / rect.width - .5) * 14}px`);
      heroVisual.style.setProperty("--image-y", `${((event.clientY - rect.top) / rect.height - .5) * 10}px`);
    });
    heroVisual.addEventListener("pointerleave", () => {
      heroVisual.style.setProperty("--image-x", "0px");
      heroVisual.style.setProperty("--image-y", "0px");
    });
  }

  const moods = [
    "Hoy toca construir algo innecesariamente bonito.",
    "Funciona en mi máquina. Un clásico moderno.",
    "Un commit más y ahora sí descanso. Probablemente.",
    "Mi estrategia: probar hasta que parezca intencional."
  ];
  const moodCopy = document.getElementById("mood-copy");
  moodCopy.setAttribute("aria-live", "polite");
  let moodIndex = 0;
  document.getElementById("shuffle-mood").addEventListener("click", () => {
    moodIndex = (moodIndex + 1) % moods.length;
    moodCopy.textContent = moods[moodIndex];
    if (!reduceMotion) moodCopy.animate(
      [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 280, easing: "ease-out" }
    );
  });

  const scrollProgress = document.getElementById("scroll-progress");
  let scrollTicking = false;
  function updateScroll() {
    const available = document.documentElement.scrollHeight - innerHeight;
    scrollProgress.style.transform = `scaleX(${available > 0 ? Math.min(Math.max(scrollY / available, 0), 1) : 0})`;
    scrollTicking = false;
  }
  addEventListener("scroll", () => {
    if (!scrollTicking) { requestAnimationFrame(updateScroll); scrollTicking = true; }
  }, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: .07, rootMargin: "0px 0px -5% 0px" });
    reveals.forEach((element) => revealObserver.observe(element));
  } else reveals.forEach((element) => element.classList.add("is-visible"));

  if ("IntersectionObserver" in window) {
    const navLinks = [...document.querySelectorAll(".desktop-nav a")];
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-30% 0px -55%", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
  }

  const audio = document.getElementById("audio-player");
  const rows = [...document.querySelectorAll(".track-row")];
  const mainPlay = document.getElementById("main-play");
  const nowPlaying = document.getElementById("now-playing");
  const message = document.getElementById("player-message");
  const currentTime = document.getElementById("current-time");
  const totalTime = document.getElementById("total-time");
  const trackProgress = document.getElementById("track-progress");
  let selected = -1;
  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  }
  function syncPlayer() {
    const playing = !audio.paused && !audio.ended;
    rows.forEach((row, index) => {
      const active = index === selected;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-label", `${playing && active ? "Pausar" : "Reproducir"} ${row.dataset.title}`);
      row.querySelector(".track-state").textContent = playing && active ? "PAUSE" : active ? "READY" : "PLAY";
    });
    mainPlay.setAttribute("aria-label", playing ? "Pausar canción" : "Reproducir canción seleccionada");
    mainPlay.classList.toggle("is-playing", playing);
    document.querySelector(".disc-art").classList.toggle("is-spinning", playing);
  }
  async function playIndex(index) {
    if (selected === index) {
      if (audio.paused) {
        try { await audio.play(); } catch (_) { message.textContent = "No se pudo reproducir el audio en este navegador."; }
      } else audio.pause();
      syncPlayer();
      return;
    }
    selected = index;
    const row = rows[index];
    audio.src = new URL(row.dataset.src, document.baseURI).href;
    audio.load();
    nowPlaying.textContent = row.dataset.title;
    message.textContent = "Cargando pista…";
    trackProgress.value = "0";
    trackProgress.style.setProperty("--progress", "0%");
    currentTime.textContent = "0:00";
    totalTime.textContent = "0:00";
    document.querySelector(".player-header > span:first-child").textContent = `NOW PLAYING / 00${index + 1}`;
    syncPlayer();
    try { await audio.play(); } catch (_) { message.textContent = "No se pudo reproducir el audio en este navegador."; }
  }
  rows.forEach((row, index) => row.addEventListener("click", () => playIndex(index)));
  mainPlay.addEventListener("click", () => playIndex(selected < 0 ? 0 : selected));
  audio.addEventListener("play", () => { message.textContent = "Sonando ahora. Sí, esta parte pega."; syncPlayer(); });
  audio.addEventListener("pause", () => { if (!audio.ended && selected >= 0) message.textContent = "En pausa. Seguimos cuando quieras."; syncPlayer(); });
  audio.addEventListener("loadedmetadata", () => {
    totalTime.textContent = formatTime(audio.duration);
    trackProgress.disabled = !Number.isFinite(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const percent = audio.currentTime / audio.duration * 100;
      trackProgress.value = String(percent);
      trackProgress.style.setProperty("--progress", `${percent}%`);
    }
  });
  trackProgress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(trackProgress.value) / 100 * audio.duration;
  });
  audio.addEventListener("ended", () => {
    if (selected < rows.length - 1) playIndex(selected + 1);
    else { message.textContent = "Fin del Top 3. ¿Otra vuelta?"; syncPlayer(); }
  });
  audio.addEventListener("error", () => { message.textContent = "No encontré este MP3. Revisa que esté junto al sitio."; syncPlayer(); });
  syncPlayer();

  const canvas = document.getElementById("aura-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      let particles = [], width = 0, height = 0, lastFrame = 0;
      const random = (min, max) => min + Math.random() * (max - min);
      function resizeAura() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        width = innerWidth; height = innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        particles = Array.from({ length: width < 760 ? 22 : 46 }, (_, index) => ({
          x: random(0, width), y: random(0, height), size: random(1.5, 4.5),
          speed: random(.15, .5), drift: random(-.2, .2), phase: random(0, 6.28), pink: index % 5 === 0
        }));
      }
      function animateAura(now) {
        requestAnimationFrame(animateAura);
        if (document.hidden || now - lastFrame < 30) return;
        lastFrame = now;
        ctx.clearRect(0, 0, width, height);
        const hero = root.dataset.faction === "hero";
        particles.forEach((particle) => {
          particle.y -= particle.speed;
          particle.x += particle.drift + Math.sin(now * .0005 + particle.phase) * .08;
          if (particle.y < -12) { particle.y = height + 12; particle.x = random(0, width); }
          if (particle.x < -12) particle.x = width + 12;
          if (particle.x > width + 12) particle.x = -12;
          ctx.fillStyle = particle.pink ? (hero ? "rgba(218, 36, 103, .33)" : "rgba(255, 42, 116, .36)") : (hero ? "rgba(0, 124, 180, .35)" : "rgba(0, 240, 255, .38)");
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(now * .00015 + particle.phase);
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          ctx.restore();
        });
      }
      resizeAura();
      addEventListener("resize", resizeAura, { passive: true });
      requestAnimationFrame(animateAura);
    }
  }

  if (window.lucide) window.lucide.createIcons();
  document.getElementById("year").textContent = new Date().getFullYear();
});
