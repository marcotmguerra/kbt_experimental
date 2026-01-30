import { supabase } from "./supabaseCliente.js";
import { formatarDataBR, linkWhatsApp, showToast } from "./util.js";

async function carregarPosAula() {
    const lista = document.getElementById("listaPosAula");
    if (!lista) return;

    // Busca apenas Confirmados ou Faltas (Pós-aula)
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .in("status", ["confirmado", "faltou"])
        .order("data_aula", { ascending: false });

    if (error) return;

    // Atualiza Stats
    const pendentes = data.filter(a => !a.avaliacao_enviada || !a.feedback_enviado).length;
    document.getElementById("statPendentesPos").textContent = pendentes;

    if (data.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" class="tabela__vazio">Nenhum aluno finalizou aula experimental ainda.</td></tr>`;
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
                    </div>
                </td>
                <td><span class="status-pill status-${aluno.status}">${aluno.status}</span></td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-wpp ${aluno.avaliacao_enviada ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'avaliacao', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:16px;">star</span>
                            ${aluno.avaliacao_enviada ? 'Enviado' : 'Avaliação'}
                        </button>
                        <button class="btn-wpp ${aluno.feedback_enviado ? 'btn-wpp--enviado' : ''}" 
                                onclick="window.enviarMensagem('${aluno.id}', 'feedback', '${aluno.aluno_whatsapp}', '${aluno.aluno_nome}')">
                            <span class="material-symbols-outlined" style="font-size:16px;">assignment</span>
                            ${aluno.feedback_enviado ? 'Enviado' : 'Link Forms'}
                        </button>
                    </div>
                </td>
                <td>
                    <span class="tag-status-pos ${isPendente ? 'tag-status-pos--pendente' : 'tag-status-pos--ok'}">
                        <span class="material-symbols-outlined" style="font-size:14px;">
                            ${isPendente ? 'priority_high' : 'check_circle'}
                        </span>
                        ${isPendente ? 'Aguardando' : 'Finalizado'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Global para o onclick
window.enviarMensagem = async (id, tipo, telefone, nome) => {
    let msg = "";
    let updateData = {};

    if (tipo === 'avaliacao') {
        msg = `Olá ${nome}! Como foi sua aula experimental?`;
        updateData = { avaliacao_enviada: true };
    } else {
        msg = `Oi ${nome}, poderia responder nosso feedback? [LINK_DO_FORMS]`;
        updateData = { feedback_enviado: true };
    }

    window.open(linkWhatsApp(telefone, msg), '_blank');
    await supabase.from("agendamentos").update(updateData).eq("id", id);
    carregarPosAula();
};

document.addEventListener("DOMContentLoaded", carregarPosAula);