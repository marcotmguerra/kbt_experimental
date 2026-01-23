// /public/js/guardas.js
import { supabase } from "./supabaseCliente.js";
import { setTexto } from "./util.js";

async function obterPerfil(userId){
  const { data, error } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

document.addEventListener("DOMContentLoaded", async () => {
  const pagina = window.location.pathname.split("/").pop();
  if (pagina === "login.html") return;

  const { data: sessao } = await supabase.auth.getSession();
  const user = sessao?.session?.user;

  if (!user) {
    window.location.href = "../paginas/login.html";
    return;
  }

  let perfil;
  try {
    perfil = await obterPerfil(user.id);
  } catch {
    await supabase.auth.signOut();
    window.location.href = "../paginas/login.html";
    return;
  }

  // Escreve usuário onde existir
  const elAdmin = document.getElementById("usuarioAdmin");
  const elProf = document.getElementById("usuarioProfessor");
  if (elAdmin) setTexto(elAdmin, `Usuário: ${perfil.nome || user.email}`);
  if (elProf) setTexto(elProf, `Usuário: ${perfil.nome || user.email}`);

  // Protege rotas
  if (pagina === "admin.html" && perfil.role !== "admin") {
    window.location.href = "../paginas/professor.html";
    return;
  }

  // Botão sair (se existir)
  const btnSair = document.getElementById("btnSair");
  if (btnSair) {
    btnSair.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../paginas/login.html";
    });
  }

  // Disponibiliza global
  window.__perfil = perfil;
  window.__user = user;
});
