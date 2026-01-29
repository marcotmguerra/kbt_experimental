import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, showToast } from "./util.js";

let cacheAgenda = [];

async function carregarDados() {
  const mesSelecionado = document.getElementById("filtroMes").value;
  const anoAtual = new Date().getFullYear();

  // Filtro de data para o Supabase (início e fim do mês)
  const inicioMes = `${anoAtual}-${mesSelecionado}-01T00:00:00`;
  const fimMes = `${anoAtual}-${mesSelecionado}-31T23:59:59`;

  const { data, error } = await supabase
    .from("agendamentos")
    .select("*, profiles(nome)")
    .gte("data_aula", inicioMes)
    .lte("data_aula", fimMes)
    .order("data_aula", { ascending: true });

  if (error) {
    showToast("Erro ao carregar agenda", "erro");
    return;
  }

  cacheAgenda = data;
  renderizarAgenda();
}

async function carregarCoaches() {
    const { data } = await supabase.from("profiles").select("id, nome").eq("role", "professor");
    const select = document.getElementById("filtroCoach");
    if (data) {
        data.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.nome;
            select.appendChild(opt);
        });
    }
}

function extrairFeedback(formRaw) {
    if (!formRaw) return "—";
    // Tenta pegar perguntas comuns de feedback
    const chaves = Object.keys(formRaw);
    const perguntaInteresse = chaves.find(k => k.toLowerCase().includes("objetivo") || k.toLowerCase().includes("idade"));
    
    if (perguntaInteresse) {
        return `<span title="${formRaw[perguntaInteresse]}">${formRaw[perguntaInteresse][0].substring(0, 20)}...</span>`;
    }
    return "Ver detalhes";
}

function renderizarAgenda() {
    const tbody = document.getElementById("tabelaAgenda");
    const busca = document.getElementById("buscaAgenda").value.toLowerCase();
    const coach = document.getElementById("filtroCoach").value;
    const matricula = document.getElementById("filtroMatricula").value;

    const filtrados = cacheAgenda.filter(a => {
        const matchNome = a.aluno_nome.toLowerCase().includes(busca);
        const matchCoach = coach === "todos" || a.professor_id === coach;
        const matchMatricula = matricula === "todos" || (matricula === "sim" ? a.matriculado : !a.matriculado);
        return matchNome && matchCoach && matchMatricula;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="tabela__vazio">Nenhum registro para este mês.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(a => `
        <tr>
            <td>${formatarDataBR(a.data_aula)}</td>
            <td><strong>${a.aluno_nome}</strong></td>
            <td>${a.profiles ? a.profiles.nome : '<span style="color:red">Pendente</span>'}</td>
            <td><span class="pill">${a.status}</span></td>
            <td>${a.matriculado ? '<span class="badge badge--ok">SIM</span>' : '<span class="badge badge--erro">NÃO</span>'}</td>
            <td style="font-size: 12px; color: var(--texto-fraco)">${extrairFeedback(a.form_raw)}</td>
            <td class="tabela__acao">
                <a href="detalhe.html?id=${a.id}" class="btn-confirmar">Ver Ficha</a>
            </td>
        </tr>
    `).join("");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Definir mês atual no select
    const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
    document.getElementById("filtroMes").value = mesAtual;

    carregarCoaches();
    carregarDados();

    // Eventos
    document.getElementById("filtroMes").addEventListener("change", carregarDados);
    document.getElementById("filtroCoach").addEventListener("change", renderizarAgenda);
    document.getElementById("filtroMatricula").addEventListener("change", renderizarAgenda);
    document.getElementById("buscaAgenda").addEventListener("input", renderizarAgenda);
});