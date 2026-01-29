// /public/js/professor.painel.js
import { supabase } from "./supabaseCliente.js";
import { formatarDataBR } from "./util.js";

let cache = [];
let abaAtiva = "Hoje"; // Define a aba inicial

async function garantirPerfil(user) {
  let { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    const { data: novoPerfil } = await supabase
      .from("profiles")
      .insert([{ id: user.id, nome: user.email.split("@")[0], role: "professor", ativo: true }])
      .select().single();
    perfil = novoPerfil;
  }
  window.__perfil = perfil;
  return perfil;
}

// --- FUNÇÃO PARA OS EMOJIS POR TIPO ---

function obterEmojiTipo(tipo) {
  const t = (tipo || "").toLowerCase();
  
  if (t.includes("experimental") || t.includes("teste"))
  return '<span class="material-symbols-outlined">add_reaction</span>';

if (t.includes("crossfit"))
  return '<span class="material-symbols-outlined">fitness_center</span>';

if (t.includes("strong"))
  return '<span class="material-symbols-outlined">exercise</span>';

if (t.includes("kids") || t.includes("peso"))
  return '<span class="material-symbols-outlined">child_hat</span>';

if (t.includes("cardio") || t.includes("yoga"))
  return '<span class="material-symbols-outlined">mode_heat</span>';

if (t.includes("hirox"))
  return '<span class="material-symbols-outlined">sprint</span>';

  
  return "⚡"; // Emoji padrão se não encontrar nenhum
}

// Lógica de filtragem por data para as abas
function filtrarPorData(lista, aba) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const fimDaSemana = new Date(hoje);
  fimDaSemana.setDate(hoje.getDate() + 7);

  return lista.filter(ag => {
    const dataAula = new Date(ag.data_aula);
    dataAula.setHours(0, 0, 0, 0);

    if (aba === "Hoje") {
      return dataAula.getTime() === hoje.getTime();
    } else if (aba === "Esta semana") {
      return dataAula >= hoje && dataAula <= fimDaSemana;
    } else if (aba === "Próximas") {
      return dataAula > hoje;
    } else if (aba === "Passadas") {
      return dataAula < hoje;
    }
    return true;
  });
}

function aplicarFiltros(lista) {
  const filtroStatus = document.getElementById("filtroStatus")?.value || "todos";
  const busca = (document.getElementById("busca")?.value || "").toLowerCase().trim();

  // 1. Filtra pela aba selecionada (Data)
  let filtrados = filtrarPorData(lista, abaAtiva);

  // 2. Filtra pelo status selecionado
  if (filtroStatus !== "todos") {
    filtrados = filtrados.filter(ag => ag.status === filtroStatus);
  }

  // 3. Filtra pela busca de nome
  if (busca) {
    filtrados = filtrados.filter(ag => (ag.aluno_nome || "").toLowerCase().includes(busca));
  }

  return filtrados;
}

function criarCard(ag) {
  const card = document.createElement("article");
  card.className = "card-aula";
  
  // Lógica de Status
  const statusTraduzido = {
    confirmado: { classe: "confirmado", texto: "Confirmado" },
    faltou: { classe: "faltou", texto: "Faltou" },
    atribuido: { classe: "atribuido", texto: "Atribuído" },
    pendente: { classe: "pendente", texto: "Pendente" }
  };
  
  const status = statusTraduzido[ag.status] || statusTraduzido.pendente;

  // Lógica de Emoji
  const emoji = obterEmojiTipo(ag.tipo_aula);

  card.innerHTML = `
    <!-- Badge de Status -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: -10px;">
        <span class="card-aula__status card-aula__status--${status.classe}" style="position: static; font-size: 10px;">
            ${status.texto}
        </span>
    </div>

    <h3 class="card-aula__nome">${ag.aluno_nome || "Sem nome"}</h3>
    
    <div class="card-aula__linha">
      <span class="material-symbols-outlined">schedule</span>
      <span>${formatarDataBR(ag.data_aula)}</span>
    </div>

    <div class="card-aula__tag">
      <span style="margin-right: 4px;">${emoji}</span>
      <span>${ag.tipo_aula || "Experimental"}</span>
    </div>

    <a class="card-aula__link" href="../paginas/detalhe.html?id=${ag.id}">
      Detalhes <span class="material-symbols-outlined">arrow_forward</span>
    </a>
  `;
  return card;
}

function renderizar() {
  const container = document.getElementById("gradeAulasProfessor");
  if (!container) return;

  const filtrados = aplicarFiltros(cache);
  container.innerHTML = "";

  if (filtrados.length === 0) {
    container.innerHTML = `<p class="vazio">Nenhuma aula encontrada para "${abaAtiva}".</p>`;
    return;
  }

  filtrados.forEach(ag => container.appendChild(criarCard(ag)));
}

async function carregarMinhasAulas() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }

  const perfil = await garantirPerfil(session.user);
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("professor_id", session.user.id)
    .order("data_aula", { ascending: true });

  if (!error) {
    cache = data || [];
    renderizar();
    
    // Atualiza subtitulo com contagem de hoje
    const hojeCount = filtrarPorData(cache, "Hoje").length;
    document.getElementById("tituloProfessor").textContent = `Olá, ${perfil.nome}`;
    document.getElementById("subtituloProfessor").textContent = `Você tem ${hojeCount} aulas para hoje.`;
  }
}

// Configuração dos eventos
document.addEventListener("DOMContentLoaded", () => {
  carregarMinhasAulas();

  // Evento para as ABAS
  document.querySelectorAll(".aba").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach(b => b.classList.remove("aba--ativa"));
      btn.classList.add("aba--ativa");
      abaAtiva = btn.textContent.trim();
      renderizar();
    });
  });

  document.getElementById("filtroStatus")?.addEventListener("change", renderizar);
  document.getElementById("busca")?.addEventListener("input", renderizar);
  document.getElementById("btnAtualizar")?.addEventListener("click", carregarMinhasAulas);
});