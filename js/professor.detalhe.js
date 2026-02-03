import { supabase } from "./supabaseCliente.js";
import { showToast, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

const INSIGHTS_RELATORIO = {
    kids: {
        coord: { label: "Coordenação Geral", baixo: "Dificuldade severa em organizar movimentos simples. Sem estímulo, pode evitar esportes coletivos por se sentir incapaz.", medio: "Coordenação em desenvolvimento, mas oscila em tarefas combinadas. A prática trará o refino necessário.", alto: "Excelente domínio motor e consciência corporal. Foco agora é desafiar com complexidade." },
        agil: { label: "Agilidade e Resposta", baixo: "Resposta lenta a estímulos. No dia a dia, traduz-se em lentidão para reagir a imprevistos dinâmicos.", medio: "Boa velocidade de reação, mas perde a precisão sob pressão. O treino ajudará na calma e agilidade.", alto: "Reação rápida e adaptativa. Demonstra grande prontidão e segurança para novos cenários." },
        atencao: { label: "Atenção em Movimento", baixo: "Dificuldade em manter o foco durante o movimento. Tende a se dispersar, impactando no aprendizado.", medio: "Consegue manter a atenção, mas se cansa mentalmente ao final. Trabalharemos foco sob esforço.", alto: "Foco excepcional. Consegue processar instruções mesmo em ambientes com muitos estímulos." },
        forca: { label: "Força Funcional", baixo: "Baixa sustentação do próprio corpo. Pode gerar má postura, cansaço rápido e falta de confiança.", medio: "Força adequada para a idade, mas com margem para ganho. O fortalecimento evitará dores.", alto: "Força funcional acima da média. Demonstra grande controle sobre o peso do corpo." },
        inter: { label: "Interação com Grupo", baixo: "Dificuldade de integração ou timidez. O ambiente de treino será o suporte seguro para socializar.", medio: "Interage bem, mas busca aprovação constante ou se isola. Foco em liderança e equipe.", alto: "Liderança natural e excelente adaptação. Sabe colaborar e transita muito bem em grupos." }
    },
    adulto: {
        cardio: { label: "Condicionamento Cardio", baixo: "Capacidade aeróbica limitada, causando fadiga precoce, falta de ar e dificuldade em terminar.", medio: "Resistência razoável, mas o ritmo cai na metade do treino. Precisamos de constância.", alto: "Coração e pulmões em excelente forma. Sustenta alta intensidade e recupera o ritmo rápido." },
        forca: { label: "Força Funcional", baixo: "Dificuldade em sustentar cargas básicas. Movimentos do dia a dia podem sobrecarregar articulações.", medio: "Boa base de força, mas falta refino sob carga. Foco em ganhar potência com qualidade.", alto: "Força funcional sólida e eficiente. Músculos condicionados que protegem a estrutura óssea." },
        core: { label: "Estabilidade de Core", baixo: "Instabilidade central perigosa. Falta de controle gera sobrecarga na lombar e dores recorrentes.", medio: "Core ativo, mas 'desliga' no cansaço. Precisamos fortalecer a consciência abdominal.", alto: "Estabilidade de elite. Tronco firme e protegido em qualquer transição ou exercício." },
        mobilidade: { label: "Mobilidade e Coordenação", baixo: "Corpo muito rígido e travado. Encurtamentos limitam movimentos e criam compensações lesivas.", medio: "Mobilidade satisfatória em alguns pontos. O treino focará em liberar as travas remanescentes.", alto: "Fluidez total de movimento. Articulações trabalham na amplitude correta, potencializando força." },
        resposta: { label: "Resposta ao Treino", baixo: "O corpo sofre muito com o estímulo e a postura desaba. Indica necessidade urgente de regularidade.", medio: "Resposta positiva, mas com sinais de cansaço acumulado. Ajustaremos o volume para evoluir.", alto: "Excelente recuperação pós-treino. O corpo absorve o estímulo e se reconstrói rapidamente." }
    }
};

let categoriaSelecionada = 'adulto';

async function carregar() {
    const id = getQueryParam("id");
    if (!id) return;

    const { data: ag, error } = await supabase.from("agendamentos").select("*, profiles(nome)").eq("id", id).single();
    if (error || !ag) return showToast("Erro ao carregar", "erro");

    // Dados do Aluno
    document.getElementById("detAluno").textContent = ag.aluno_nome;
    document.getElementById("detData").textContent = formatarDataBR(ag.data_aula);
    document.getElementById("detTipo").textContent = ag.tipo_aula || "Experimental";
    document.getElementById("detWhatsapp").textContent = ag.aluno_whatsapp || "—";
    document.getElementById("badgeStatus").className = `status-pill status-${ag.status}`;
    document.getElementById("badgeStatus").textContent = ag.status || "pendente";
    document.getElementById("btnWhatsapp").href = linkWhatsApp(ag.aluno_whatsapp);

    // Exibir Responsável se existir
    const elSub = document.getElementById("subtitulo");
    if (ag.responsavel_nome) {
        elSub.innerHTML = `<span style="color:var(--primario); font-weight:800;">Responsável: ${ag.responsavel_nome}</span>`;
    }

    // DADOS BRUTOS (RESOLVIDO PARA KIDS E ADULTO)
    const containerForms = document.getElementById("detFormRaw");
    if (ag.form_raw) {
        try {
            const dados = typeof ag.form_raw === 'string' ? JSON.parse(ag.form_raw) : ag.form_raw;
            
            containerForms.innerHTML = Object.entries(dados).map(([k, v]) => {
                // Trata o valor: Se for Array (padrão Google Forms), junta com vírgula. Se não, usa o valor.
                const valorFinal = Array.isArray(v) ? v.join(', ') : v;
                
                // Pula campos vazios para não poluir a tela
                if (!valorFinal || valorFinal === "") return "";

                return `
                <div class="mini-card" style="margin-bottom:8px; background:#fff; border:1px solid #eee; padding: 10px; border-radius: 8px;">
                    <small style="color:var(--primario); font-weight:800; text-transform:uppercase; font-size:10px; display:block; margin-bottom: 4px;">
                        ${k.replace(/_/g, ' ').replace(/\n/g, ' ')}
                    </small>
                    <span style="font-size:14px; font-weight: 600; line-height: 1.4; display: block;">
                        ${valorFinal}
                    </span>
                </div>`;
            }).join('');
        } catch (e) { 
            console.error("Erro ao processar form_raw:", e);
            containerForms.innerHTML = "<p>Erro ao ler formulário.</p>"; 
        }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const { data: perfil } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();

    if (perfil.role === 'admin') mostrarPainelAdmin(id, ag);
    else mostrarPainelProfessor(id, ag);
}

function obterTextoInsight(categoria, idPergunta, nota) {
    const n = parseFloat(nota);
    const cat = INSIGHTS_RELATORIO[categoria][idPergunta];
    if (n <= 2) return cat.baixo;
    if (n <= 4) return cat.medio;
    return cat.alto;
}

function atualizarAutomacao() {
    let notaMinima = 6, idPiorNota = "", soma = 0;
    const selects = document.querySelectorAll(".nota-input");
    
    selects.forEach(sel => {
        const nota = parseFloat(sel.value);
        soma += nota;
        if (nota < notaMinima) { notaMinima = nota; idPiorNota = sel.dataset.id; }
    });
    
    const media = soma / (selects.length || 1);
    if (idPiorNota) {
        document.getElementById("txtTraducaoPratica").value = obterTextoInsight(categoriaSelecionada, idPiorNota, notaMinima);
    }
    
    let rec = "";
    if (categoriaSelecionada === 'kids') {
        if (media <= 2.5) rec = "3x na semana (Prioridade: Desenvolvimento Motor)";
        else if (media <= 4.0) rec = "2x na semana (Foco em Consistência)";
        else rec = "1x a 2x na semana (Manutenção/Lazer)";
    } else {
        if (media >= 4.5) rec = "Programa CROSSFIT (Foco em Performance)";
        else {
            switch (idPiorNota) {
                case 'forca': case 'core': case 'mobilidade': rec = "Programa STRONG (3x) + Cardio (2x)"; break;
                case 'cardio': case 'resposta': rec = "Programa CARDIO & BURN (3x) + Strong (1x)"; break;
                default: rec = "Programa HYROX (2x) + Strong (2x)"; break;
            }
        }
    }
    document.getElementById("textoRecomendacaoAuto").textContent = rec;
}

window.alternarRelatorio = (tipo) => {
    categoriaSelecionada = tipo;
    const container = document.getElementById("camposRelatorio");
    const perguntas = tipo === 'kids' ? Object.keys(INSIGHTS_RELATORIO.kids) : Object.keys(INSIGHTS_RELATORIO.adulto);
    
    container.innerHTML = perguntas.map(id => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label style="margin:0; font-size:13px; font-weight:700;">${INSIGHTS_RELATORIO[tipo][id].label}</label>
            <select class="nota-input" data-id="${id}" style="width:75px; padding:2px;">
                ${[0,1,2,3,4,5].map(n => `<option value="${n}">${n}/5</option>`).join('')}
            </select>
        </div>`).join('');

    document.querySelectorAll(".nota-input").forEach(sel => sel.addEventListener("change", atualizarAutomacao));
    document.getElementById("txtTraducaoPratica").value = "";
    document.getElementById("textoRecomendacaoAuto").textContent = "Preencha as notas...";
};

function mostrarPainelProfessor(id, ag) {
    document.getElementById("seletorCategoria").style.display = "block";
    document.getElementById("containerFeedbackCoach").style.display = "block";
    document.getElementById("btnRelAdulto").onclick = () => window.alternarRelatorio('adulto');
    document.getElementById("btnRelKids").onclick = () => window.alternarRelatorio('kids');

    if (ag.relatorio_vivencia) {
        window.alternarRelatorio(ag.relatorio_vivencia.categoria);
        document.getElementById("txtTraducaoPratica").value = ag.relatorio_vivencia.traducao || "";
        setTimeout(() => {
            document.querySelectorAll(".nota-input").forEach(sel => sel.value = ag.relatorio_vivencia.notas[sel.dataset.id] || 0);
            document.getElementById("textoRecomendacaoAuto").textContent = ag.relatorio_vivencia.recomendacao || "Cálculo pendente...";
        }, 100);
    } else {
        window.alternarRelatorio('adulto');
    }

    document.getElementById("formRelatorioVivencia").onsubmit = async (e) => {
        e.preventDefault();
        const notas = {};
        document.querySelectorAll(".nota-input").forEach(sel => notas[sel.dataset.id] = sel.value);
        const payload = { 
            categoria: categoriaSelecionada, notas, 
            traducao: document.getElementById("txtTraducaoPratica").value, 
            recomendacao: document.getElementById("textoRecomendacaoAuto").textContent 
        };
        await supabase.from("agendamentos").update({ relatorio_vivencia: payload }).eq("id", id);
        showToast("Relatório Salvo!");
    };
}

function mostrarPainelAdmin(id, ag) {
    document.getElementById("secaoAdminVenda").style.display = "block";
    document.getElementById("containerAdminAcoes").style.display = "flex";
    document.getElementById("containerFeedbackAdmin").style.display = "block";

    const box = document.getElementById("leituraRelatorio");
    if (ag.relatorio_vivencia) {
        const rv = ag.relatorio_vivencia;
        box.innerHTML = `
            <div style="background:var(--primario); color:#fff; padding:10px; border-radius:8px; margin-bottom:12px; text-align:center;">
                <strong style="text-transform:uppercase; font-size:12px;">Relatório ${rv.categoria}</strong>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:12px;">
                ${Object.keys(rv.notas).map(key => `
                    <div style="font-size:11px; border-bottom:1px solid #eee; padding-bottom:2px;">
                        ${INSIGHTS_RELATORIO[rv.categoria][key].label}: <strong>${rv.notas[key]}/5</strong>
                    </div>`).join('')}
            </div>
            <div style="font-size:12px; background:#f8fafc; padding:10px; border-radius:8px; border-left:4px solid var(--primario); margin-bottom:10px;">
                <strong>Análise:</strong><br>
                <em style="color:#555;">"${rv.traducao}"</em>
            </div>
            <div style="border: 2px dashed var(--primario); padding:10px; border-radius:8px; text-align:center; background:#fdfdfd;">
                <small style="color:#666; font-size:10px;">PROGRAMA SUGERIDO</small><br>
                <strong style="color:var(--primario); font-size:14px;">${rv.recomendacao}</strong>
            </div>
        `;
        document.getElementById("btnExportarPDFVivencia").onclick = () => gerarRelatorioTecnicoPDF(ag);
    } else box.innerHTML = "<p class='vazio'>Relatório pendente.</p>";

    document.getElementById("btnConfirmar").onclick = () => supabase.from("agendamentos").update({ status: 'confirmado' }).eq("id", id).then(() => location.reload());
    document.getElementById("btnFaltou").onclick = () => supabase.from("agendamentos").update({ status: 'faltou' }).eq("id", id).then(() => location.reload());
}

async function gerarRelatorioTecnicoPDF(ag) {
    const rv = ag.relatorio_vivencia;
    const nomeCoach = ag.profiles?.nome || "Responsável Técnico";
    const content = document.createElement("div");

    content.style.cssText = "width: 210mm; padding: 10mm 15mm; font-family: 'Helvetica', sans-serif; color: #111; background: white;";

    content.innerHTML = `
        <div style="border-bottom: 3px solid #400c88; padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="../img/KBT_logo2.png" alt="Logo KBT" style="height: 60px;">
                <div>
                    <h1 style="color: #400c88; margin: 0; font-size: 16pt; font-weight: 900;">RELATÓRIO DE VIVÊNCIA</h1>
                    <p style="margin: 3px 0 0; font-weight: bold; color: #666; font-size: 9pt;">KABUTO CROSSFIT</p>
                </div>
            </div>
            <div style="text-align: right; font-size: 9pt;">
                <p style="margin:0;">Aluno: <strong>${ag.aluno_nome}</strong></p>
                ${ag.responsavel_nome ? `<p style="margin:0;">Responsável: <strong>${ag.responsavel_nome}</strong></p>` : ''}
                <p style="margin:0;">Data: ${formatarDataBR(ag.data_aula)}</p>
            </div>
        </div>

        <h3 style="font-size: 10pt; text-transform: uppercase; color: #400c88; margin-bottom: 8px;"> Indicadores Técnicos Observados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="background: #400c88; color: #fff;">
                <th style="padding: 6px; text-align: left; border: 1px solid #ddd; font-size: 9pt;">Capacidade Avaliada</th>
                <th style="padding: 6px; border: 1px solid #ddd; text-align: center; width: 50px; font-size: 9pt;">Nota</th>
            </tr>
            ${Object.keys(rv.notas).map(id => `
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd; font-size: 9pt;">
                        <strong style="color: #400c88;">${INSIGHTS_RELATORIO[rv.categoria][id].label}</strong><br>
                        <span>${obterTextoInsight(rv.categoria, id, rv.notas[id])}</span>
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: 900; color: #400c88;">${rv.notas[id]}</td>
                </tr>`).join('')}
        </table>

        <div style="background: #f4f4f4; padding: 12px; border-left: 5px solid #400c88; margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px; color: #400c88; font-size: 9pt;">ANÁLISE DO COACH</h4>
            <p style="font-size: 9pt; margin: 0;">"${rv.traducao}"</p>
        </div>

        <div style="background: #400c88; color: #fff; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 8pt; text-transform: uppercase;">PROGRAMA SUGERIDO</p>
            <h2 style="margin: 5px 0 0; font-size: 16pt;">${rv.recomendacao}</h2>
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <div style="width: 60mm; border-top: 1px solid #000; margin: 0 auto 5px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 10pt;">Coach ${nomeCoach}</p>
        </div>
    `;

    html2pdf().set({ margin: 0, filename: `Relatorio_Kabuto_${ag.aluno_nome}.pdf`, jsPDF: { format: 'a4' } }).from(content).save();
}

const TEXTOS_LEGENDA = {
    kids: `
        <div class="legenda-item">
            <strong style="color: #d32f2f;">🔴 Nota 1 — Muito Abaixo (Crítico)</strong>
            <p>Não organiza movimentos, se perde em comandos, evita participar. <br><b>Foco:</b> Segurança e confiança.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #f57c00;">🟠 Nota 2 — Abaixo do Esperado</strong>
            <p>Movimentos básicos sem fluidez, atenção oscila, reage lentamente. <br><b>Foco:</b> Repetição guiada.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #fbc02d;">🟡 Nota 3 — Adequado</strong>
            <p>Coordenação funcional mas inconsistente, interação social adequada. <br><b>Foco:</b> Constância e jogos.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #388e3c;">🟢 Nota 4 — Acima da Média</strong>
            <p>Boa organização, resposta rápida, mantém atenção, começa a liderar. <br><b>Foco:</b> Desafios e autonomia.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #1976d2;">🔵 Nota 5 — Excelente</strong>
            <p>Coordenação acima da média, atenção total, liderança natural. <br><b>Foco:</b> Complexidade e estímulos avançados.</p>
        </div>
    `,
    adulto: `
        <div class="legenda-item">
            <strong style="color: #d32f2f;">🔴 Nota 1 — Muito Abaixo (Crítico)</strong>
            <p>Fadiga precoce, perda de técnica, instabilidade de core, risco articular.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #f57c00;">🟠 Nota 2 — Abaixo do Esperado</strong>
            <p>Muitas compensações, técnica cai sob esforço, recuperação lenta.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #fbc02d;">🟡 Nota 3 — Adequado</strong>
            <p>Execução correta na maior parte, boa resposta inicial, força aceitável.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #388e3c;">🟢 Nota 4 — Acima da Média</strong>
            <p>Técnica consistente, boa resistência, recuperação eficiente.</p>
        </div>
        <div class="legenda-item">
            <strong style="color: #1976d2;">🔵 Nota 5 — Excelente</strong>
            <p>Domínio técnico total, sustenta alta intensidade, ótima leitura corporal.</p>
        </div>
    `
};

// Lógica para abrir/fechar modal
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modalLegenda");
    const btnVer = document.getElementById("btnVerLegenda");
    const btnFechar = document.getElementById("fecharLegenda");
    const corpo = document.getElementById("corpoLegenda");
    const titulo = document.getElementById("tituloLegenda");

    if (btnVer) {
        btnVer.onclick = () => {
            const cat = typeof categoriaSelecionada !== 'undefined' ? categoriaSelecionada : 'adulto';
            titulo.textContent = `Legenda de Notas — ${cat.toUpperCase()}`;
            corpo.innerHTML = TEXTOS_LEGENDA[cat];
            modal.style.display = "flex";
        };
    }

    if (btnFechar) {
        btnFechar.onclick = () => modal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    };
});

document.addEventListener("DOMContentLoaded", carregar);