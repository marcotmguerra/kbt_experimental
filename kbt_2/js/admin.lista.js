// /public/js/admin.lista.js
import { supabase } from "./supabaseCliente.js";
import { formatarDataBR } from "./util.js";

let cacheAgendamentos = [];
let cacheProfessores = [];

async function carregarProfessores(){
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("role", "professor")
    .order("nome");

  if (error) throw error;
  cacheProfessores = data || [];

  const filtro = document.getElementById("filtroProfessor");
  if (filtro) {
    filtro.innerHTML =
      `<option value="todos">Todos</option>` +
      cacheProfessores.map(p => `<option value="${p.id}">${p.nome}</option>`).join("");
  }
}

async function carregarAgendamentos(){
  const tbody = document.getElementById("tabelaAgendamentosAdmin");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Carregando…</td></tr>`;

  const { data, error } = await supabase
    .from("agendamentos")
    .select(`
      id, aluno_nome, aluno_whatsapp, data_aula, tipo_aula, status, professor_id, created_at,
      profiles:professor_id ( nome )
    `)
    .order("data_aula", { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Erro ao carregar.</td></tr>`;
    return;
  }

  cacheAgendamentos = (data || []).map((ag) => ({
    ...ag,
    professor_nome: ag.profiles?.nome || null,
  }));

  atualizarStats();
  renderizarTabela();
}

function aplicarFiltros(lista){
  const status = document.getElementById("filtroStatus")?.value || "todos";
  const prof = document.getElementById("filtroProfessor")?.value || "todos";
  const busca = (document.getElementById("busca")?.value || "").toLowerCase().trim();

  return lista.filter((ag) => {
    if (status !== "todos" && ag.status !== status) return false;
    if (prof !== "todos" && ag.professor_id !== prof) return false;
    if (busca && !(ag.aluno_nome || "").toLowerCase().includes(busca)) return false;
    return true;
  });
}

function badgeStatus(status){
  const s = status || "pendente";
  if (s === "confirmado") return `<span class="badge badge--ok">Confirmado</span>`;
  if (s === "faltou") return `<span class="badge badge--erro">Faltou</span>`;
  if (s === "atribuido") return `<span class="badge badge--azul">Atribuído</span>`;
  return `<span class="badge badge--laranja">Pendente</span>`;
}

function selectProfessorHTML(ag){
  const options = [`<option value="">Selecionar…</option>`].concat(
    cacheProfessores.map(p => {
      const sel = p.id === ag.professor_id ? "selected" : "";
      return `<option value="${p.id}" ${sel}>${p.nome}</option>`;
    })
  ).join("");

  return `<select class="select-prof" data-id="${ag.id}">${options}</select>`;
}

function linhaHTML(ag){
  return `
    <tr data-id="${ag.id}">
      <td>
        <div class="aluno">
          <span class="aluno__nome">${ag.aluno_nome || "Sem nome"}</span>
          <span class="aluno__sub">${ag.aluno_whatsapp || ""}</span>
        </div>
      </td>
      <td><span class="pill">${ag.tipo_aula || "—"}</span></td>
      <td>${formatarDataBR(ag.data_aula)}</td>
      <td>${badgeStatus(ag.status)}</td>
      <td>${selectProfessorHTML(ag)}</td>
      <td class="tabela__acao">
        <a class="btn-confirmar" href="../paginas/detalhe.html?id=${ag.id}">Ver</a>
      </td>
    </tr>
  `;
}

function renderizarTabela(){
  const tbody = document.getElementById("tabelaAgendamentosAdmin");
  if (!tbody) return;

  const lista = aplicarFiltros(cacheAgendamentos);

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Nenhum agendamento encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(linhaHTML).join("");
}

function atualizarStats(){
  const pendentes = cacheAgendamentos.filter(a => !a.professor_id).length;
  const professores = cacheProfessores.length;

  const hoje = new Date();
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0,0,0);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23,59,59);

  const hojeCount = cacheAgendamentos.filter(a => {
    const dt = new Date(a.created_at || a.data_aula);
    return dt >= ini && dt <= fim;
  }).length;

  const elPend = document.getElementById("statPendentes");
  const elProf = document.getElementById("statProfessores");
  const elHoje = document.getElementById("statHoje");
  if (elPend) elPend.textContent = String(pendentes);
  if (elProf) elProf.textContent = String(professores);
  if (elHoje) elHoje.textContent = String(hojeCount);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("tabelaAgendamentosAdmin")) return;

  await carregarProfessores();
  await carregarAgendamentos();

  ["filtroStatus", "filtroProfessor", "busca"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderizarTabela);
    el.addEventListener("change", renderizarTabela);
  });

  const btnAtualizar = document.getElementById("btnAtualizar");
  if (btnAtualizar) btnAtualizar.addEventListener("click", carregarAgendamentos);
});
