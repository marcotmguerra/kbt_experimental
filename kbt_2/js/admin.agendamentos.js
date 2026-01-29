import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, showToast } from "./util.js";

async function carregarDados() {
  const lista = document.getElementById("listaAgendamentos");
  if (!lista) return;

  // 1. Mensagem visual de carregando
  lista.innerHTML = `<tr><td colspan="5" style="text-align:center;">Buscando dados no servidor...</td></tr>`;

  try {
    // 2. Busca os dados
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data_aula", { ascending: true });

    // 3. Verifica se o Supabase retornou erro
    if (error) throw error; 

    // 4. Verifica se vieram dados
    if (!data || data.length === 0) {
      lista.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhum agendamento encontrado no banco de dados.</td></tr>`;
      return;
    }

    // 5. Filtro de Mês
    const filtroMes = document.getElementById("filtroMes")?.value || "todos";
    const filtrados = data.filter(item => {
      if (filtroMes === "todos") return true;
      const mesAula = new Date(item.data_aula).getMonth() + 1;
      return mesAula == parseInt(filtroMes);
    });

    // 6. Renderiza os dados
    lista.innerHTML = filtrados.map(ag => `
      <tr>
        <td><strong>${ag.aluno_nome || 'Sem Nome'}</strong></td>
        <td>${formatarDataBR(ag.data_aula)}</td>
        <td>${ag.tipo_aula || 'Experimental'}</td>
        <td><span class="status-pill">${ag.status || 'pendente'}</span></td>
        <td>${ag.matriculado ? '✅' : '❌'}</td>
      </tr>
    `).join('');

  } catch (err) {
    // 7. EXIBE O ERRO NA TELA CASO ALGO DÊ ERRADO
    console.error("Erro detalhado:", err);
    
    // Mostra um aviso flutuante
    showToast("Falha ao conectar com o banco de dados", "erro");
    
    // Escreve o erro dentro da tabela para o admin ver
    lista.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:#ef4444; padding:20px; background:#fee2e2;">
          <span class="material-symbols-outlined" style="vertical-align:middle">error</span>
          Erro ao carregar agendamentos: ${err.message || 'Erro desconhecido'}
        </td>
      </tr>
    `;
  }
}

document.addEventListener("DOMContentLoaded", carregarDados);
document.getElementById("filtroMes")?.addEventListener("change", carregarDados);