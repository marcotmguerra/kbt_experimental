import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, showToast } from "./util.js";

async function carregarDados() {
  const lista = document.getElementById("listaAgendamentos");
  if (!lista) return;

  lista.innerHTML = `<tr><td colspan="7" style="text-align:center;">Buscando dados...</td></tr>`;

  try {
    // Busca agendamentos E o nome do professor vinculado
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*, profiles(nome)") 
      .order("data_aula", { ascending: true });

    if (error) throw error;

    const filtroMes = document.getElementById("filtroMes")?.value || "todos";

    const filtrados = data.filter(item => {
      if (filtroMes === "todos") return true;
      const d = new Date(item.data_aula);
      return (d.getMonth() + 1) == Number(filtroMes);
    });

    if (filtrados.length === 0) {
      lista.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    lista.innerHTML = filtrados.map(ag => `
      <tr>
        <td>${formatarDataBR(ag.data_aula)}</td>
        <td><strong>${ag.aluno_nome ?? 'Sem Nome'}</strong></td>
        <td>${ag.profiles?.nome ?? '<span style="color:gray">Não atribuído</span>'}</td>
        <td><span class="status-pill">${ag.status ?? 'pendente'}</span></td>
        <td>${ag.matriculado ? '✅ Sim' : '❌ Não'}</td>
        <td><small>${ag.tipo_aula ?? 'Experimental'}</small></td>
        <td class="tabela__acao">
          <a href="detalhe.html?id=${ag.id}" class="icon-btn"><span class="material-symbols-outlined">visibility</span></a>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    showToast("Erro ao carregar agenda", "erro");
    lista.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Erro: ${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", carregarDados);
document.getElementById("filtroMes")?.addEventListener("change", carregarDados);