// /public/js/util.js
export function mostrar(el){ if (el) el.hidden = false; }
export function esconder(el){ if (el) el.hidden = true; }
export function setTexto(el, txt){ if (el) el.textContent = txt ?? ""; }

export function formatarDataBR(dataISO){
  if (!dataISO) return "—";
  const d = new Date(dataISO);
  if (isNaN(d.getTime())) return String(dataISO);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function somenteNumeros(str){ return (str || "").replace(/\D/g, ""); }

export function normalizarWhatsApp(telefone){
  let t = somenteNumeros(telefone);
  if (t.startsWith("55") && t.length >= 12) return t;
  if (t.length === 10 || t.length === 11) return "55" + t;
  return t;
}

export function linkWhatsApp(telefone, mensagem=""){
  const t = normalizarWhatsApp(telefone);
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${t}${mensagem ? `?text=${texto}` : ""}`;
}

export function getQueryParam(nome){
  const url = new URL(window.location.href);
  return url.searchParams.get(nome);
}
