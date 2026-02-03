import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, linkWhatsApp, showToast } from "./util.js";

// Cache para evitar múltiplas requisições ao trocar o filtro
let cacheAlunosPos = [];

async function carregarPosAula() {
    const lista = document.getElementById("listaPosAula");
    if (!lista) return;

    lista.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Carregando alunos...</td></tr>`;

    // Busca Confirmados, Faltas ou Atribuídos que não estão arquivados
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .in("status", ["confirmado", "faltou", "atribuido"])
        .eq("arquivado", false)
        .order("data_aula", { ascending: false });

    if (error) {
        showToast("Erro ao carregar dados", "erro");
        return;
    }

    cacheAlunosPos = data || [];
    filtrarERenderizar();
}

function filtrarERenderizar() {
    const lista = document.getElementById("listaPosAula");
    const filtroMes = document.getElementById("filtroMesPos").value;
    const busca = document.getElementById("buscaPos").value.toLowerCase();

    // Aplica os filtros
    const filtrados = cacheAlunosPos.filter(aluno => {
        const matchesBusca = aluno.aluno_nome.toLowerCase().includes(busca);
        
        // Extrai o mês da data (formato YYYY-MM-DD...)
        const mesAula = aluno.data_aula.split('-')[1]; 
        const matchesMes = filtroMes === "todos" || mesAula === filtroMes;

        return matchesBusca && matchesMes;
    });

    // Atualiza Stats baseado no que está na tela
    document.getElementById("statPendentesPos").textContent = filtrados.filter(a => !a.avaliacao_enviada || !a.feedback_enviado).length;
    
    // Cálculo simples de conversão para o card (opcional)
    const totalVendas = filtrados.filter(a => a.matriculado).length;
    const taxa = filtrados.length > 0 ? ((totalVendas / filtrados.length) * 100).toFixed(0) : 0;
    document.getElementById("statConversao").textContent = taxa + "%";

    if (filtrados.length === 0) {
        lista.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Nenhum aluno encontrado para estes filtros.</td></tr>`;
        return;
    }

    lista.innerHTML = filtrados.map(aluno => {
        const isPendente = !aluno.avaliacao_enviada || !aluno.feedback_enviado;
        const relatorioStatus = aluno.relatorio_vivencia 
            ? `<span style="color:#16a34a; font-weight:bold;">✅ Relatório OK</span>` 
            : `<span style="color:#ef4444; font-weight:bold;">⚠️ Sem Relatório</span>`;
        
        return `
            <tr>
                <td>
                    <div class="aluno">
                        <span class="aluno__nome">${aluno.aluno_nome}</span>
                        <span class="aluno__sub">${formatarDataBR(aluno.data_aula)}</span>
                        <span class="tipo-aula-tag" style="font-size:10px; background:#f0f2f4; padding:2px 6px; border-radius:4px;">${aluno.tipo_aula || 'Experimental'}</span>
                    </div>
                </td>
                <td>
                    <span class="status-pill status-${aluno.status}">${aluno.status}</span><br>
                    <small style="color:${aluno.levou_recepcao ? '#16a34a' : '#ef4444'}">
                        ${aluno.levou_recepcao ? '✓ Recepção OK' : '✗ S/ Recepção'}
                    </small>
                </td>
                <td style="max-width:200px;">
                    <div class="feedback-box-pos">
                        ${relatorioStatus}<br>
                        <small style="font-size:11px; color:#666;">${aluno.relatorio_vivencia?.recomendacao || ''}</small>
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:8px; margin-bottom:8px;">
                        <button class="btn-wpp ${aluno.avaliacao_enviada ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'avaliacao', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')" 
                                title="Enviar Avaliação">
                            <span class="material-symbols-outlined">star</span>
                        </button>
                        <button class="btn-wpp ${aluno.feedback_enviado ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'feedback', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')" 
                                title="Enviar Feedback">
                            <span class="material-symbols-outlined">assignment</span>
                        </button>
                    </div>
                    <span class="tag-status-pos ${isPendente ? 'tag-status-pos--pendente' : 'tag-status-pos--ok'}">
                        ${isPendente ? 'Aguardando' : 'Finalizado'}
                    </span>
                </td>
                <td>
                    <button class="icon-btn" onclick="window.arquivarAluno('${aluno.id}')" title="Arquivar">
                        <span class="material-symbols-outlined">archive</span>
                    </button>
                </td>
                <td class="tabela__acao">
                    <a href="detalhe.html?id=${aluno.id}" class="icon-btn" style="background:var(--primario); color:white;">
                        <span class="material-symbols-outlined">visibility</span>
                    </a>
                </td>
            </tr>`;
    }).join('');
}

// Funções globais para os botões da tabela
window.arquivarAluno = async (id) => {
    if (!confirm("Concluir e arquivar este aluno?")) return;
    const { error } = await supabase.from("agendamentos").update({ arquivado: true }).eq("id", id);
    if (!error) { 
        showToast("Arquivado!"); 
        carregarPosAula(); 
    }
};

window.enviarMensagem = async (id, tipo, telefone, nome) => {
    const msg = tipo === 'avaliacao' 
        ? `Olá ${nome}! Aqui é do CrossFit Kabuto. Como foi sua experiência na aula experimental? Sua opinião é muito importante para nós!` 
        : `Oi ${nome}, tudo bem? Poderia nos dar um feedback mais detalhado respondendo esse link rápido? Isso nos ajuda a melhorar seu treino!`;
    
    window.open(linkWhatsApp(telefone, msg), '_blank');
    
    const update = tipo === 'avaliacao' ? { avaliacao_enviada: true } : { feedback_enviado: true };
    await supabase.from("agendamentos").update(update).eq("id", id);
    
    // Atualiza o cache local para não precisar baixar tudo de novo
    const aluno = cacheAlunosPos.find(a => a.id === id);
    if (aluno) {
        if (tipo === 'avaliacao') aluno.avaliacao_enviada = true;
        else aluno.feedback_enviado = true;
    }
    filtrarERenderizar();
};

// Eventos de inicialização
document.addEventListener("DOMContentLoaded", () => {
    carregarPosAula();

    // Filtro de Mês
    document.getElementById("filtroMesPos")?.addEventListener("change", filtrarERenderizar);
    
    // Busca por Nome
    document.getElementById("buscaPos")?.addEventListener("input", filtrarERenderizar);
    
    // Botão Atualizar
    document.getElementById("btnAtualizarPos")?.addEventListener("click", carregarPosAula);
});