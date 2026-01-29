// /public/js/professor.detalhe.js
import { supabase } from "./supabaseCliente.js";
import { showToast, formatarDataBR, linkWhatsApp, getQueryParam } from "./util.js";

async function carregar() {
  const id = getQueryParam("id");
  if (!id) return (window.location.href = "login.html");

  const { data: ag, error } = await supabase
    .from("agendamentos")
    .select("*, profiles(nome)")
    .eq("id", id)
    .single();

  if (error || !ag) return showToast("Erro ao carregar detalhes", "erro");

  // 1. Preenche Dados Básicos
  document.getElementById("detAluno").textContent = ag.aluno_nome;
  document.getElementById("detData").textContent = formatarDataBR(ag.data_aula);
  document.getElementById("detTipo").textContent = ag.tipo_aula || "Experimental";
  document.getElementById("detWhatsapp").textContent = ag.aluno_whatsapp || "Não informado";
  document.getElementById("detStatus").textContent = ag.status?.toUpperCase() || "PENDENTE";
  document.getElementById("badgeStatus").textContent = ag.status || "pendente";
  document.getElementById("badgeStatus").className = `status-pill status-${ag.status}`;

  // 2. Configura WhatsApp
  const btnZap = document.getElementById("btnWhatsapp");
  btnZap.href = linkWhatsApp(ag.aluno_whatsapp, `Olá ${ag.aluno_nome}, aqui é da Kabuto! Confirmado sua aula dia ${formatarDataBR(ag.data_aula)}?`);

  // 3. Processa Informações do Forms (form_raw)
  // ... dentro da função carregar() ...

  // 3. Processar e exibir as informações em RAW (Formulário)
  const containerForms = document.getElementById("detFormRaw");
  
  if (ag.form_raw) {
    try {
      // Garante que os dados sejam um objeto (se vier string, transforma em JSON)
      const dadosRaw = typeof ag.form_raw === 'string' ? JSON.parse(ag.form_raw) : ag.form_raw;
      
      // Limpa o "Carregando..."
      containerForms.innerHTML = "";

      // Transforma o JSON em elementos HTML legíveis
      const entradas = Object.entries(dadosRaw);

      if (entradas.length === 0) {
        containerForms.innerHTML = `<p class="vazio">Nenhuma resposta detalhada encontrada.</p>`;
      } else {
        entradas.forEach(([chave, valor]) => {
          // Formata a chave para ficar bonita (ex: "objetivo_aluno" vira "Objetivo Aluno")
          const chaveFormatada = chave
            .replace(/_/g, " ")
            .replace(/^\w/, (c) => c.toUpperCase());

          const itemDiv = document.createElement("div");
          itemDiv.className = "item-raw"; // Você pode estilizar essa classe no CSS
          itemDiv.style.cssText = "margin-bottom: 16px; border-bottom: 1px solid #f0f2f5; padding-bottom: 8px;";
          
          itemDiv.innerHTML = `
            <label style="display: block; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
              ${chaveFormatada}
            </label>
            <span style="display: block; font-size: 16px; color: #111827; font-weight: 500;">
              ${valor || "—"}
            </span>
          `;
          containerForms.appendChild(itemDiv);
        });
      }
    } catch (err) {
      console.error("Erro ao processar form_raw:", err);
      containerForms.innerHTML = `<p class="vazio">Erro ao ler dados do formulário.</p>`;
    }
  } else {
    containerForms.innerHTML = `<p class="vazio">O aluno não preencheu informações adicionais.</p>`;
  }

// ... restante da função ...

  // 4. Lógica de Admin (Matrícula)
  // O window.__perfil é definido de forma assíncrona no guardas.js
  // Vamos verificar em um pequeno intervalo para garantir que o objeto existe
  const checarPerfil = setInterval(() => {
    const perfil = window.__perfil;
    if (perfil) {
      if (perfil.role === 'admin') {
        const secao = document.getElementById("secaoAdminVenda");
        const check = document.getElementById("checkMatriculado");
        if (secao) secao.hidden = false;
        if (check) {
          check.checked = ag.matriculado;
          check.onchange = async () => {
            const { error: errUpd } = await supabase.from("agendamentos").update({ matriculado: check.checked }).eq("id", id);
            if (!errUpd) showToast(check.checked ? "Venda registrada! 💸" : "Matrícula removida");
          };
        }
      }
      clearInterval(checarPerfil);
    }
  }, 100);

  // 5. Botões de Presença
  document.getElementById("btnConfirmar").onclick = async () => {
    const { error } = await supabase.from("agendamentos").update({ status: 'confirmado' }).eq("id", id);
    if (!error) {
        showToast("Presença confirmada!");
        location.reload(); // Recarrega para atualizar badge e status
    }
  };

  document.getElementById("btnFaltou").onclick = async () => {
    const { error } = await supabase.from("agendamentos").update({ status: 'faltou' }).eq("id", id);
    if (!error) {
        showToast("Falta registrada", "erro");
        location.reload();
    }
  };
}

document.addEventListener("DOMContentLoaded", carregar);