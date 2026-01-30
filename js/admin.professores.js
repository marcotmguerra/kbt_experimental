import { supabase } from "./supabaseCliente.js";
import { showToast } from "./util.js";

async function carregarProfessores() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professor')
        .order('nome');

    const lista = document.getElementById("listaProfessores");
    lista.innerHTML = data.map(p => `
        <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${p.id} (ID)</td> 
            <td><span class="pill">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td class="tabela__acao">
                <button class="btn-confirmar" onclick="alert('Funcionalidade de edição via Supabase Auth requer Edge Functions ou Admin SDK')">Editar</button>
            </td>
        </tr>
    `).join('');
}

document.getElementById("btnNovoProfessor")?.addEventListener("click", () => {
    showToast("Para cadastrar, o professor deve se registrar ou você deve criar o usuário no painel do Supabase Auth.", "erro");
});

document.addEventListener("DOMContentLoaded", carregarProfessores);