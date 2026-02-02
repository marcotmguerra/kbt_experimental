import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, linkWhatsApp, showToast } from "./util.js";

async function carregarPosAula() {
    const lista = document.getElementById("listaPosAula");
    if (!lista) return;

    // Busca apenas Confirmados ou Faltas que não estão arquivados
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .in("status", ["confirmado", "faltou", "atribuido"])
        .eq("arquivado", false)
        .order("data_aula", { ascending: false });

    if (error) return;

    document.getElementById("statPendentesPos").textContent = data.filter(a => !a.avaliacao_enviada || !a.feedback_enviado).length;

    if (data.length === 0) {
        lista.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Nenhum aluno pendente de pós-aula.</td></tr>`;
        return;
    }

        // status do relatório na tabela
        
    lista.innerHTML = data.map(aluno => {
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
                    <span class="tipo-aula-tag">${aluno.tipo_aula || 'Experimental'}</span>
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
                    <small>${aluno.relatorio_vivencia?.recomendacao || ''}</small>
                </div>
            </td>
            <td>
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <button class="btn-wpp ${aluno.avaliacao_enviada ? 'btn-wpp--enviado' : ''}" onclick="window.enviarMensagem('${aluno.id}', 'avaliacao', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')"><span class="material-symbols-outlined">star</span></button>
                    <button class="btn-wpp ${aluno.feedback_enviado ? 'btn-wpp--enviado' : ''}" onclick="window.enviarMensagem('${aluno.id}', 'feedback', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')"><span class="material-symbols-outlined">assignment</span></button>
                </div>
                <span class="tag-status-pos ${isPendente ? 'tag-status-pos--pendente' : 'tag-status-pos--ok'}">${isPendente ? 'Aguardando' : 'Finalizado'}</span>
            </td>
            <td><button class="icon-btn" onclick="window.arquivarAluno('${aluno.id}')"><span class="material-symbols-outlined">archive</span></button></td>
            <td class="tabela__acao"><a href="detalhe.html?id=${aluno.id}" class="icon-btn" style="background:var(--primario); color:white;"><span class="material-symbols-outlined">visibility</span></a></td>
        </tr>`;
}).join('');
}

// Funções de apoio (Arquivar e Enviar Mensagem)
window.arquivarAluno = async (id) => {
    if (!confirm("Concluir e arquivar este aluno?")) return;
    const { error } = await supabase.from("agendamentos").update({ arquivado: true }).eq("id", id);
    if (!error) { showToast("Arquivado!"); carregarPosAula(); }
};

window.enviarMensagem = async (id, tipo, telefone, nome) => {
    let msg = tipo === 'avaliacao' ? `Olá ${nome}! Como foi sua aula?` : `Oi ${nome}, poderia responder nosso feedback? [LINK]`;
    window.open(linkWhatsApp(telefone, msg), '_blank');
    const update = tipo === 'avaliacao' ? { avaliacao_enviada: true } : { feedback_enviado: true };
    await supabase.from("agendamentos").update(update).eq("id", id);
    carregarPosAula();
};

document.addEventListener("DOMContentLoaded", carregarPosAula);
document.getElementById("btnAtualizarPos")?.addEventListener("click", carregarPosAula);