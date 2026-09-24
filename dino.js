(() => {
  "use strict";

  const WIDTH = 800;
  const HEIGHT = 500;
  const MAX_STROKES = 80;
  const MAX_POINTS = 2400;
  const MAX_POINTS_PER_STROKE = 160;
  const COLORS = /^#[0-9a-f]{6}$/i;
  const NAME = /^[\p{L}\p{N}]+(?:[ _-][\p{L}\p{N}]+)*$/u;

  function line(color, width, start, segments) {
    const points = [start];
    let previous = start;
    for (const segment of segments) {
      if (segment[0] === "L") {
        previous = [segment[1], segment[2]];
        points.push(previous);
      } else {
        const [, x1, y1, x2, y2, x3, y3] = segment;
        const [x0, y0] = previous;
        for (let step = 1; step <= 8; step++) {
          const t = step / 8;
          const u = 1 - t;
          points.push([
            Math.round((u ** 3 * x0 + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3) * 10) / 10,
            Math.round((u ** 3 * y0 + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3) * 10) / 10
          ]);
        }
        previous = [x3, y3];
      }
    }
    return { color, width, points };
  }

  function starterSketch() {
    const ink = "#112d5b";
    const aqua = "#00a7c8";
    const pink = "#ff2a74";
    const gold = "#e8a300";
    const green = "#168061";
    return [
      // A friendly long-necked dinosaur, intentionally drawn as editable strokes.
      line(ink, 5, [189, 304], [
        ["C", 216, 296, 235, 272, 253, 246],
        ["C", 284, 205, 339, 201, 391, 221],
        ["C", 425, 235, 441, 258, 450, 276],
        ["C", 458, 242, 464, 199, 466, 145],
        ["C", 469, 99, 481, 77, 511, 76],
        ["C", 536, 75, 558, 93, 562, 116],
        ["C", 567, 140, 553, 153, 531, 153],
        ["L", 484, 153],
        ["C", 484, 208, 494, 258, 515, 285],
        ["C", 538, 313, 545, 329, 528, 341],
        ["C", 507, 358, 478, 357, 455, 349],
        ["C", 429, 364, 393, 366, 363, 358],
        ["C", 321, 360, 286, 349, 257, 335],
        ["C", 225, 319, 205, 311, 189, 304]
      ]),
      line(ink, 5, [286, 346], [
        ["C", 284, 372, 277, 397, 271, 413],
        ["L", 312, 413],
        ["C", 319, 393, 324, 371, 330, 354]
      ]),
      line(ink, 5, [370, 359], [
        ["C", 371, 381, 365, 401, 361, 413],
        ["L", 405, 413],
        ["C", 410, 390, 415, 370, 418, 355]
      ]),
      line(aqua, 3, [301, 275], [["C", 338, 254, 394, 262, 423, 294]]),
      line(aqua, 3, [346, 325], [["C", 379, 333, 414, 327, 437, 308]]),
      line(aqua, 3, [479, 172], [["C", 478, 218, 483, 255, 498, 276]]),
      line(ink, 11, [530, 114], []),
      line(pink, 17, [544, 129], []),
      line(ink, 3, [521, 137], [["C", 532, 145, 544, 144, 550, 135]]),
      line(green, 4, [269, 226], [["L", 277, 208], ["L", 290, 217]]),
      line(green, 4, [304, 207], [["L", 315, 188], ["L", 328, 205]]),
      line(green, 4, [343, 207], [["L", 356, 192], ["L", 368, 213]]),
      line(gold, 3, [153, 157], [["L", 153, 182]]),
      line(gold, 3, [140, 170], [["L", 166, 170]]),
      line(gold, 3, [600, 220], [["L", 600, 245]]),
      line(gold, 3, [588, 232], [["L", 612, 232]]),
      line(aqua, 3, [186, 420], [["C", 291, 437, 427, 436, 591, 420]])
    ];
  }

  function copyStrokes(strokes) {
    return strokes.map((stroke) => ({
      color: stroke.color,
      width: stroke.width,
      points: stroke.points.map(([x, y]) => [x, y])
    }));
  }

  function paint(context, strokes) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of strokes) {
      if (!stroke.points.length) continue;
      context.strokeStyle = stroke.color;
      context.fillStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.beginPath();
      context.moveTo(stroke.points[0][0], stroke.points[0][1]);
      if (stroke.points.length === 1) {
        context.arc(stroke.points[0][0], stroke.points[0][1], stroke.width / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          context.lineTo(stroke.points[i][0], stroke.points[i][1]);
        }
        context.stroke();
      }
    }
  }

  function safeStrokes(value) {
    if (!Array.isArray(value) || !value.length || value.length > MAX_STROKES) return null;
    let count = 0;
    const strokes = [];
    for (const stroke of value) {
      if (!stroke || typeof stroke !== "object" || !COLORS.test(stroke.color) ||
          !Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 24 ||
          !Array.isArray(stroke.points) || !stroke.points.length || stroke.points.length > MAX_POINTS_PER_STROKE) return null;
      count += stroke.points.length;
      if (count > MAX_POINTS) return null;
      const points = [];
      for (const point of stroke.points) {
        if (!Array.isArray(point) || point.length !== 2 ||
            !Number.isFinite(point[0]) || !Number.isFinite(point[1]) ||
            point[0] < 0 || point[0] > WIDTH || point[1] < 0 || point[1] > HEIGHT) return null;
        points.push(point);
      }
      strokes.push({ color: stroke.color, width: stroke.width, points });
    }
    return strokes;
  }

  function init() {
    const canvas = document.getElementById("dino-canvas");
    const form = document.getElementById("dino-form");
    const gallery = document.getElementById("dino-gallery");
    const status = document.getElementById("dino-status");
    const submit = document.getElementById("dino-submit");
    const prefix = document.getElementById("dino-prefix");
    const nameInput = document.getElementById("dino-name");
    if (!canvas || !form || !gallery || !status || !submit || !prefix || !nameInput) return;

    const galleryStatus = document.getElementById("dino-gallery-status");
    const adminTokenInput = document.getElementById("dino-admin-token");
    const adminOpen = document.getElementById("dino-admin-open");
    const adminStatus = document.getElementById("dino-admin-status");
    const undoButton = document.getElementById("dino-undo");
    const clearButton = document.getElementById("dino-clear");
    const resetButton = document.getElementById("dino-reset");
    const eraserButton = document.getElementById("dino-eraser");
    const refreshButton = document.getElementById("dino-refresh");
    const moreButton = document.getElementById("dino-more");
    const colorButtons = [...document.querySelectorAll("[data-dino-color]")];
    const widthButtons = [...document.querySelectorAll("[data-dino-width]")];
    const endpointText = [...document.querySelectorAll('meta[name="mailbox-api"]')]
      .map((node) => node.content.trim()).find(Boolean) || "";
    let api = "";
    try {
      if (endpointText) {
        const parsed = new URL(endpointText);
        if (parsed.protocol === "https:" || (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) {
          api = parsed.href.replace(/\/+$/, "");
        }
      }
    } catch (_) { /* Invalid public endpoint; the drawing board still works locally. */ }

    const context = canvas.getContext("2d");
    if (!context) {
      status.textContent = "Este navegador no pudo abrir la pizarra.";
      submit.disabled = true;
      return;
    }

    let strokes = starterSketch();
    const history = [];
    let currentStroke = null;
    let pointerId = null;
    let color = "#00a7c8";
    let brushWidth = 2;
    let erasing = false;
    let adminToken = "";
    let galleryRevision = 0;
    let galleryLoading = false;
    let loadedItems = [];
    let nextCursor = null;
    let lastGalleryLoad = 0;
    let keyboardFocus = false;
    let keyboardDrawing = false;
    const keyboardCursor = { x: 400, y: 250 };

    function setStatus(message, kind = "") {
      status.textContent = message;
      status.classList.toggle("is-error", kind === "error");
      status.classList.toggle("is-success", kind === "success");
    }

    function setGalleryStatus(message, kind = "") {
      if (!galleryStatus) return;
      galleryStatus.textContent = message;
      galleryStatus.classList.toggle("is-error", kind === "error");
    }

    function updateMoreButton() {
      if (!moreButton) return;
      moreButton.hidden = !api || !nextCursor;
      moreButton.disabled = galleryLoading || !nextCursor;
    }

    function render() {
      paint(context, strokes);
      if (keyboardFocus) {
        context.save();
        context.strokeStyle = erasing ? "#ff2a74" : color;
        context.lineWidth = 2;
        context.setLineDash([4, 4]);
        context.beginPath();
        context.arc(keyboardCursor.x, keyboardCursor.y, 11, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }
    }

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(WIDTH * pixelRatio);
      canvas.height = Math.round(HEIGHT * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      render();
    }

    function remember() {
      history.push(copyStrokes(strokes));
      if (history.length > 30) history.shift();
      if (undoButton) undoButton.disabled = false;
    }

    function pointBudget() {
      return strokes.reduce((total, stroke) => total + stroke.points.length, 0);
    }

    function reducePoints() {
      for (const stroke of strokes) {
        if (stroke.points.length < 4) continue;
        stroke.points = stroke.points.filter((_, index) => index === 0 || index === stroke.points.length - 1 || index % 2 === 0);
      }
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return [
        Math.round(Math.max(0, Math.min(WIDTH, (event.clientX - rect.left) * WIDTH / rect.width)) * 10) / 10,
        Math.round(Math.max(0, Math.min(HEIGHT, (event.clientY - rect.top) * HEIGHT / rect.height)) * 10) / 10
      ];
    }

    function beginStroke(point) {
      if (strokes.length >= MAX_STROKES) {
        setStatus("La pizarra ya está llena de trazos. Borra o deshaz algunos.", "error");
        return false;
      }
      remember();
      currentStroke = {
        color: erasing ? "#ffffff" : color,
        width: erasing ? (brushWidth <= 3 ? 14 : 24) : brushWidth,
        points: [point]
      };
      strokes.push(currentStroke);
      render();
      return true;
    }

    function appendPoint(point) {
      if (!currentStroke) return;
      const previous = currentStroke.points[currentStroke.points.length - 1];
      if (Math.hypot(point[0] - previous[0], point[1] - previous[1]) < 1.5) return;
      currentStroke.points.push(point);
      if (currentStroke.points.length > MAX_POINTS_PER_STROKE || pointBudget() > MAX_POINTS) reducePoints();
      render();
    }

    function finishStroke() {
      currentStroke = null;
      pointerId = null;
      keyboardDrawing = false;
    }

    canvas.style.touchAction = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Pizarra del dinosaurio. Dibuja con el dedo o mouse; con teclado usa las flechas para mover el cursor y espacio para activar o detener el crayón.");
    canvas.addEventListener("pointerdown", (event) => {
      if (pointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      canvas.focus({ preventScroll: true });
      keyboardFocus = false;
      if (!beginStroke(pointFromEvent(event))) return;
      pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      appendPoint(pointFromEvent(event));
    });
    canvas.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      appendPoint(pointFromEvent(event));
      finishStroke();
    });
    canvas.addEventListener("pointercancel", (event) => {
      if (event.pointerId === pointerId) finishStroke();
    });
    canvas.addEventListener("lostpointercapture", (event) => {
      if (event.pointerId === pointerId) finishStroke();
    });
    canvas.addEventListener("focus", () => { if (pointerId === null) { keyboardFocus = true; render(); } });
    canvas.addEventListener("blur", () => { keyboardFocus = false; finishStroke(); render(); });
    canvas.addEventListener("keydown", (event) => {
      if (pointerId !== null) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (keyboardDrawing) finishStroke();
        else keyboardDrawing = beginStroke([keyboardCursor.x, keyboardCursor.y]);
        setStatus(keyboardDrawing ? "Crayón activo: mueve con las flechas. Espacio para soltar." : "Crayón pausado.");
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 20 : 8;
        keyboardCursor.x = Math.max(0, Math.min(WIDTH, keyboardCursor.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0)));
        keyboardCursor.y = Math.max(0, Math.min(HEIGHT, keyboardCursor.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0)));
        if (keyboardDrawing) appendPoint([keyboardCursor.x, keyboardCursor.y]);
        else render();
      } else if (event.key === "Escape" && keyboardDrawing) {
        event.preventDefault();
        finishStroke();
        setStatus("Crayón pausado.");
      }
    });

    function updateTools() {
      colorButtons.forEach((button) => {
        const active = !erasing && button.dataset.dinoColor.toLowerCase() === color;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      widthButtons.forEach((button) => {
        const active = Number(button.dataset.dinoWidth) === brushWidth;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (eraserButton) {
        eraserButton.classList.toggle("is-active", erasing);
        eraserButton.setAttribute("aria-pressed", String(erasing));
      }
    }

    colorButtons.forEach((button) => button.addEventListener("click", () => {
      const picked = button.dataset.dinoColor;
      if (!COLORS.test(picked)) return;
      color = picked.toLowerCase();
      erasing = false;
      updateTools();
    }));
    widthButtons.forEach((button) => button.addEventListener("click", () => {
      const picked = Number(button.dataset.dinoWidth);
      if (!Number.isFinite(picked) || picked < 1 || picked > 24) return;
      brushWidth = picked;
      updateTools();
    }));
    eraserButton?.addEventListener("click", () => { erasing = !erasing; updateTools(); });
    undoButton?.addEventListener("click", () => {
      finishStroke();
      if (!history.length) return;
      strokes = history.pop();
      undoButton.disabled = history.length === 0;
      render();
      setStatus("Último cambio deshecho.");
    });
    clearButton?.addEventListener("click", () => {
      finishStroke();
      if (!strokes.length) return;
      remember();
      strokes = [];
      render();
      setStatus("Lienzo en blanco. Ahora sí, dinosaurio desde cero.");
    });
    resetButton?.addEventListener("click", () => {
      finishStroke();
      remember();
      strokes = starterSketch();
      render();
      setStatus("Boceto inicial restaurado.");
    });

    function responseError(response) {
      if (response.status === 400 || response.status === 413) return "El dibujo o el nombre no cumple los límites. Prueba con menos trazos.";
      if (response.status === 401 || response.status === 403) return "Clave de administración incorrecta.";
      if (response.status === 429) return "Demasiados envíos por ahora. Prueba en unos minutos.";
      if (response.status === 507) return "El museo está lleno por ahora. Vuelve cuando haya espacio para más dinos.";
      if (response.status === 503) return "El tablón aún no está disponible. Prueba más tarde.";
      return "No se pudo conectar con el tablón. Prueba más tarde.";
    }

    async function request(path, options = {}) {
      let response;
      try {
        response = await fetch(`${api}${path}`, {
          credentials: "omit",
          referrerPolicy: "no-referrer",
          ...options
        });
      } catch {
        throw new Error("No hay conexión con el tablón. Prueba desde la página publicada o inténtalo más tarde.");
      }
      if (!response.ok) throw new Error(responseError(response));
      return response.status === 204 ? null : response.json();
    }

    function emptyMessage(message) {
      const paragraph = document.createElement("p");
      paragraph.className = "dino-gallery-empty";
      paragraph.textContent = message;
      return paragraph;
    }

    function dateLabel(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "recién llegado" : new Intl.DateTimeFormat("es-PE", {
        day: "2-digit", month: "short", year: "numeric"
      }).format(date);
    }

    function renderGallery(items, append = false) {
      if (append) gallery.querySelectorAll(".dino-gallery-empty").forEach((empty) => empty.remove());
      else gallery.replaceChildren();
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const drawing = safeStrokes(item.strokes);
        if (!drawing) continue;
        const card = document.createElement("article");
        card.className = "dino-gallery-card";
        const preview = document.createElement("canvas");
        preview.className = "dino-gallery-art";
        preview.width = WIDTH / 2;
        preview.height = HEIGHT / 2;
        preview.setAttribute("role", "img");
        const displayName = `${item.prefix === "Mrs." ? "Mrs." : "Mr."} ${typeof item.name === "string" ? item.name.slice(0, 20) : "Anónimo"}`;
        preview.setAttribute("aria-label", `Dinosaurio dibujado por ${displayName}`);
        const previewContext = preview.getContext("2d");
        if (previewContext) {
          previewContext.setTransform(0.5, 0, 0, 0.5, 0, 0);
          paint(previewContext, drawing);
        }
        const meta = document.createElement("div");
        meta.className = "dino-gallery-card-meta";
        const title = document.createElement("strong");
        title.className = "dino-gallery-name";
        title.textContent = displayName;
        const date = document.createElement("time");
        date.className = "dino-gallery-date";
        date.textContent = dateLabel(item.createdAt);
        if (typeof item.createdAt === "string" && !Number.isNaN(new Date(item.createdAt).getTime())) date.dateTime = item.createdAt;
        meta.append(title, date);
        card.append(preview, meta);
        if (adminToken && typeof item.id === "string" && item.id.length < 100) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "dino-delete";
          remove.textContent = "Eliminar dibujo";
          remove.setAttribute("aria-label", `Eliminar el dibujo de ${displayName}`);
          remove.addEventListener("click", () => deleteDrawing(item.id, remove));
          card.append(remove);
        }
        gallery.append(card);
      }
      const visible = gallery.querySelectorAll(".dino-gallery-card").length;
      if (!visible) gallery.append(emptyMessage("Todavía no hay dinosaurios publicados. El primero podría ser tuyo."));
      setGalleryStatus(`${visible} dibujo${visible === 1 ? "" : "s"} en el tablón.`);
    }

    async function loadGallery() {
      if (!api) return;
      const revision = ++galleryRevision;
      galleryLoading = true;
      updateMoreButton();
      setGalleryStatus("Cargando dinosaurios…");
      try {
        const data = await request("/api/drawings?limit=12");
        if (revision !== galleryRevision) return;
        loadedItems = Array.isArray(data.items) ? data.items : [];
        nextCursor = typeof data.nextCursor === "string" && data.nextCursor.length <= 500 ? data.nextCursor : null;
        renderGallery(loadedItems);
        lastGalleryLoad = Date.now();
      } catch (error) {
        if (revision !== galleryRevision) return;
        setGalleryStatus(error.message, "error");
        if (!gallery.children.length) gallery.append(emptyMessage("El tablón está descansando. Inténtalo más tarde."));
      } finally {
        if (revision === galleryRevision) {
          galleryLoading = false;
          updateMoreButton();
        }
      }
    }

    async function loadMore() {
      if (!api || !nextCursor || galleryLoading) return;
      const revision = galleryRevision;
      const cursor = nextCursor;
      galleryLoading = true;
      updateMoreButton();
      setGalleryStatus("Buscando más dinosaurios…");
      try {
        const data = await request(`/api/drawings?limit=12&before=${encodeURIComponent(cursor)}`);
        if (revision !== galleryRevision) return;
        const page = Array.isArray(data.items) ? data.items : [];
        const knownIds = new Set(loadedItems.map((item) => item?.id));
        const additions = page.filter((item) => !knownIds.has(item?.id));
        loadedItems.push(...additions);
        nextCursor = typeof data.nextCursor === "string" && data.nextCursor.length <= 500 && data.nextCursor !== cursor
          ? data.nextCursor : null;
        renderGallery(additions, true);
        lastGalleryLoad = Date.now();
      } catch (error) {
        if (revision !== galleryRevision) return;
        setGalleryStatus(error.message, "error");
      } finally {
        if (revision === galleryRevision) {
          galleryLoading = false;
          updateMoreButton();
        }
      }
    }

    async function deleteDrawing(id, button) {
      if (!adminToken || !window.confirm("¿Eliminar este dinosaurio del tablón? No se podrá recuperar.")) return;
      button.disabled = true;
      if (adminStatus) adminStatus.textContent = "Eliminando dibujo…";
      try {
        await request(`/api/admin/drawings/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (adminStatus) adminStatus.textContent = "Dibujo retirado del tablón.";
        loadedItems = loadedItems.filter((item) => item?.id !== id);
        renderGallery(loadedItems);
      } catch (error) {
        if (adminStatus) adminStatus.textContent = error.message;
        if (error.message.includes("Clave")) {
          adminToken = "";
          gallery.querySelectorAll(".dino-delete").forEach((remove) => remove.remove());
        } else {
          button.disabled = false;
        }
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!api) return;
      const chosenName = nameInput.value.normalize("NFKC").trim();
      if (chosenName.length < 2 || chosenName.length > 20 || !NAME.test(chosenName)) {
        setStatus("Elige un apodo de 2 a 20 caracteres: letras, números, espacios, guion o guion bajo.", "error");
        nameInput.focus();
        return;
      }
      if (!["Mr.", "Mrs."].includes(prefix.value)) {
        setStatus("Elige Mr. o Mrs. antes de publicar.", "error");
        prefix.focus();
        return;
      }
      if (!safeStrokes(strokes)) {
        setStatus("Dibuja algo primero, o reduce la cantidad de trazos.", "error");
        return;
      }
      submit.disabled = true;
      setStatus("Enviando tu dinosaurio al tablón…");
      try {
        await request("/api/drawings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix: prefix.value,
            name: chosenName,
            strokes,
            website: document.getElementById("dino-website")?.value || ""
          })
        });
        setStatus("Publicado. Tu dinosaurio ya anda suelto por el tablón.", "success");
        await loadGallery();
      } catch (error) {
        setStatus(error.message || "No se pudo publicar. Prueba más tarde.", "error");
      } finally {
        submit.disabled = false;
      }
    });

    adminOpen?.addEventListener("click", () => {
      adminToken = adminTokenInput?.value.trim() || "";
      if (adminTokenInput) adminTokenInput.value = "";
      if (!adminToken) {
        if (adminStatus) adminStatus.textContent = "Introduce tu clave para mostrar los controles de borrado.";
        return;
      }
      if (adminStatus) adminStatus.textContent = "Clave cargada solo en esta pestaña. Se comprobará al eliminar.";
      if (loadedItems.length) renderGallery(loadedItems);
      else loadGallery();
    });
    adminOpen?.closest("details")?.addEventListener("toggle", (event) => {
      if (event.currentTarget.open) return;
      adminToken = "";
      if (adminTokenInput) adminTokenInput.value = "";
      gallery.querySelectorAll(".dino-delete").forEach((remove) => remove.remove());
      if (adminStatus) adminStatus.textContent = "La clave solo vive en esta pestaña.";
    });
    refreshButton?.addEventListener("click", loadGallery);
    moreButton?.addEventListener("click", loadMore);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && api && Date.now() - lastGalleryLoad > 60000) loadGallery();
    });
    window.addEventListener("resize", resizeCanvas, { passive: true });

    resizeCanvas();
    updateTools();
    if (undoButton) undoButton.disabled = true;
    if (!api) {
      submit.disabled = true;
      if (adminOpen) adminOpen.disabled = true;
      if (refreshButton) refreshButton.disabled = true;
      if (moreButton) moreButton.disabled = true;
      setStatus("Puedes dibujar ya; para publicar falta conectar el servicio del buzón.");
      setGalleryStatus("Tablón pendiente de conexión.");
      gallery.replaceChildren(emptyMessage("Los dinosaurios aparecerán aquí cuando se conecte el tablón."));
    } else {
      submit.disabled = false;
      setStatus("Dibuja, firma con un apodo y publícalo al instante.");
      updateMoreButton();
      loadGallery();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
