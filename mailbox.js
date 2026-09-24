document.addEventListener("DOMContentLoaded", () => {
  const endpointText = document.querySelector('meta[name="mailbox-api"]')?.content.trim() || "";
  const question = document.getElementById("mailbox-question");
  const count = document.getElementById("mailbox-count");
  const form = document.getElementById("mailbox-form");
  const submit = document.getElementById("mailbox-submit");
  const status = document.getElementById("mailbox-status");
  const list = document.getElementById("mailbox-list");
  const adminPanel = document.getElementById("mailbox-admin");
  const tokenInput = document.getElementById("mailbox-token");
  const adminLoad = document.getElementById("mailbox-admin-load");
  const adminStatus = document.getElementById("mailbox-admin-status");
  const pending = document.getElementById("mailbox-pending");
  let adminToken = "";

  question.addEventListener("input", () => {
    count.textContent = `${question.value.length} / 500`;
  });

  let api = "";
  try {
    if (endpointText) {
      const parsed = new URL(endpointText);
      if (parsed.protocol === "https:" || (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) {
        api = parsed.href.replace(/\/+$/, "");
      }
    }
  } catch (_) { /* The public config has an invalid URL. */ }

  const note = (text, className = "mailbox-empty") => {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = text;
    return element;
  };
  const setStatus = (text, kind = "") => {
    status.textContent = text;
    status.classList.toggle("is-error", kind === "error");
    status.classList.toggle("is-success", kind === "success");
  };
  const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "sin fecha" : new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  const errorLabel = (response) => {
    if (response.status === 429) return "Demasiados mensajes por ahora. Prueba más tarde.";
    if (response.status === 401 || response.status === 403) return "Clave incorrecta o acceso no autorizado.";
    if (response.status === 400) return "Revisa el texto e inténtalo otra vez.";
    return "No se pudo conectar al buzón. Prueba en un rato.";
  };

  async function request(path, options = {}) {
    const response = await fetch(`${api}${path}`, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      ...options
    });
    if (!response.ok) throw new Error(errorLabel(response));
    return response.status === 204 ? null : response.json();
  }

  function renderPublic(items) {
    list.replaceChildren();
    if (!items.length) {
      list.append(note("Todavía no hay papelitos publicados. Qué sospechoso silencio."));
      return;
    }
    items.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = "mailbox-entry";
      const head = document.createElement("div");
      head.className = "mailbox-entry-head";
      const number = document.createElement("span");
      number.textContent = `NOTA ${String(index + 1).padStart(2, "0")} / ANÓNIMO`;
      const date = document.createElement("time");
      date.textContent = dateLabel(item.answeredAt);
      if (item.answeredAt) date.dateTime = item.answeredAt;
      head.append(number, date);
      const questionText = document.createElement("p");
      questionText.className = "mailbox-entry-question";
      questionText.textContent = item.question;
      const answer = document.createElement("p");
      answer.className = "mailbox-entry-answer";
      const byline = document.createElement("strong");
      byline.textContent = "Angel responde";
      answer.append(byline, document.createTextNode(item.answer));
      article.append(head, questionText, answer);
      list.append(article);
    });
  }

  async function loadPublic() {
    list.replaceChildren(note("Cargando papelitos…"));
    try {
      const data = await request("/api/questions");
      renderPublic(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      list.replaceChildren(note(error.message));
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!api) return;
    const text = question.value.trim();
    if (text.length < 10 || text.length > 500) {
      setStatus("Escribe entre 10 y 500 caracteres.", "error");
      return;
    }
    submit.disabled = true;
    setStatus("Enviando tu papelito…");
    try {
      await request("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });
      question.value = "";
      count.textContent = "0 / 500";
      setStatus("Enviado. Aparecerá si lo apruebo y respondo.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });

  function renderAdmin(items) {
    pending.replaceChildren();
    if (!items.length) {
      pending.append(note("Bandeja vacía. El gato por fin puede descansar."));
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "pending-item";
      const meta = document.createElement("small");
      meta.textContent = `#${item.id} · ${item.status} · ${dateLabel(item.createdAt)}`;
      const questionText = document.createElement("p");
      questionText.textContent = item.question;
      const answer = document.createElement("textarea");
      answer.maxLength = 1200;
      answer.value = item.answer || "";
      answer.setAttribute("aria-label", `Respuesta para la nota ${item.id}`);
      answer.placeholder = "Tu respuesta pública…";
      const actions = document.createElement("div");
      actions.className = "admin-actions";
      const publish = document.createElement("button");
      publish.type = "button";
      publish.textContent = item.status === "approved" ? "Actualizar respuesta" : "Responder y publicar";
      publish.addEventListener("click", () => moderate(item.id, { status: "approved", answer: answer.value.trim() }));
      const reject = document.createElement("button");
      reject.type = "button";
      reject.className = "reject";
      reject.textContent = item.status === "rejected" ? "Restaurar" : "Descartar";
      reject.addEventListener("click", () => moderate(item.id, { status: item.status === "rejected" ? "pending" : "rejected" }));
      actions.append(publish, reject);
      card.append(meta, questionText, answer, actions);
      pending.append(card);
    });
  }

  async function loadAdmin() {
    if (!api || !adminToken) return;
    adminStatus.textContent = "Abriendo bandeja…";
    try {
      const data = await request("/api/admin/questions", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      renderAdmin(Array.isArray(data.items) ? data.items : []);
      adminStatus.textContent = "Solo tú ves esta bandeja.";
    } catch (error) {
      adminStatus.textContent = error.message;
      pending.replaceChildren();
      if (error.message.includes("Clave")) adminToken = "";
    }
  }

  async function moderate(id, body) {
    if (body.status === "approved" && (body.answer.length < 1 || body.answer.length > 1200)) {
      adminStatus.textContent = "La respuesta debe tener entre 1 y 1200 caracteres.";
      return;
    }
    adminStatus.textContent = "Guardando…";
    try {
      await request(`/api/admin/questions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      await Promise.all([loadAdmin(), loadPublic()]);
      adminStatus.textContent = body.status === "approved" ? "Respuesta publicada." : "Nota actualizada.";
    } catch (error) {
      adminStatus.textContent = error.message;
    }
  }

  adminLoad.addEventListener("click", () => {
    adminToken = tokenInput.value.trim();
    tokenInput.value = "";
    if (!adminToken) { adminStatus.textContent = "Escribe la clave de administración."; return; }
    loadAdmin();
  });
  adminPanel.addEventListener("toggle", () => {
    if (!adminPanel.open) {
      adminToken = "";
      tokenInput.value = "";
      pending.replaceChildren();
    }
  });

  if (!api) {
    adminLoad.disabled = true;
    adminStatus.textContent = "Conectar primero el servicio del buzón.";
    setStatus("El buzón se activará al conectar el servicio.");
    return;
  }
  submit.disabled = false;
  setStatus("Sin nombre ni cuenta. Se publicará solo si se responde.");
  loadPublic();
});
