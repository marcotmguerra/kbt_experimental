// /public/js/professor.detalhe.js
import { supabase } from "./supabaseCliente.js";
import { showToast, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

async function carregar() {
  const id = getQueryParam("id");
  if (!id) return;

  // 1. Busca dados da aula
  const { data: ag, error } = await supabase.from("agendamentos").select("*").eq("id", id).single();
  if (error || !ag) return showToast("Erro ao carregar detalhes", "erro");

  // 2. Preenchimento básico
  document.getElementById("detAluno").textContent = ag.aluno_nome;
  document.getElementById("detData").textContent = formatarDataBR(ag.data_aula);
  document.getElementById("detTipo").textContent = ag.tipo_aula || "Experimental";
  document.getElementById("detWhatsapp").textContent = ag.aluno_whatsapp || "—";
  document.getElementById("detStatus").textContent = (ag.status || "pendente").toUpperCase();
  document.getElementById("badgeStatus").className = `status-pill status-${ag.status}`;
  document.getElementById("badgeStatus").textContent = ag.status || "pendente";
  document.getElementById("btnWhatsapp").href = linkWhatsApp(ag.aluno_whatsapp);

  // 3. Renderiza Form_raw
  const containerForms = document.getElementById("detFormRaw");
  if (ag.form_raw) {
    const dados = typeof ag.form_raw === 'string' ? JSON.parse(ag.form_raw) : ag.form_raw;
    containerForms.innerHTML = Object.entries(dados).map(([k, v]) => `
      <div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
        <small style="color:gray; text-transform:uppercase; font-weight:bold;">${k.replace(/_/g, ' ')}</small><br>
        <span>${v || '—'}</span>
      </div>`).join('');
  }

  // 4. VERIFICAÇÃO DE CARGO EM TEMPO REAL
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  
  if (perfil.role === 'admin') {
    // VISÃO ADMIN
    document.getElementById("containerAdminAcoes").style.display = "flex";
    document.getElementById("secaoAdminVenda").style.display = "block";
    document.getElementById("containerFeedbackAdmin").style.display = "block";
    document.getElementById("containerFeedbackCoach").style.display = "none";
    
    if (ag.feedback_coach) document.getElementById("pFeedbackTexto").textContent = ag.feedback_coach;

    // Ações do Admin
    const checkMatriculado = document.getElementById("checkMatriculado");
    checkMatriculado.checked = ag.matriculado;
    checkMatriculado.onchange = () => updateField(id, { matriculado: checkMatriculado.checked });

    const checkRecepcao = document.getElementById("checkRecepcao");
    checkRecepcao.checked = ag.levou_recepcao;
    checkRecepcao.onchange = () => updateField(id, { levou_recepcao: checkRecepcao.checked });

    document.getElementById("btnConfirmar").onclick = () => updateField(id, { status: 'confirmado' }, true);
    document.getElementById("btnFaltou").onclick = () => updateField(id, { status: 'faltou' }, true);

  } else {
    // VISÃO PROFESSOR (COACH)
    document.getElementById("containerAdminAcoes").style.display = "none";
    document.getElementById("secaoAdminVenda").style.display = "none";
    document.getElementById("containerFeedbackAdmin").style.display = "none";
    document.getElementById("containerFeedbackCoach").style.display = "block";

    const txtFeedback = document.getElementById("txtFeedbackCoach");
    txtFeedback.value = ag.feedback_coach || "";

    document.getElementById("btnSalvarFeedback").onclick = async () => {
      await updateField(id, { feedback_coach: txtFeedback.value });
      showToast("Relatório salvo com sucesso!");
    };
  }
}

async function updateField(id, obj, reload = false) {
  const { error } = await supabase.from("agendamentos").update(obj).eq("id", id);
  if (!error) {
    if (reload) location.reload(); else showToast("Dados salvos!");
  } else {
    showToast("Erro ao salvar", "erro");
  }
}

document.addEventListener("DOMContentLoaded", carregar);