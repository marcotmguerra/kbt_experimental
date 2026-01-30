import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, linkWhatsApp, showToast } from "./util.js";

async function carregarPosAula() {
    const lista = document.getElementById("listaPosAula");
    if (!lista) return;

    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .in("status", ["confirmado", "faltou"])
        .order("data_aula", { ascending: false });

    if (error) return;

    document.getElementById("statPendentesPos").textContent = data.filter(a => !a.avaliacao_enviada || !a.feedback_enviado).length;

    lista.innerHTML = data.map(aluno => {
        const isPendente = !aluno.avaliacao_enviada || !aluno.feedback_enviado;
        
        return `
            <tr>
                <td>
                    <div class="aluno">
                        <span class="aluno__nome">${aluno.aluno_nome}</span>
                        <span class="aluno__sub">${formatarDataBR(aluno.data_aula)}</span>
                    </div>
                </td>
                <td>
                    <span class="status-pill status-${aluno.status}">${aluno.status}</span><br>
                    <small style="font-weight:bold; color:${aluno.levou_recepcao ? '#16a34a' : '#ef4444'}">
                        ${aluno.levou_recepcao ? '✓ Levou na Recepção' : '✗ Não levou na Recepção'}
                    </small>
                </td>
                <td style="max-width:250px; font-size:12px; color:#555;">
                    <div style="max-height:60px; overflow-y:auto; border:1px solid #eee; padding:5px; border-radius:5px; background:#fcfcfc;">
                        <strong>Feedback Coach:</strong><br>
                        ${aluno.feedback_coach || '<em>Aguardando feedback...</em>'}
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:8px; margin-bottom:5px;">
                        <button class="btn-wpp ${aluno.avaliacao_enviada ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'avaliacao', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:16px;">star</span><span>Avaliação</span>
                        </button>
                        <button class="btn-wpp ${aluno.feedback_enviado ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'feedback', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:16px;">assignment</span><span>Feedback</span>
                        </button>
                    </div>
                    <span class="tag-status-pos ${isPendente ? 'tag-status-pos--pendente' : 'tag-status-pos--ok'}">
                        ${isPendente ? 'Aguardando' : 'Finalizado'}
                    </span>
                </td>
            </tr>`;
    }).join('');
}

// Global window.enviarMensagem e carregamento igual ao anterior...
window.enviarMensagem = async (id, tipo, telefone, nome) => {
    let msg = tipo === 'avaliacao' ? `Olá ${nome}! Como foi sua aula hoje?` : `Oi ${nome}, segue o link para feedback: [LINK]`;
    window.open(linkWhatsApp(telefone, msg), '_blank');
    const update = tipo === 'avaliacao' ? { avaliacao_enviada: true } : { feedback_enviado: true };
    await supabase.from("agendamentos").update(update).eq("id", id);
    carregarPosAula();
};

document.addEventListener("DOMContentLoaded", carregarPosAula);