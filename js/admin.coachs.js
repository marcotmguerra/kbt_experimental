import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

const lista = document.getElementById("listaCoaches");

// FUNÇÃO: Listar Coaches (Pendentes e Ativos)
async function carregarCoaches() {
  if (!lista) return;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro:", error);
    return;
  }

  document.getElementById("totalCoaches").textContent = data.length;

  lista.innerHTML = data.map(p => `
    <tr>
      <td>
        <strong>${p.nome}</strong><br>
        <small style="color: #666;">${p.email || ''}</small>
      </td>
      <td>
        <!-- Pill de Status -->
        <span class="pill" style="background: ${p.ativo ? '#dcfce7' : '#fee2e2'}; color: ${p.ativo ? '#166534' : '#991b1b'}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block; margin-bottom: 8px;">
          ${p.ativo ? 'ATIVO' : 'PENDENTE'}
        </span>
        
        <br>

        <!-- ENUM / SELECT DE CARGO -->
        <select onchange="window._mudarRole('${p.id}', this.value)" 
  style="padding: 2px 4px; font-size: 11px; height: 24px; width: 110px; border-radius: 4px; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer;">
  <option value="professor" ${p.role === 'professor' ? 'selected' : ''}>Professor</option>
  <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>Admin</option>
</select>
      </td>
      <td class="tabela__acao">
         ${!p.ativo ? 
           `<button onclick="window._autorizarCoach('${p.id}')" style="color:var(--ok); background:none; border:none; cursor:pointer; font-weight:800; margin-right:15px; font-size: 13px;">Autorizar</button>` 
           : ''
         }
         <button onclick="window._deletarCoach('${p.id}')" style="color:var(--erro); background:none; border:none; cursor:pointer; font-size: 13px;">Remover</button>
      </td>
    </tr>
  `).join('');
}

// FUNÇÃO PARA MUDAR O CARGO (ROLE)
window._mudarRole = async (id, novaRole) => {
    showToast("Atualizando cargo...");
    
    const { error } = await supabase
        .from("profiles")
        .update({ role: novaRole })
        .eq("id", id);

    if (error) {
        showToast("Erro ao mudar cargo: " + error.message, "erro");
    } else {
        showToast(`Cargo alterado para ${novaRole.toUpperCase()}`);
        carregarCoaches(); // Recarrega para garantir que a UI está certa
    }
};

// ... mantenha as funções _autorizarCoach e _deletarCoach que já temos ...

// NOVA FUNÇÃO: Alternar entre Admin e Professor
window._alternarCargo = async (id, roleAtual) => {
    const novoCargo = roleAtual === 'admin' ? 'professor' : 'admin';
    const confirmacao = confirm(`Deseja alterar o cargo deste usuário para ${novoCargo.toUpperCase()}?`);
    
    if (!confirmacao) return;

    const { error } = await supabase
        .from("profiles")
        .update({ role: novoCargo })
        .eq("id", id);

    if (error) {
        alert("Erro ao mudar cargo: " + error.message);
    } else {
        showToast("Cargo atualizado!");
        carregarCoaches();
    }
};

// FUNÇÃO: Autorizar o acesso
window._autorizarCoach = async (id) => {
    if (!confirm("Deseja aprovar este professor? Ele poderá acessar o sistema imediatamente.")) return;
    
    showToast("Autorizando...");
    const { error } = await supabase
        .from("profiles")
        .update({ ativo: true })
        .eq("id", id);

    if (error) {
        showToast("Erro: " + error.message, "erro");
    } else {
        showToast("Professor aprovado!");
        carregarCoaches();
    }
};

// FUNÇÃO: Remover
window._deletarCoach = async (id) => {
    if (!confirm("Remover permanentemente este registro?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    carregarCoaches();
};

document.addEventListener("DOMContentLoaded", carregarCoaches);