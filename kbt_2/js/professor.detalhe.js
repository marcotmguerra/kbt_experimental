// /public/js/professor.detalhe.js
import { supabase } from "./supabaseCliente.js";
import { showToast, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

async function carregar() {
  const id = getQueryParam("id");
  if (!id) return (window.location.href = "login.html");

  const { data: ag, error } = await supabase
    .from("agendamentos")
    .select("*, profiles(nome)")
    .eq("id", id)
    .single();

  if (error || !ag) return showToast("Erro ao carregar detalhes", "erro");

  // 1. Preenche Dados Básicos
  document.getElementById("detAluno").textContent = ag.aluno_nome;
  document.getElementById("detData").textContent = formatarDataBR(ag.data_aula);
  document.getElementById("detTipo").textContent = ag.tipo_aula || "Experimental";
  document.getElementById("detWhatsapp").textContent = ag.aluno_whatsapp || "Não informado";
  document.getElementById("detStatus").textContent = ag.status?.toUpperCase() || "PENDENTE";
  document.getElementById("badgeStatus").textContent = ag.status || "pendente";
  document.getElementById("badgeStatus").className = `status-pill status-${ag.status}`;

  // 2. Configura WhatsApp
  const btnZap = document.getElementById("btnWhatsapp");
  btnZap.href = linkWhatsApp(ag.aluno_whatsapp, `Olá ${ag.aluno_nome}, aqui é da Kabuto! Confirmado sua aula dia ${formatarDataBR(ag.data_aula)}?`);

  // 3. Processa Informações do Forms (form_raw)
  const containerForms = document.getElementById("detFormRaw");
  if (ag.form_raw) {
    try {
      const dados = typeof ag.form_raw === 'string' ? JSON.parse(ag.form_raw) : ag.form_raw;
      containerForms.innerHTML = Object.entries(dados)
        .map(([chave, valor]) => `
          <div class="detalhe-item" style="margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            <strong style="display:block; font-size: 12px; color: #666; text-transform: uppercase;">${chave.replace(/_/g, ' ')}</strong>
            <span style="font-size: 16px; color: #333;">${valor || '—'}</span>
          </div>
        `).join('');
    } catch (e) {
      containerForms.innerHTML = `<p class="vazio">Erro ao processar dados do formulário.</p>`;
    }
  } else {
    containerForms.innerHTML = `<p class="vazio">Nenhuma informação adicional disponível.</p>`;
  }

  // 4. Lógica de Admin (Matrícula)
  // O window.__perfil é definido de forma assíncrona no guardas.js
  // Vamos verificar em um pequeno intervalo para garantir que o objeto existe
  const checarPerfil = setInterval(() => {
    const perfil = window.__perfil;
    if (perfil) {
      if (perfil.role === 'admin') {
        const secao = document.getElementById("secaoAdminVenda");
        const check = document.getElementById("checkMatriculado");
        if (secao) secao.hidden = false;
        if (check) {
          check.checked = ag.matriculado;
          check.onchange = async () => {
            const { error: errUpd } = await supabase.from("agendamentos").update({ matriculado: check.checked }).eq("id", id);
            if (!errUpd) showToast(check.checked ? "Venda registrada! 💸" : "Matrícula removida");
          };
        }
      }
      clearInterval(checarPerfil);
    }
  }, 100);

  // 5. Botões de Presença
  document.getElementById("btnConfirmar").onclick = async () => {
    const { error } = await supabase.from("agendamentos").update({ status: 'confirmado' }).eq("id", id);
    if (!error) {
        showToast("Presença confirmada!");
        location.reload(); // Recarrega para atualizar badge e status
    }
  };

  document.getElementById("btnFaltou").onclick = async () => {
    const { error } = await supabase.from("agendamentos").update({ status: 'faltou' }).eq("id", id);
    if (!error) {
        showToast("Falta registrada", "erro");
        location.reload();
    }
  };
}

document.addEventListener("DOMContentLoaded", carregar);