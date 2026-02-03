import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, showToast } from "./util.js";

let todosAgendamentos = [];
let todosCoaches = [];
let dadosFiltradosParaExportar = [];

async function inicializar() {
  const lista = document.getElementById("listaAgendamentos");
  if (!lista) return;

  lista.innerHTML = `<tr><td colspan="7" style="text-align:center;">Carregando dados...</td></tr>`;

  try {
    const [resAgendamentos, resCoaches] = await Promise.all([
      supabase.from("agendamentos").select("*, profiles(nome)").order("data_aula", { ascending: false }),
      supabase.from("profiles").select("id, nome").eq("role", "professor")
    ]);

    if (resAgendamentos.error) throw resAgendamentos.error;
    if (resCoaches.error) throw resCoaches.error;

    todosAgendamentos = resAgendamentos.data;
    todosCoaches = resCoaches.data;

    popularFiltroCoaches(todosCoaches);
    
    const mesAtualNum = String(new Date().getMonth() + 1).padStart(2, '0');
    const selectMes = document.getElementById("filtroMes");
    if (selectMes) selectMes.value = mesAtualNum;

    atualizarCardsEstatisticos(todosAgendamentos);
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

function atualizarCardsEstatisticos(agendamentos) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diaSemana = hoje.getDay(); 
  const diffParaSegunda = hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1);
  
  const segundaFeira = new Date(hoje);
  segundaFeira.setDate(diffParaSegunda);
  segundaFeira.setHours(0, 0, 0, 0);

  const domingo = new Date(segundaFeira);
  domingo.setDate(segundaFeira.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  const segundaPassada = new Date(segundaFeira);
  segundaPassada.setDate(segundaFeira.getDate() - 7);
  
  const domingoPassado = new Date(domingo);
  domingoPassado.setDate(domingo.getDate() - 7);

  const converterData = (dataStr) => {
    const d = new Date(dataStr);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d;
  };

  const totalSemanaAtual = agendamentos.filter(ag => {
    const d = converterData(ag.data_aula);
    return d >= segundaFeira && d <= domingo;
  }).length;

  const totalSemanaPassada = agendamentos.filter(ag => {
    const d = converterData(ag.data_aula);
    return d >= segundaPassada && d <= domingoPassado;
  }).length;

  const totalMes = agendamentos.filter(ag => {
    const d = converterData(ag.data_aula);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  document.getElementById("statSemana").textContent = totalSemanaAtual;
  document.getElementById("statMesTotal").textContent = totalMes;
  document.getElementById("labelMesNome").textContent = nomesMeses[hoje.getMonth()];

  const diferenca = totalSemanaAtual - totalSemanaPassada;
  const elDiferenca = document.getElementById("statDiferenca");
  const chipDiferenca = document.getElementById("chipDiferenca");

  elDiferenca.textContent = (diferenca > 0 ? "+" : "") + diferenca;
  
  if (diferenca > 0) {
    chipDiferenca.className = "stat-card__chip stat-card__chip--ok";
    chipDiferenca.textContent = "Melhor que semana passada";
  } else if (diferenca < 0) {
    chipDiferenca.className = "stat-card__chip stat-card__chip--alerta";
    chipDiferenca.textContent = "Menos que semana passada";
  } else {
    chipDiferenca.className = "stat-card__chip";
    chipDiferenca.textContent = "Igual semana passada";
  }
}

function filtrarERenderizar() {
  const lista = document.getElementById("listaAgendamentos");
  const busca = document.getElementById("buscaAgenda").value.toLowerCase();
  const mes = document.getElementById("filtroMes").value;
  const coachId = document.getElementById("filtroCoach").value;
  const matricula = document.getElementById("filtroMatricula").value;

  dadosFiltradosParaExportar = todosAgendamentos.filter(item => {
    const matchesBusca = item.aluno_nome?.toLowerCase().includes(busca);
    const mesAula = item.data_aula.split('-')[1]; 
    const matchesMes = mes === "todos" || mesAula === mes;
    const matchesCoach = coachId === "todos" || item.professor_id === coachId;
    
    let matchesMatricula = true;
    if (matricula === "sim") matchesMatricula = item.matriculado === true;
    if (matricula === "nao") matchesMatricula = item.matriculado === false;

    return matchesBusca && matchesMes && matchesCoach && matchesMatricula;
  });

  if (dadosFiltradosParaExportar.length === 0) {
    lista.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  lista.innerHTML = dadosFiltradosParaExportar.map(ag => `
    <tr>
      <td>${formatarDataBR(ag.data_aula)}</td>
      <td>
        <div class="aluno">
            <strong>${ag.aluno_nome ?? 'Sem Nome'}</strong>
            ${ag.responsavel_nome ? `<br><small style="color:var(--primario); font-weight:800; font-size:10px;">RESP: ${ag.responsavel_nome}</small>` : ''}
        </div>
      </td>
      <td>${ag.profiles?.nome ?? '<span style="color:gray">Não atribuído</span>'}</td>
      <td><span class="status-pill status-${ag.status}">${ag.status ?? 'pendente'}</span></td>
      <td>${ag.matriculado ? '✅ Sim' : '❌ Não'}</td>
      <td><small>${ag.tipo_aula ?? 'Experimental'}</small></td>
      <td class="tabela__acao">
        <a href="detalhe.html?id=${ag.id}" class="icon-btn"><span class="material-symbols-outlined">visibility</span></a>
      </td>
    </tr>
  `).join("");
}

function exportarCSV() {
  if (dadosFiltradosParaExportar.length === 0) {
    showToast("Não há dados para exportar", "alerta");
    return;
  }

  let csv = "Data;Aluno;Responsavel;Coach;Status;Matriculado;Tipo\n";
  dadosFiltradosParaExportar.forEach(item => {
    csv += `${formatarDataBR(item.data_aula)};${item.aluno_nome || ""};${item.responsavel_nome || ""};${item.profiles?.nome || "N/A"};${item.status || "pendente"};${item.matriculado ? "Sim" : "Nao"};${item.tipo_aula || "Experimental"}\n`;
  });

  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_agendamentos.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener("DOMContentLoaded", inicializar);
document.getElementById("buscaAgenda")?.addEventListener("input", filtrarERenderizar);
document.getElementById("filtroMes")?.addEventListener("change", filtrarERenderizar);
document.getElementById("filtroCoach")?.addEventListener("change", filtrarERenderizar);
document.getElementById("filtroMatricula")?.addEventListener("change", filtrarERenderizar);
document.getElementById("btnExportar")?.addEventListener("click", exportarCSV);