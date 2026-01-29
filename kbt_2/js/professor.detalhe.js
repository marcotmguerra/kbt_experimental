// /public/js/professor.detalhe.js
import { supabase } from "./supabaseCliente.js";
import { showToast, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

async function carregar() {
  const id = getQueryParam("id");
  const { data: ag, error } = await supabase.from("agendamentos").select("*, profiles(nome)").eq("id", id).single();
  if (error) return showToast("Erro ao carregar", "erro");

  // Preenche dados básicos
  document.getElementById("detAluno").textContent = ag.aluno_nome;
  document.getElementById("detData").textContent = formatarDataBR(ag.data_aula);
  document.getElementById("btnWhatsapp").href = linkWhatsApp(ag.aluno_whatsapp, `Olá ${ag.aluno_nome}!`);

  // Lógica de aparecer área de Admin (Matrícula)
  const perfil = window.__perfil; // Definido no guardas.js
  if (perfil && perfil.role === 'admin') {
    const secao = document.getElementById("secaoAdminVenda");
    secao.hidden = false;
    const check = document.getElementById("checkMatriculado");
    check.checked = ag.matriculado;
    check.onchange = async () => {
      await supabase.from("agendamentos").update({ matriculado: check.checked }).eq("id", id);
      showToast(check.checked ? "Venda registrada! 💸" : "Matrícula removida");
    };
  }

  // Botões de Presença
  document.getElementById("btnConfirmar").onclick = async () => {
    await supabase.from("agendamentos").update({ status: 'confirmado' }).eq("id", id);
    showToast("Presença confirmada!");
  };

  document.getElementById("btnFaltou").onclick = async () => {
    await supabase.from("agendamentos").update({ status: 'faltou' }).eq("id", id);
    showToast("Falta registrada", "erro");
  };
}

document.addEventListener("DOMContentLoaded", carregar);