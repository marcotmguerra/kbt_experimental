import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, showToast } from "./util.js";

// Variáveis globais para busca e exportação
let todosAgendamentos = [];
let todosCoaches = [];

async function inicializar() {
  const lista = document.getElementById("listaAgendamentos");
  if (!lista) return;

  lista.innerHTML = `<tr><td colspan="7" style="text-align:center;">Buscando dados...</td></tr>`;

  try {
    // 1. Busca Agendamentos e Coaches simultaneamente
    const [resAgendamentos, resCoaches] = await Promise.all([
      supabase.from("agendamentos").select("*, profiles(nome)").order("data_aula", { ascending: false }),
      supabase.from("profiles").select("id, nome").eq("role", "professor")
    ]);

    if (resAgendamentos.error) throw resAgendamentos.error;
    if (resCoaches.error) throw resCoaches.error;

    todosAgendamentos = resAgendamentos.data;
    todosCoaches = resCoaches.data;

    // 2. Popular o Select de Coaches
    popularFiltroCoaches(todosCoaches);

    // 3. Definir o mês atual como padrão no select (opcional, mas recomendado)
    const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
    const selectMes = document.getElementById("filtroMes");
    if (selectMes && !selectMes.value) selectMes.value = mesAtual;

    // 4. Renderizar primeira vez
    filtrarERenderizar();

  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar dados", "erro");
    lista.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Erro: ${err.message}</td></tr>`;
  }
}

function popularFiltroCoaches(coaches) {
  const select = document.getElementById("filtroCoach");
  if (!select) return;
  
  select.innerHTML = '<option value="todos">Todos os Coaches</option>';
  coaches.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    select.appendChild(opt);
  });
}

function filtrarERenderizar() {
  const lista = document.getElementById("listaAgendamentos");
  
  // Captura valores dos filtros
  const busca = document.getElementById("buscaAgenda").value.toLowerCase();
  const mes = document.getElementById("filtroMes").value;
  const coachId = document.getElementById("filtroCoach").value;
  const matricula = document.getElementById("filtroMatricula").value;

  const filtrados = todosAgendamentos.filter(item => {
    // Filtro de Busca (Nome)
    const matchesBusca = item.aluno_nome?.toLowerCase().includes(busca);
    
    // Filtro de Mês (compara o mês da data_aula "YYYY-MM-DD")
    const mesAula = item.data_aula.split('-')[1]; 
    const matchesMes = mes === "todos" || mesAula === mes;

    // Filtro de Coach
    const matchesCoach = coachId === "todos" || item.professor_id === coachId;

    // Filtro de Matrícula
    let matchesMatricula = true;
    if (matricula === "sim") matchesMatricula = item.matriculado === true;
    if (matricula === "nao") matchesMatricula = item.matriculado === false;

    return matchesBusca && matchesMes && matchesCoach && matchesMatricula;
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
      <td><span class="status-pill status-${ag.status}">${ag.status ?? 'pendente'}</span></td>
      <td>${ag.matriculado ? '✅ Sim' : '❌ Não'}</td>
      <td><small>${ag.tipo_aula ?? 'Experimental'}</small></td>
      <td class="tabela__acao">
        <a href="detalhe.html?id=${ag.id}" class="icon-btn"><span class="material-symbols-outlined">visibility</span></a>
      </td>
    </tr>
  `).join("");
  
  // Guardar os filtrados para exportação
  window.dadosParaExportar = filtrados;
}

function exportarCSV() {
  const dados = window.dadosParaExportar || [];
  if (dados.length === 0) {
    showToast("Não há dados para exportar", "alerta");
    return;
  }

  // Cabeçalho
  let csv = "Data;Aluno;Coach;Status;Matriculado;Tipo\n";

  // Linhas
  dados.forEach(item => {
    const data = formatarDataBR(item.data_aula);
    const aluno = item.aluno_nome || "";
    const coach = item.profiles?.nome || "N/A";
    const status = item.status || "pendente";
    const matriculado = item.matriculado ? "Sim" : "Nao";
    const tipo = item.tipo_aula || "Experimental";

    csv += `${data};${aluno};${coach};${status};${matriculado};${tipo}\n`;
  });

  // Download do arquivo (com suporte a acentos no Excel via BOM)
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_agendamentos_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", inicializar);

// Ouvintes para filtros
document.getElementById("buscaAgenda")?.addEventListener("input", filtrarERenderizar);
document.getElementById("filtroMes")?.addEventListener("change", filtrarERenderizar);
document.getElementById("filtroCoach")?.addEventListener("change", filtrarERenderizar);
document.getElementById("filtroMatricula")?.addEventListener("change", filtrarERenderizar);

// Ouvinte para exportação
document.getElementById("btnExportar")?.addEventListener("click", exportarCSV);