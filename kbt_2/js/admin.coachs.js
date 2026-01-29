import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

const listaCoaches = document.getElementById("listaCoaches");
const modal = document.getElementById("modalCoach");

async function carregarCoaches() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "professor")
    .order("nome");

  if (error) {
    showToast("Erro ao carregar coaches", "erro");
    return;
  }

  document.getElementById("totalCoaches").textContent = data.length;

  listaCoaches.innerHTML = data.map(coach => `
    <tr>
      <td>
        <div class="aluno">
          <span class="aluno__nome">${coach.nome}</span>
          <span class="aluno__sub">${coach.id}</span>
        </div>
      </td>
      <td><span class="badge badge--ok">Ativo</span></td>
      <td class="tabela__acao">
        <button class="btn-confirmar" onclick="alert('Funcionalidade de deletar requer permissões de Admin no Supabase Auth.')">Excluir</button>
      </td>
    </tr>
  `).join("");
}

// Lógica do Modal
document.getElementById("btnAbrirModal").addEventListener("click", () => modal.classList.add("modal--aberto"));
document.getElementById("btnFecharModal").addEventListener("click", () => modal.classList.remove("modal--aberto"));

// Salvar Novo Coach (Apenas Perfil)
document.getElementById("formNovoCoach").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nomeCoach").value;
  const email = document.getElementById("emailCoach").value;

  showToast("Para segurança, crie o usuário no menu 'Auth' do Supabase primeiro.", "erro");
  modal.classList.remove("modal--aberto");
});

document.addEventListener("DOMContentLoaded", carregarCoaches);