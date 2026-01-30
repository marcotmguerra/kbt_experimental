import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, linkWhatsApp, showToast } from "./util.js";

async function carregarPosAula() {
    const lista = document.getElementById("listaPosAula");
    if (!lista) return;

    // Busca apenas Confirmados ou Faltas que não estão arquivados
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .in("status", ["confirmado", "faltou"])
        .eq("arquivado", false)
        .order("data_aula", { ascending: false });

    if (error) return;

    document.getElementById("statPendentesPos").textContent = data.filter(a => !a.avaliacao_enviada || !a.feedback_enviado).length;

    if (data.length === 0) {
        lista.innerHTML = `<tr><td colspan="6" class="tabela__vazio">Nenhum aluno pendente de pós-aula.</td></tr>`;
        return;
    }

    lista.innerHTML = data.map(aluno => {
        const isPendente = !aluno.avaliacao_enviada || !aluno.feedback_enviado;
        
        return `
            <tr>
                <td>
                    <div class="aluno">
                        <span class="aluno__nome">${aluno.aluno_nome}</span>
                        <span class="aluno__sub">${formatarDataBR(aluno.data_aula)}</span>
                        <!-- EXIBIÇÃO DO TIPO DE AULA -->
                        <span style="font-size: 10px; font-weight: 800; color: var(--primario); text-transform: uppercase; background: rgba(64, 12, 136, 0.08); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px;">
                            ${aluno.tipo_aula || 'Experimental'}
                        </span>
                    </div>
                </td>
                <td>
                    <span class="status-pill status-${aluno.status}">${aluno.status}</span><br>
                    <small style="font-weight:bold; color:${aluno.levou_recepcao ? '#16a34a' : '#ef4444'}">
                        ${aluno.levou_recepcao ? 'Foi na recepção' : 'Não foi na recepção'}
                    </small>
                </td>
                <td style="max-width:200px;">
                    <div style="max-height:60px; overflow-y:auto; border:1px solid #eee; padding:8px; border-radius:8px; background:#f8fafc; font-size:12px; line-height:1.4;">
                        ${aluno.feedback_coach ? aluno.feedback_coach : '<em style="color:#999;">Aguardando coach...</em>'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:8px; margin-bottom:8px;">
                        <button class="btn-wpp ${aluno.avaliacao_enviada ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'avaliacao', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:18px;">star</span>
                        </button>
                        <button class="btn-wpp ${aluno.feedback_enviado ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'feedback', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:18px;">assignment</span>
                        </button>
                    </div>
                    <span class="tag-status-pos ${isPendente ? 'tag-status-pos--pendente' : 'tag-status-pos--ok'}">
                        ${isPendente ? 'Aguardando' : 'Finalizado'}
                    </span>
                </td>
                <td>
                    <button class="icon-btn" onclick="window.arquivarAluno('${aluno.id}')" 
                            style="background: #f1f5f9; color: #64748b;" title="Arquivar">
                        <span class="material-symbols-outlined">archive</span>
                    </button>
                </td>
                <td class="tabela__acao">
                    <a href="detalhe.html?id=${aluno.id}" class="icon-btn" 
                       style="background: var(--primario); color: white;">
                        <span class="material-symbols-outlined">visibility</span>
                    </a>
                </td>
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