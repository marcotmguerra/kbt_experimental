import { supabase } from "./supabaseCliente.js";

async function conferirSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  const path = window.location.pathname;
  const paginaAtual = path.split("/").pop();

  // Se não estiver logado e não estiver na tela de login, volta pro login
  if (!session && paginaAtual !== "login.html") {
    window.location.href = "../paginas/login.html";
    return;
  }

  if (session) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", session.user.id)
      .single();

    const elAdmin = document.getElementById("usuarioAdmin");
    if (elAdmin) elAdmin.textContent = "Usuário: " + (perfil?.nome || session.user.email);
  }
}

// Lógica de Logout
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btnSair")) {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  }
});

conferirSessao();

document.addEventListener("DOMContentLoaded", () => {
  const btnAbrir = document.getElementById("btnAbrirMenu");
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.createElement("div");
  backdrop.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9998;";
  document.body.appendChild(backdrop);

  btnAbrir?.addEventListener("click", () => {
    sidebar.classList.add("sidebar--aberto");
    backdrop.style.display = "block";
  });

  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("sidebar--aberto");
    backdrop.style.display = "none";
  });
});