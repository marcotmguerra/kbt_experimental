// /js/autenticacao.js
import { supabase } from "./supabaseCliente.js";
import { mostrar, esconder, setTexto } from "./util.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) return;

  const msgErro = document.getElementById("msgErro");
  const msgCarregando = document.getElementById("msgCarregando");
  const btnEntrar = document.getElementById("btnEntrar");
  const checkLembrar = document.getElementById("lembrar");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset de mensagens
    esconder(msgErro);
    mostrar(msgCarregando);
    if (btnEntrar) btnEntrar.disabled = true;

    const email = document.getElementById("email")?.value?.trim();
    const senha = document.getElementById("senha")?.value;

    try {
      // O Supabase mantém a sessão no localStorage por padrão.
      // Se você quiser algo mais restrito quando o "Lembrar" estiver desmarcado, 
      // seria necessário configurar o cliente Supabase, mas para PWA 
      // o padrão persistente é o ideal.
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password: senha 
      });

      if (error) throw error;

      const userId = data.user.id;

      // Busca o perfil para saber o cargo (role)
      const { data: perfil, error: errPerfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (errPerfil) throw errPerfil;

      // REDIRECIONAMENTO:
      // Se o formulário está no index.html (raiz), o caminho é 'paginas/...'
      // Se estiver em paginas/login.html, o caminho seria 'admin.html'
      // Ajustado para funcionar a partir da raiz:
      if (perfil.role === "admin") {
        window.location.href = "paginas/admin.html";
      } else {
        window.location.href = "paginas/professor.html";
      }

    } catch (err) {
      // Mapeamento de erros comuns para mensagens amigáveis
      let mensagem = err.message;
      if (err.message === "Invalid login credentials") {
        mensagem = "E-mail ou senha incorretos.";
      }
      
      setTexto(msgErro, mensagem);
      mostrar(msgErro);
    } finally {
      esconder(msgCarregando);
      if (btnEntrar) btnEntrar.disabled = false;
    }
  });
});