import { supabase } from "./supabaseCliente.js";
import { formatarDataBR } from "./util.js";

async function inicializarPainel() {
    const { data: agendamentos, error: errAg } = await supabase
        .from("agendamentos")
        .select("*, profiles(nome)")
        .order("created_at", { ascending: false });

    const { data: professores, error: errProf } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("role", "professor");

    if (errAg) return;

    atualizarStats(agendamentos);
    renderizarTabelaAtribuicao(agendamentos, professores);
}

function atualizarStats(agendamentos = []) {
    const confirmados = agendamentos.filter(a => a.status === "confirmado").length;
    const matriculados = agendamentos.filter(a => a.matriculado).length;
    const pendentes = agendamentos.filter(a => a.status === "pendente").length;
    const hoje = new Date().toISOString().split('T')[0];
    const inscricoesHoje = agendamentos.filter(a => a.created_at?.startsWith(hoje)).length;

    document.getElementById("statPendentes").textContent = pendentes;
    document.getElementById("statProfessores").textContent = confirmados > 0 ? Math.round((matriculados/confirmados)*100) + "%" : "0%";
    document.getElementById("statHoje").textContent = inscricoesHoje;
}

function renderizarTabelaAtribuicao(agendamentos, professores) {
    const lista = document.getElementById("listaAgendamentos");
    if (!lista) return;

    lista.innerHTML = agendamentos.map(ag => `
        <tr>
            <td><strong>${ag.aluno_nome}</strong></td>
            <td>${ag.tipo_aula}</td>
            <td>${formatarDataBR(ag.data_aula)}</td>
            <td><span class="status-pill status-${ag.status}">${ag.status}</span></td>
            <td>
                <select class="select-prof filtro__select" data-id="${ag.id}">
                    <option value="">Selecionar Coach</option>
                    ${professores.map(p => `<option value="${p.id}" ${ag.professor_id === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
                </select>
            </td>
            <td>
                <a href="detalhe.html?id=${ag.id}" class="btn btn--secundario">Ver</a>
            </td>
        </tr>
    `).join('');
}

document.addEventListener("DOMContentLoaded", inicializarPainel);
document.getElementById("btnAtualizar")?.addEventListener("click", inicializarPainel);