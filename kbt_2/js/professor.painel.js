// /public/js/professor.painel.js
import { supabase } from "./supabaseCliente.js";
import { formatarDataBR } from "./util.js";

let cache = [];

function classeStatus(status){
  if (status === "confirmado") return "card-aula__status--confirmado";
  if (status === "faltou") return "card-aula__status--faltou";
  if (status === "atribuido") return "card-aula__status--atribuido";
  return "card-aula__status--pendente";
}

function textoStatus(status){
  if (status === "confirmado") return "Confirmed";
  if (status === "faltou") return "No Show";
  if (status === "atribuido") return "Assigned";
  return "Pending";
}

function criarCard(ag){
  const card = document.createElement("article");
  card.className = "card-aula";

  const statusClass = classeStatus(ag.status);
  const statusTxt = textoStatus(ag.status);

  card.innerHTML = `
    <div class="card-aula__foto">
      <span class="card-aula__status ${statusClass}">${statusTxt}</span>
    </div>

    <h3 class="card-aula__nome">${ag.aluno_nome || "Sem nome"}</h3>

    <div class="card-aula__linha">
      <span class="material-symbols-outlined" style="font-size:18px;">schedule</span>
      <span>${formatarDataBR(ag.data_aula)}</span>
    </div>

    <div class="card-aula__tag">
      <span class="material-symbols-outlined" style="font-size:18px;">bolt</span>
      <span>${ag.tipo_aula || "Aula"}</span>
    </div>

    <a class="card-aula__link" href="../paginas/detalhe.html?id=${ag.id}">
      Abrir detalhes
      <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>
    </a>
  `;
  return card;
}

function aplicarFiltros(lista){
  const filtroStatus = document.getElementById("filtroStatus")?.value || "todos";
  const busca = (document.getElementById("busca")?.value || "").toLowerCase().trim();

  return lista.filter((ag) => {
    if (filtroStatus !== "todos" && ag.status !== filtroStatus) return false;
    if (busca && !(ag.aluno_nome || "").toLowerCase().includes(busca)) return false;
    return true;
  });
}

function contarHoje(lista){
  const hoje = new Date();
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0,0,0);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23,59,59);

  return lista.filter(a => {
    const dt = new Date(a.data_aula);
    return dt >= ini && dt <= fim;
  }).length;
}

async function carregarMinhasAulas(){
  const container = document.getElementById("gradeAulasProfessor");
  if (!container) return;

  container.innerHTML = `<p class="vazio">Carregando…</p>`;

  const { data: sessao } = await supabase.auth.getSession();
  const user = sessao?.session?.user;

  if (!user) {
    window.location.href = "../paginas/login.html";
    return;
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .select("id, aluno_nome, aluno_whatsapp, data_aula, tipo_aula, status, professor_id")
    .eq("professor_id", user.id)
    .order("data_aula", { ascending: true });

  if (error) {
    container.innerHTML = `<p class="vazio">Erro ao carregar.</p>`;
    return;
  }

  cache = data || [];
  renderizar();

  const totalHoje = contarHoje(cache);
  const nome = window.__perfil?.nome || "Professor(a)";
  const titulo = document.getElementById("tituloProfessor");
  const subtitulo = document.getElementById("subtituloProfessor");
  if (titulo) titulo.textContent = `Olá, ${nome}`;
  if (subtitulo) subtitulo.textContent = `Você tem ${totalHoje} aulas experimentais para hoje.`;
}

function renderizar(){
  const container = document.getElementById("gradeAulasProfessor");
  if (!container) return;

  const filtrados = aplicarFiltros(cache);

  if (!filtrados.length) {
    container.innerHTML = `<p class="vazio">Nenhuma aula encontrada.</p>`;
    return;
  }

  container.innerHTML = "";
  filtrados.forEach((ag) => container.appendChild(criarCard(ag)));
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("gradeAulasProfessor")) return;

  await carregarMinhasAulas();

  ["filtroStatus", "busca"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderizar);
    el.addEventListener("change", renderizar);
  });

  const btnAtualizar = document.getElementById("btnAtualizar");
  if (btnAtualizar) btnAtualizar.addEventListener("click", carregarMinhasAulas);

  document.querySelectorAll(".aba").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach(b => b.classList.remove("aba--ativa"));
      btn.classList.add("aba--ativa");
    });
  });
});
