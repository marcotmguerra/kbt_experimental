// /public/js/autenticacao.js
import { supabase } from "./supabaseCliente.js";
import { mostrar, esconder, setTexto } from "./util.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return;

  const msgErro = document.getElementById("msgErro");
  const msgCarregando = document.getElementById("msgCarregando");
  const btnEntrar = document.getElementById("btnEntrar");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    esconder(msgErro);
    mostrar(msgCarregando);
    if (btnEntrar) btnEntrar.disabled = true;

    const email = document.getElementById("email")?.value?.trim();
    const senha = document.getElementById("senha")?.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;

      const userId = data.user.id;

      const { data: perfil, error: errPerfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (errPerfil) throw errPerfil;

      if (perfil.role === "admin") window.location.href = "../paginas/admin.html";
      else window.location.href = "../paginas/professor.html";

    } catch (err) {
      setTexto(msgErro, err?.message || "Erro ao entrar.");
      mostrar(msgErro);
    } finally {
      esconder(msgCarregando);
      if (btnEntrar) btnEntrar.disabled = false;
    }
  });
});
