// /public/js/professor.detalhe.js
import { supabase } from "./supabaseCliente.js";
import { setTexto, mostrar, esconder, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

async function carregarDetalhe(id){
  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, aluno_nome, aluno_whatsapp, data_aula, tipo_aula, status, form_raw, professor_id")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

function normalizarForm(formRaw){
  if (!formRaw) return null;
  return typeof formRaw === "string" ? JSON.parse(formRaw) : formRaw;
}

function renderizarFormRaw(formRaw){
  const box = document.getElementById("detFormRaw");
  if (!box) return;

  const form = normalizarForm(formRaw);
  if (!form || typeof form !== "object") {
    box.innerHTML = `<p class="vazio">Sem dados do formulário.</p>`;
    return;
  }

  const entries = Object.entries(form);
  if (!entries.length) {
    box.innerHTML = `<p class="vazio">Sem dados do formulário.</p>`;
    return;
  }

  box.innerHTML = "";
  for (const [pergunta, resposta] of entries) {
    const item = document.createElement("div");
    item.className = "item-detalhe";

    const valor = Array.isArray(resposta)
      ? resposta.join(", ")
      : (resposta && typeof resposta === "object")
        ? JSON.stringify(resposta)
        : String(resposta ?? "");

    item.innerHTML = `
      <p class="item-detalhe__pergunta">${pergunta}</p>
      <p class="item-detalhe__resposta">${valor || "—"}</p>
    `;
    box.appendChild(item);
  }
}

function statusTexto(status){
  if (status === "confirmado") return "Confirmado";
  if (status === "faltou") return "Faltou";
  if (status === "atribuido") return "Atribuído";
  return "Pendente";
}

function statusPill(status){
  const pill = document.getElementById("badgeStatus");
  if (!pill) return;

  const s = status || "pendente";
  pill.textContent = statusTexto(s);

  if (s === "confirmado") {
    pill.style.background = "rgba(22,163,74,.12)";
    pill.style.color = "#16a34a";
  } else if (s === "faltou") {
    pill.style.background = "rgba(239,68,68,.12)";
    pill.style.color = "#ef4444";
  } else if (s === "atribuido") {
    pill.style.background = "rgba(19,127,236,.12)";
    pill.style.color = "#137fec";
  } else {
    pill.style.background = "rgba(245,158,11,.14)";
    pill.style.color = "#b45309";
  }
}

async function atualizarStatus(id, status){
  const { error } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = getQueryParam("id");
  const msgErro = document.getElementById("msgErro");
  const msgOk = document.getElementById("msgOk");

  if (!id) {
    setTexto(msgErro, "Agendamento não informado.");
    mostrar(msgErro);
    return;
  }

  const btnVoltar = document.getElementById("btnVoltar");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", (e) => {
      e.preventDefault();
      history.back();
    });
  }

  try {
    esconder(msgErro);
    esconder(msgOk);

    const ag = await carregarDetalhe(id);

    setTexto(document.getElementById("detAluno"), ag.aluno_nome || "—");
    setTexto(document.getElementById("detWhatsapp"), ag.aluno_whatsapp || "—");
    setTexto(document.getElementById("detData"), formatarDataBR(ag.data_aula));
    setTexto(document.getElementById("detTipo"), ag.tipo_aula || "—");
    setTexto(document.getElementById("detStatus"), statusTexto(ag.status));
    setTexto(document.getElementById("subtitulo"), `${ag.aluno_nome || "Aluno"} — ${formatarDataBR(ag.data_aula)}`);
    statusPill(ag.status);

    const btnWhatsapp = document.getElementById("btnWhatsapp");
    if (btnWhatsapp) {
      const msg = `Olá, ${ag.aluno_nome || ""}! Confirmando sua aula experimental no Crossfit.`;
      btnWhatsapp.href = linkWhatsApp(ag.aluno_whatsapp, msg);
    }

    renderizarFormRaw(ag.form_raw);

    const btnConfirmar = document.getElementById("btnConfirmar");
    const btnFaltou = document.getElementById("btnFaltou");

    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", async () => {
        try {
          await atualizarStatus(id, "confirmado");
          setTexto(document.getElementById("detStatus"), "Confirmado");
          statusPill("confirmado");
          setTexto(msgOk, "Presença confirmada.");
          mostrar(msgOk);
          esconder(msgErro);
        } catch (err) {
          setTexto(msgErro, err?.message || "Erro ao confirmar.");
          mostrar(msgErro);
        }
      });
    }

    if (btnFaltou) {
      btnFaltou.addEventListener("click", async () => {
        try {
          await atualizarStatus(id, "faltou");
          setTexto(document.getElementById("detStatus"), "Faltou");
          statusPill("faltou");
          setTexto(msgOk, "Marcado como faltou.");
          mostrar(msgOk);
          esconder(msgErro);
        } catch (err) {
          setTexto(msgErro, err?.message || "Erro ao marcar falta.");
          mostrar(msgErro);
        }
      });
    }
  } catch (err) {
    setTexto(msgErro, err?.message || "Erro ao carregar agendamento.");
    mostrar(msgErro);
  }
});
