// /public/js/admin.coaches.js
import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

async function listarCoaches() {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "professor").order("nome");
  if (error) return showToast("Erro ao carregar coaches", "erro");

  document.getElementById("totalCoaches").textContent = data.length;
  const lista = document.getElementById("listaCoaches");
  lista.innerHTML = data.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td><span class="badge ${c.ativo ? 'badge--ok' : 'badge--erro'}">${c.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="tabela__acao">
        <button class="btn-confirmar" style="color:#ef4444" onclick="window._removerCoach('${c.id}')">Remover</button>
      </td>
    </tr>
  `).join("");
}

document.getElementById("formNovoCoach")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nomeCoach").value;
  // Nota: No Supabase Client, você não cria o USER, apenas o PROFILE aqui para teste.
  // O ideal é criar o User no menu AUTH do Supabase.
  const { error } = await supabase.from("profiles").insert([{ nome, role: 'professor' }]);
  
  if (error) showToast("Erro: Crie o usuário no menu AUTH do Supabase primeiro", "erro");
  else {
    showToast("Perfil de Coach criado!");
    document.getElementById("modalCoach").classList.remove("modal--aberto");
    listarCoaches();
  }
});

window._removerCoach = async (id) => {
  if (confirm("Remover este coach?")) {
    await supabase.from("profiles").delete().eq("id", id);
    listarCoaches();
  }
};

document.addEventListener("DOMContentLoaded", listarCoaches);