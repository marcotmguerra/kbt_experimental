import { supabase } from "./supabaseCliente.js";

let charts = {};
let todosOsDados = []; 

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
    const selectMes = document.getElementById("mesRelatorio");
    if (selectMes) {
        selectMes.value = mesAtual;
        carregarEstatisticas();
    }

    // Eventos
    document.getElementById("mesRelatorio")?.addEventListener("change", carregarEstatisticas);
    document.getElementById("btnExportarMensal")?.addEventListener("click", () => exportarPDFExecutivo());
    document.getElementById("btnExportarSemanal")?.addEventListener("click", () => exportarPDFSemanal());
    document.getElementById("btnExportarDiario")?.addEventListener("click", () => exportarPDFDiario());
});

// --- FUNÇÃO AUXILIAR: BUSCA INTELIGENTE NO FORM_RAW ---
function buscarNoForm(formRaw, termos) {
    if (!formRaw) return null;
    try {
        const obj = typeof formRaw === 'string' ? JSON.parse(formRaw) : formRaw;
        const keys = Object.keys(obj);
        const chaveEncontrada = keys.find(k => 
            termos.some(t => k.toLowerCase().includes(t.toLowerCase()))
        );
        return chaveEncontrada ? obj[chaveEncontrada] : null;
    } catch (e) {
        return null;
    }
}

// --- CARREGAR DADOS ---
async function carregarEstatisticas() {
    const mesSelecionado = document.getElementById("mesRelatorio").value;
    
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*, profiles(nome)");

    if (error) {
        console.error("Erro Supabase:", error);
        return;
    }

    todosOsDados = data || [];

    // CÁLCULO: Aulas nesta Semana (Últimos 7 dias)
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);
    seteDiasAtras.setHours(0, 0, 0, 0);

    const agendamentosSemana = todosOsDados.filter(a => {
        if (!a.data_aula) return false;
        const d = new Date(a.data_aula);
        return d >= seteDiasAtras && d <= hoje;
    });
    document.getElementById("relTotalSemana").textContent = agendamentosSemana.length;

    // FILTRO: Mês selecionado
    const agendamentosMes = todosOsDados.filter(a => {
        if (!a.data_aula) return false;
        const d = new Date(a.data_aula);
        return (d.getMonth() + 1) == parseInt(mesSelecionado);
    });

    document.getElementById("relTotalMes").textContent = agendamentosMes.length;
    const confirmados = agendamentosMes.filter(a => a.status === 'confirmado').length;
    const taxa = agendamentosMes.length > 0 ? Math.round((confirmados / agendamentosMes.length) * 100) : 0;
    document.getElementById("relTaxaPresenca").textContent = taxa + "%";

    const stats = processarStats(agendamentosMes);
    renderizarGraficos(stats);
}

// --- PROCESSAR ESTATÍSTICAS (COM NOVAS FAIXAS ETÁRIAS) ---
function processarStats(lista) {
    const s = {
        programas: {},
        sexo: { Masculino: 0, Feminino: 0, Outros: 0 },
        idades: { 
            "Andantes até 3 anos": 0,
            "4 a 6 anos": 0,
            "7 a 10 anos": 0,
            "11 a 13 anos": 0,
            "14-17 anos": 0,
            "18-25": 0, 
            "26-35": 0, 
            "36-45": 0, 
            "46+": 0 
        },
        origem: {}
    };

    lista.forEach(a => {
        const prog = a.tipo_aula || "Experimental";
        s.programas[prog] = (s.programas[prog] || 0) + 1;

        if (a.form_raw) {
            // Sexo
            const gen = buscarNoForm(a.form_raw, ['sexo', 'gênero', 'genero']);
            if (gen) {
                const g = gen.toString().toLowerCase();
                if (g.startsWith('m')) s.sexo.Masculino++;
                else if (g.startsWith('f')) s.sexo.Feminino++;
                else s.sexo.Outros++;
            }

            // Idade logica para as idades por faixa
            const idadeVal = buscarNoForm(a.form_raw, ['idade', 'nascimento', 'anos']);
            if (idadeVal) {
                const idade = parseInt(idadeVal);
                if (idade <= 3) s.idades["Andantes até 3 anos"]++;
                else if (idade <= 6) s.idades["4 a 6 anos"]++;
                else if (idade <= 10) s.idades["7 a 10 anos"]++;
                else if (idade <= 13) s.idades["11 a 13 anos"]++;
                else if (idade <= 17) s.idades["14-17 anos"]++;
                else if (idade <= 25) s.idades["18-25"]++;
                else if (idade <= 35) s.idades["26-35"]++;
                else if (idade <= 45) s.idades["36-45"]++;
                else if (idade > 45) s.idades["46+"]++;
            }

            // Origem
            const ori = buscarNoForm(a.form_raw, ['conheceu']);
            if (ori) {
                const o = ori.toString().trim();
                s.origem[o] = (s.origem[o] || 0) + 1;
            }
        }
    });
    return s;
}

// --- RENDERIZAR GRÁFICOS ---
function renderizarGraficos(stats) {
    Object.values(charts).forEach(c => { if(c) c.destroy(); });
    
    const cores = ['#400c88', '#16a34a', '#ef4444', '#f59e0b', '#137fec', '#8b5cf6', '#06b6d4', '#ec4899', '#064e3b'];

    const criarConfig = (labels, data, tipo = 'doughnut') => ({
        type: tipo,
        data: { labels, datasets: [{ data, backgroundColor: cores }] },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } 
        }
    });

    const limpar = (obj) => {
        const labels = Object.keys(obj).filter(k => obj[k] > 0);
        const values = labels.map(k => obj[k]);
        return { labels, values };
    };

    charts.programas = new Chart(document.getElementById('chartProgramas'), criarConfig(limpar(stats.programas).labels, limpar(stats.programas).values, 'bar'));
    charts.sexo = new Chart(document.getElementById('chartSexo'), criarConfig(limpar(stats.sexo).labels, limpar(stats.sexo).values));
    charts.idade = new Chart(document.getElementById('chartIdade'), criarConfig(limpar(stats.idades).labels, limpar(stats.idades).values));
    charts.origem = new Chart(document.getElementById('chartOrigem'), criarConfig(limpar(stats.origem).labels, limpar(stats.origem).values, 'pie'));
}

// --- EXPORTAÇÃO PDF DIÁRIO ---
async function exportarPDFDiario() {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    const hojeISO = new Date().toISOString().split('T')[0];
    const aulasHoje = todosOsDados.filter(a => a.data_aula && a.data_aula.startsWith(hojeISO));

    const rel = document.createElement("div");
    rel.style.padding = "30px";
    rel.style.fontFamily = "'Inter', sans-serif";
    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin:0; color:#400c88; font-size: 20px;">Relatório Diário de Atividades</h1>
            <p style="margin:5px 0; font-size:12px; color:#666;">Data: ${hojeStr}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
                <tr style="background: #400c88; color: white;">
                    <th style="padding: 8px; text-align: left;">Hora</th>
                    <th style="padding: 8px; text-align: left;">Aluno</th>
                    <th style="padding: 8px; text-align: left;">Programa</th>
                    <th style="padding: 8px; text-align: left;">Coach</th>
                </tr>
            </thead>
            <tbody>
                ${aulasHoje.map(a => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">${new Date(a.data_aula).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                        <td style="padding: 8px;"><strong>${a.aluno_nome}</strong></td>
                        <td style="padding: 8px;">${a.tipo_aula || 'Experimental'}</td>
                        <td style="padding: 8px;">${a.profiles?.nome || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.body.appendChild(rel);
    const opt = { margin: 10, filename: `SAE_Diario_${hojeISO}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await html2pdf().set(opt).from(rel).save(); } finally { document.body.removeChild(rel); }
}

// --- EXPORTAÇÃO PDF SEMANAL ---
async function exportarPDFSemanal() {
    const hoje = new Date();
    const seteDias = new Date(); seteDias.setDate(hoje.getDate() - 7);
    const semanaAtual = todosOsDados.filter(a => new Date(a.data_aula) >= seteDias);
    const statsAtual = processarStats(semanaAtual);

    const rel = document.createElement("div");
    rel.style.padding = "30px";
    rel.style.fontFamily = "'Inter', sans-serif";
    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin:0; color:#400c88; font-size: 20px;">Relatório Semanal SAE</h1>
            <p style="margin:5px 0; font-size:12px; color:#666;">Período: ${seteDias.toLocaleDateString()} - ${hoje.toLocaleDateString()}</p>
        </div>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; text-align:center;"><p style="font-size:10px; font-weight:bold;">GÊNERO</p><canvas id="pdfPizzaSexo" style="height:150px;"></canvas></div>
            <div style="flex: 1; text-align:center;"><p style="font-size:10px; font-weight:bold;">FAIXA ETÁRIA</p><canvas id="pdfPizzaIdade" style="height:150px;"></canvas></div>
        </div>
    `;

    document.body.appendChild(rel);
    const cores = ['#400c88', '#16a34a', '#ef4444', '#f59e0b', '#137fec', '#8b5cf6', '#06b6d4', '#ec4899'];
    
    new Chart(document.getElementById('pdfPizzaSexo'), {
        type: 'pie',
        data: { labels: Object.keys(statsAtual.sexo), datasets: [{ data: Object.values(statsAtual.sexo), backgroundColor: cores }] },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: {size: 8} } } } }
    });
    
    const idLimpo = limparObjeto(statsAtual.idades);
    new Chart(document.getElementById('pdfPizzaIdade'), {
        type: 'doughnut',
        data: { labels: idLimpo.labels, datasets: [{ data: idLimpo.values, backgroundColor: cores }] },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: {size: 8} } } } }
    });

    const opt = { margin: 10, filename: `Relatorio_Semanal.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await html2pdf().set(opt).from(rel).save(); } finally { document.body.removeChild(rel); }
}

// --- EXPORTAÇÃO PDF EXECUTIVO (MENSAL) ---
async function exportarPDFExecutivo() {
    const nomeMes = document.getElementById("mesRelatorio").options[document.getElementById("mesRelatorio").selectedIndex].text;
    const rel = document.createElement("div");
    rel.style.padding = "40px";
    rel.style.fontFamily = "'Inter', sans-serif";
    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #400c88; font-size: 24px;">Relatório Executivo SAE</h1>
            <p style="margin: 5px 0; color: #666;">Referência: ${nomeMes}</p>
        </div>
        <h3>Métricas de Desempenho</h3>
        <p>Total de Agendamentos: ${document.getElementById("relTotalMes").textContent}</p>
        <p>Taxa de Presença: ${document.getElementById("relTaxaPresenca").textContent}</p>
    `;

    document.body.appendChild(rel);
    const opt = { margin: 10, filename: `Relatorio_Executivo_${nomeMes}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await html2pdf().set(opt).from(rel).save(); } finally { document.body.removeChild(rel); }
}

function limparObjeto(obj) {
    const labels = Object.keys(obj).filter(k => obj[k] > 0);
    const values = labels.map(k => obj[k]);
    return { labels, values };
}