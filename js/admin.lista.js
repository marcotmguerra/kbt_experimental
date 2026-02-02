import { supabase } from "./supabaseCliente.js";
import { formatarDataBR } from "./util.js";

// Variáveis globais para armazenar os dados e permitir filtragem rápida
let todosAgendamentos = [];
let todosProfessores = [];

async function inicializarPainel() {
    // 1. Busca Agendamentos
    const { data: agendamentos, error: errAg } = await supabase
        .from("agendamentos")
        .select("*")
        .order("created_at", { ascending: false });

    // 2. Busca Professores (Coaches)
    const { data: professores, error: errProf } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("role", "professor");

    if (errAg || errProf) {
        console.error("Erro ao carregar dados:", errAg || errProf);
        return;
    }

    todosAgendamentos = agendamentos;
    todosProfessores = professores;

    // Popular o select de professores no filtro
    popularFiltroProfessores(professores);
    
    // Atualizar os cards de estatísticas
    atualizarStats(agendamentos);
    
    // Renderizar a tabela inicial
    filtrarERenderizar();
}

function popularFiltroProfessores(professores) {
    const filtroProf = document.getElementById("filtroProfessor");
    if (!filtroProf) return;
    
    // Mantém a opção "Todos" e adiciona os outros
    filtroProf.innerHTML = '<option value="todos">Todos</option>';
    professores.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nome;
        filtroProf.appendChild(option);
    });
}

function atualizarStats(agendamentos = []) {
    const pendentes = agendamentos.filter(a => a.status === "pendente").length;
    const hojeStr = new Date().toISOString().split('T')[0];
    const inscricoesHoje = agendamentos.filter(a => a.created_at?.startsWith(hojeStr)).length;
    
    // Exemplo de cálculo para o card do meio (Coachs ativos ou aproveitamento)
    const total = agendamentos.length;
    const concluidos = agendamentos.filter(a => a.status === "confirmado").length;
    const taxa = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    if(document.getElementById("statPendentes")) document.getElementById("statPendentes").textContent = pendentes;
    if(document.getElementById("statProfessores")) document.getElementById("statProfessores").textContent = taxa + "%";
    if(document.getElementById("statHoje")) document.getElementById("statHoje").textContent = inscricoesHoje;
}

function filtrarERenderizar() {
    const termoBusca = document.getElementById("busca").value.toLowerCase();
    const statusFiltro = document.getElementById("filtroStatus").value;
    const professorFiltro = document.getElementById("filtroProfessor").value;

    const dadosFiltrados = todosAgendamentos.filter(ag => {
        const matchesBusca = ag.aluno_nome.toLowerCase().includes(termoBusca);
        const matchesStatus = statusFiltro === "todos" || ag.status === statusFiltro;
        const matchesProf = professorFiltro === "todos" || ag.professor_id === professorFiltro;
        
        return matchesBusca && matchesStatus && matchesProf;
    });

    renderizarTabelaAtribuicao(dadosFiltrados, todosProfessores);
}

function renderizarTabelaAtribuicao(agendamentos, professores) {
    const lista = document.getElementById("listaAgendamentos");
    if (!lista) return;

    if (agendamentos.length === 0) {
        lista.innerHTML = '<tr><td colspan="6" class="tabela__vazio">Nenhum agendamento encontrado para os filtros selecionados.</td></tr>';
        return;
    }

    lista.innerHTML = agendamentos.map(ag => `
        <tr>
            <td data-label="ALUNO"><strong>${ag.aluno_nome}</strong></td>
            <td data-label="TIPO">${ag.tipo_aula || 'Experimental'}</td>
            <td data-label="DATA">${formatarDataBR(ag.data_aula)}</td>
            <td data-label="STATUS"><span class="status-pill status-${ag.status}">${ag.status}</span></td>
            <td data-label="COACH">
                <select class="select-prof filtro__select" data-id="${ag.id}">
                    <option value="">Selecionar Coach</option>
                    ${professores.map(p => `
                        <option value="${p.id}" ${ag.professor_id === p.id ? 'selected' : ''}>
                            ${p.nome}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <a href="detalhe.html?id=${ag.id}" class="btn btn--secundario" style="width:100%; justify-content:center;">Ver Ficha</a>
            </td>
        </tr>
    `).join('');
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    inicializarPainel();

    // Filtros em tempo real
    document.getElementById("busca")?.addEventListener("input", filtrarERenderizar);
    document.getElementById("filtroStatus")?.addEventListener("change", filtrarERenderizar);
    document.getElementById("filtroProfessor")?.addEventListener("change", filtrarERenderizar);
    
    // Botão atualizar
    document.getElementById("btnAtualizar")?.addEventListener("click", inicializarPainel);
});