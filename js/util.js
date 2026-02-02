// /public/js/util.js
export function showToast(mensagem, tipo = "sucesso") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; display:grid; gap:10px;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const cor = tipo === "sucesso" ? "#16a34a" : "#ef4444";
  toast.style.cssText = `background:#fff; color:#111418; padding:16px 20px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border-left:6px solid ${cor}; display:flex; align-items:center; gap:12px; font-weight:800; animation:slideIn 0.3s ease-out; font-family:Inter, sans-serif;`;
  toast.innerHTML = `<span class="material-symbols-outlined" style="color:${cor}">${tipo === "sucesso" ? "check_circle" : "error"}</span> ${mensagem}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "0.5s"; setTimeout(() => toast.remove(), 500); }, 4000);
}

export function formatarDataBR(dataISO) {
  if (!dataISO) return "—";
  const d = new Date(dataISO);
  return isNaN(d.getTime()) ? dataISO : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function linkWhatsApp(telefone, mensagem = "") {
  const t = (telefone || "").replace(/\D/g, "");
  const num = t.startsWith("55") ? t : "55" + t;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`;
}

export function getQueryParam(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

//  autenticacao.js
export function mostrar(el) { if (el) el.style.display = "block"; }
export function esconder(el) { if (el) el.style.display = "none"; }
export function setTexto(el, txt) { if (el) el.textContent = txt; }