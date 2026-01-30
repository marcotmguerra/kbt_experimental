import { supabase } from "./supabaseCliente.js";

let charts = {};
let todosOsDados = []; // Cache para cálculos e comparações

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
    const selectMes = document.getElementById("mesRelatorio");
    if (selectMes) {
        selectMes.value = mesAtual;
        carregarEstatisticas();
    }

    // Configuração dos Eventos (Padrão type="module")
    document.getElementById("mesRelatorio")?.addEventListener("change", carregarEstatisticas);
    document.getElementById("btnExportarMensal")?.addEventListener("click", () => exportarPDFExecutivo());
    document.getElementById("btnExportarSemanal")?.addEventListener("click", () => exportarPDFSemanal());
    document.getElementById("btnExportarDiario")?.addEventListener("click", () => exportarPDFDiario());
});

async function carregarEstatisticas() {
    const mes = document.getElementById("mesRelatorio").value;
    
    // Busca todos os dados para permitir comparações temporais
    const { data, error } = await supabase.from("agendamentos").select("*, profiles(nome)");

    if (error) {
        console.error("Erro Supabase:", error);
        return;
    }

    todosOsDados = data || [];

    // Filtrar para o Dashboard (Mês selecionado)
    const agendamentosMes = todosOsDados.filter(a => {
        if (!a.data_aula) return false;
        const dataAula = new Date(a.data_aula);
        return (dataAula.getMonth() + 1) == parseInt(mes);
    });

    // Atualiza os Cards de Resumo na tela
    document.getElementById("relTotalMes").textContent = agendamentosMes.length;
    
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);
    document.getElementById("relTotalSemana").textContent = todosOsDados.filter(a => new Date(a.data_aula) >= seteDiasAtras).length;
    
    const confirmados = agendamentosMes.filter(a => a.status === 'confirmado').length;
    const taxa = agendamentosMes.length > 0 ? Math.round((confirmados / agendamentosMes.length) * 100) : 0;
    document.getElementById("relTaxaPresenca").textContent = taxa + "%";

    const stats = processarStats(agendamentosMes);
    renderizarGraficos(stats);
}

// Função genérica para minerar o form_raw e gerar estatísticas
function processarStats(lista) {
    const s = {
        programas: {},
        sexo: { Masculino: 0, Feminino: 0, Outros: 0 },
        idades: { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 },
        origem: {}
    };

    lista.forEach(a => {
        const prog = a.tipo_aula || "Experimental";
        s.programas[prog] = (s.programas[prog] || 0) + 1;

        if (a.form_raw) {
            try {
                const raw = typeof a.form_raw === 'string' ? JSON.parse(a.form_raw) : a.form_raw;
                const gen = raw.sexo || raw.genero || raw.Sexo;
                if (gen) {
                    if (gen.toLowerCase().startsWith('m')) s.sexo.Masculino++;
                    else if (gen.toLowerCase().startsWith('f')) s.sexo.Feminino++;
                    else s.sexo.Outros++;
                }
                const idade = parseInt(raw.idade || raw.Idade);
                if (idade <= 25) s.idades["18-25"]++;
                else if (idade <= 35) s.idades["26-35"]++;
                else if (idade <= 45) s.idades["36-45"]++;
                else if (idade > 45) s.idades["46+"]++;

                const ori = raw.como_conheceu || raw.origem || "Outros";
                s.origem[ori] = (s.origem[ori] || 0) + 1;
            } catch (e) {}
        }
    });
    return s;
}

function renderizarGraficos(stats) {
    Object.values(charts).forEach(c => c.destroy());
    const cores = ['#400c88', '#16a34a', '#ef4444', '#f59e0b', '#137fec'];

    const cfg = (labels, data, tipo = 'doughnut') => ({
        type: tipo,
        data: { labels, datasets: [{ data, backgroundColor: cores }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });

    charts.programas = new Chart(document.getElementById('chartProgramas'), cfg(Object.keys(stats.programas), Object.values(stats.programas), 'bar'));
    charts.sexo = new Chart(document.getElementById('chartSexo'), cfg(Object.keys(stats.sexo), Object.values(stats.sexo)));
    charts.idade = new Chart(document.getElementById('chartIdade'), cfg(Object.keys(stats.idades), Object.values(stats.idades)));
    charts.origem = new Chart(document.getElementById('chartOrigem'), cfg(Object.keys(stats.origem), Object.values(stats.origem), 'pie'));
}

// --- RELATÓRIO DIÁRIO (NOVO) ---
async function exportarPDFDiario() {
    const hojeStr = new Date().toLocaleDateString('pt-BR');
    const hojeISO = new Date().toISOString().split('T')[0];
    
    // Filtrar aulas de hoje
    const aulasHoje = todosOsDados.filter(a => a.data_aula && a.data_aula.startsWith(hojeISO));

    const rel = document.createElement("div");
    rel.style.padding = "30px";
    rel.style.fontFamily = "'Inter', sans-serif";

    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin:0; color:#400c88; font-size: 20px;">Relatório Diário de Atividades</h1>
            <p style="margin:5px 0; font-size:12px; color:#666;">Data: ${hojeStr}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; text-align:center;">
                <small style="font-size:9px; text-transform:uppercase;">Total Hoje</small>
                <h3 style="margin:0;">${aulasHoje.length}</h3>
            </div>
            <div style="background:#dcfce7; padding:10px; border-radius:8px; text-align:center;">
                <small style="font-size:9px; text-transform:uppercase; color:#16a34a;">Confirmados</small>
                <h3 style="margin:0; color:#16a34a;">${aulasHoje.filter(a => a.status === 'confirmado').length}</h3>
            </div>
            <div style="background:#fee2e2; padding:10px; border-radius:8px; text-align:center;">
                <small style="font-size:9px; text-transform:uppercase; color:#ef4444;">Faltas</small>
                <h3 style="margin:0; color:#ef4444;">${aulasHoje.filter(a => a.status === 'faltou').length}</h3>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
                <tr style="background: #400c88; color: white;">
                    <th style="padding: 8px; text-align: left;">Hora</th>
                    <th style="padding: 8px; text-align: left;">Aluno</th>
                    <th style="padding: 8px; text-align: left;">Programa</th>
                    <th style="padding: 8px; text-align: left;">Coach</th>
                    <th style="padding: 8px; text-align: left;">Feedback do Coach</th>
                </tr>
            </thead>
            <tbody>
                ${aulasHoje.length > 0 ? aulasHoje.map(a => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">${new Date(a.data_aula).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                        <td style="padding: 8px;"><strong>${a.aluno_nome}</strong></td>
                        <td style="padding: 8px;">${a.tipo_aula || 'Experimental'}</td>
                        <td style="padding: 8px;">${a.profiles?.nome || '—'}</td>
                        <td style="padding: 8px; color: #555; font-style: italic;">${a.feedback_coach || 'Sem feedback'}</td>
                    </tr>
                `).join('') : '<tr><td colspan="5" style="padding:20px; text-align:center;">Nenhuma aula agendada para hoje.</td></tr>'}
            </tbody>
        </table>

        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 9px; color: #999; text-align: center;">
            Gerado automaticamente pelo Sistema SAE em ${new Date().toLocaleString('pt-BR')}
        </div>
    `;

    document.body.appendChild(rel);
    
    const opt = {
        margin: 10,
        filename: `SAE_Relatorio_Diario_${hojeISO}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try { await html2pdf().set(opt).from(rel).save(); } 
    finally { document.body.removeChild(rel); }
}

// --- RELATÓRIO SEMANAL COMPARATIVO ---
async function exportarPDFSemanal() {
    const hoje = new Date();
    const seteDias = new Date(); seteDias.setDate(hoje.getDate() - 7);
    const quatorzeDias = new Date(); quatorzeDias.setDate(hoje.getDate() - 14);

    const semanaAtual = todosOsDados.filter(a => new Date(a.data_aula) >= seteDias);
    const semanaPassada = todosOsDados.filter(a => {
        const d = new Date(a.data_aula);
        return d >= quatorzeDias && d < seteDias;
    });

    const statsAtual = processarStats(semanaAtual);
    const diferenca = semanaAtual.length - semanaPassada.length;
    const tendenciaMsg = diferenca >= 0 ? `+${diferenca} em relação à semana passada` : `${diferenca} em relação à semana passada`;
    const corTendencia = diferenca >= 0 ? '#16a34a' : '#ef4444';

    const rel = document.createElement("div");
    rel.style.padding = "30px";
    rel.style.fontFamily = "'Inter', sans-serif";

    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin:0; color:#400c88; font-size: 20px;">Relatório Semanal Comparativo</h1>
            <p style="margin:5px 0; font-size:12px; color:#666;">Período: ${seteDias.toLocaleDateString()} até ${hoje.toLocaleDateString()}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background:#f8f9fa; padding:15px; border-radius:12px; border: 1px solid #eee;">
                <small style="text-transform:uppercase; color:#666; font-weight:bold; font-size:10px;">Agendamentos (Esta Semana)</small>
                <h2 style="margin:5px 0 0; font-size:24px;">${semanaAtual.length}</h2>
            </div>
            <div style="background:#f8f9fa; padding:15px; border-radius:12px; border: 1px solid #eee;">
                <small style="text-transform:uppercase; color:#666; font-weight:bold; font-size:10px;">Tendência</small>
                <h2 style="margin:5px 0 0; font-size:16px; color:${corTendencia};">${tendenciaMsg}</h2>
            </div>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1; height: 220px; text-align:center;">
                <p style="font-size:11px; font-weight:bold; margin-bottom:10px;">PERFIL POR GÊNERO</p>
                <canvas id="pdfPizzaSexo"></canvas>
            </div>
            <div style="flex: 1; height: 220px; text-align:center;">
                <p style="font-size:11px; font-weight:bold; margin-bottom:10px;">ORIGEM DO PÚBLICO</p>
                <canvas id="pdfPizzaOrigem"></canvas>
            </div>
        </div>

        <div style="height: 220px; margin-top: 20px;">
            <p style="font-size:11px; font-weight:bold; text-align:center; margin-bottom:10px;">DISTRIBUIÇÃO DE PROGRAMAS</p>
            <canvas id="pdfBarraProgramas"></canvas>
        </div>
    `;

    document.body.appendChild(rel);

    const cores = ['#400c88', '#16a34a', '#ef4444', '#f59e0b', '#137fec'];
    new Chart(document.getElementById('pdfPizzaSexo'), {
        type: 'pie',
        data: { labels: Object.keys(statsAtual.sexo), datasets: [{ data: Object.values(statsAtual.sexo), backgroundColor: cores }] },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }
    });
    new Chart(document.getElementById('pdfPizzaOrigem'), {
        type: 'doughnut',
        data: { labels: Object.keys(statsAtual.origem), datasets: [{ data: Object.values(statsAtual.origem), backgroundColor: cores }] },
        options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }
    });
    new Chart(document.getElementById('pdfBarraProgramas'), {
        type: 'bar',
        data: { labels: Object.keys(statsAtual.programas), datasets: [{ data: Object.values(statsAtual.programas), backgroundColor: '#400c88' }] },
        options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    const opt = {
        margin: 10,
        filename: `Relatorio_Semanal_SAE.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try { await html2pdf().set(opt).from(rel).save(); } 
    finally { document.body.removeChild(rel); }
}

// --- RELATÓRIO MENSAL EXECUTIVO ---
async function exportarPDFExecutivo() {
    const mesRef = document.getElementById("mesRelatorio").value;
    const nomeMes = document.getElementById("mesRelatorio").options[document.getElementById("mesRelatorio").selectedIndex].text;
    
    const contagemMensal = new Array(12).fill(0);
    todosOsDados.forEach(a => {
        const d = new Date(a.data_aula);
        if (d.getFullYear() === new Date().getFullYear()) contagemMensal[d.getMonth()]++;
    });

    const rel = document.createElement("div");
    rel.style.padding = "40px";
    rel.style.fontFamily = "'Inter', sans-serif";
    rel.style.color = "#111";

    rel.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #400c88; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #400c88; font-size: 24px;">Relatório Executivo SAE</h1>
            <p style="margin: 5px 0; color: #666;">Período: ${nomeMes} / ${new Date().getFullYear()}</p>
        </div>

        <h2 style="font-size: 16px; color: #400c88; border-bottom: 1px solid #eee; padding-bottom: 5px;">1. PERFORMANCE MENSAL</h2>
        <p>Agendamentos Totais: <strong>${document.getElementById("relTotalMes").textContent}</strong> | 
        Presença: <strong>${document.getElementById("relTaxaPresenca").textContent}</strong></p>

        <h2 style="font-size: 16px; color: #400c88; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px;">2. DADOS CONSOLIDADOS</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Categoria</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Distribuição</th>
            </tr>
            <tr><td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Programas</td><td style="border: 1px solid #ddd; padding: 10px;">${obterDadosTexto('chartProgramas')}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Gênero</td><td style="border: 1px solid #ddd; padding: 10px;">${obterDadosTexto('chartSexo')}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Faixas Etárias</td><td style="border: 1px solid #ddd; padding: 10px;">${obterDadosTexto('chartIdade')}</td></tr>
        </table>

        <h2 style="font-size: 16px; color: #400c88; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">3. COMPARAÇÃO ANUAL</h2>
        <div style="height: 250px; margin-top: 20px;"><canvas id="canvasGraficoPDF"></canvas></div>
    `;

    document.body.appendChild(rel);

    const ctx = document.getElementById('canvasGraficoPDF').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
                data: contagemMensal,
                backgroundColor: contagemMensal.map((v, i) => (i + 1 == mesRef) ? '#400c88' : '#e5e7eb'),
                borderRadius: 4
            }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { display: false } } }
    });

    const opt = {
        margin: 10,
        filename: `Relatorio_Executivo_${nomeMes}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try { await html2pdf().set(opt).from(rel).save(); } 
    finally { document.body.removeChild(rel); }
}

function obterDadosTexto(chartId) {
    const chart = Chart.getChart(chartId);
    if (!chart) return "Sem dados";
    return chart.data.labels.map((l, i) => `${l}: <strong>${chart.data.datasets[0].data[i]}</strong>`).join(' | ');
}