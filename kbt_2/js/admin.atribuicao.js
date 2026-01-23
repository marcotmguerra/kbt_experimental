// /public/js/admin.atribuicao.js
import { supabase } from "./supabaseCliente.js";

async function salvarTudo(){
  const msg = document.getElementById("msgAdmin");
  if (msg) { msg.hidden = true; msg.textContent = ""; }

  const selects = Array.from(document.querySelectorAll(".select-prof"));

  for (const sel of selects) {
    const agendamentoId = sel.dataset.id;
    const professorId = sel.value || null;
    const status = professorId ? "atribuido" : "pendente";

    const { error } = await supabase
      .from("agendamentos")
      .update({ professor_id: professorId, status })
      .eq("id", agendamentoId);

    if (error) {
      if (msg) {
        msg.hidden = false;
        msg.textContent = "Erro ao salvar: " + error.message;
      }
      return;
    }
  }

  if (msg) {
    msg.hidden = false;
    msg.textContent = "Atribuições salvas com sucesso!";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnSalvar = document.getElementById("btnSalvarTudo");
  const btnDescartar = document.getElementById("btnDescartar");

  if (btnSalvar) btnSalvar.addEventListener("click", salvarTudo);
  if (btnDescartar) btnDescartar.addEventListener("click", () => window.location.reload());
});
