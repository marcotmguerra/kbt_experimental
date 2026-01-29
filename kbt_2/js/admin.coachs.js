import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

const modal = document.getElementById("modalCoach");
const btnAbrir = document.getElementById("btnAbrirModal");
const btnFechar = document.getElementById("btnFecharModal");
const form = document.getElementById("formNovoCoach");
const lista = document.getElementById("listaCoaches");

// Abrir/Fechar Modal
btnAbrir?.addEventListener("click", () => modal.classList.add("modal--aberto"));
btnFechar?.addEventListener("click", () => modal.classList.remove("modal--aberto"));

// FUNÇÃO: Listar Coaches que já existem no banco
async function carregarCoaches() {
  if (!lista) return;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "professor")
    .order("nome");

  if (error) {
    console.error("Erro ao carregar:", error);
    return;
  }

  document.getElementById("totalCoaches").textContent = data.length;

  lista.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.nome}</strong></td>
      <td><span class="pill">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="tabela__acao">
         <button class="btn-excluir" onclick="window._deletarCoach('${p.id}')" style="color:red; background:none; border:none; cursor:pointer;">Remover</button>
      </td>
    </tr>
  `).join('');
}

// FUNÇÃO: Enviar Link Mágico (Convite)
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("emailCoach").value;

  showToast("Enviando convite...");

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      // O link levará o professor para o painel dele
      emailRedirectTo: window.location.origin + '/paginas/professor.html',
    },
  });

  if (error) {
    showToast("Erro ao enviar: " + error.message, "erro");
  } else {
    showToast("E-mail de acesso enviado!");
    modal.classList.remove("modal--aberto");
    form.reset();
  }
});

// Tornar a exclusão disponível
window._deletarCoach = async (id) => {
    if (!confirm("Remover este professor?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    carregarCoaches();
};

document.addEventListener("DOMContentLoaded", carregarCoaches);