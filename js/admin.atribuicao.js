// /public/js/admin.atribuicao.js
import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

async function salvarTudo() {
  const btnSalvar = document.getElementById("btnSalvarTudo");
  if (!btnSalvar) return;

  // Salva o conteúdo original do botão (ícone + texto)
  const conteudoOriginal = btnSalvar.innerHTML;
  
  try {
    // Feedback visual: desativa o botão enquanto salva
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = "Salvando...";

    const selects = Array.from(document.querySelectorAll(".select-prof"));
    let houveErro = false;

    for (const sel of selects) {
      const agendamentoId = sel.dataset.id;
      const professorId = sel.value || null;
      
      // Lógica de status: se tem professor é 'atribuido', se não é 'pendente'
      // Nota: Buscamos o status atual na linha para não sobrescrever 'confirmado' ou 'faltou'
      const statusAtual = sel.closest('tr').querySelector('.status-pill').textContent.trim();
      let novoStatus = statusAtual;

      if (statusAtual === "pendente" || statusAtual === "atribuido") {
        novoStatus = professorId ? "atribuido" : "pendente";
      }

      const { error } = await supabase
        .from("agendamentos")
        .update({ professor_id: professorId, status: novoStatus })
        .eq("id", agendamentoId);

      if (error) {
        houveErro = true;
        console.error("Erro ao salvar ID:", agendamentoId, error.message);
      }
    }

    if (!houveErro) {
      showToast("Atribuições salvas com sucesso!", "sucesso");
    } else {
      showToast("Erro ao salvar algumas atribuições.", "erro");
    }

  } catch (err) {
    showToast("Erro de conexão.", "erro");
  } finally {
    // Restaura o botão ao estado original
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = conteudoOriginal;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnSalvar = document.getElementById("btnSalvarTudo");
  if (btnSalvar) btnSalvar.addEventListener("click", salvarTudo);
});