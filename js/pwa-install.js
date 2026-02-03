let deferredPrompt = null;

// Verifica se o app já está rodando como instalado
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobileDevice() {
  return (
    window.matchMedia("(max-width: 768px)").matches &&
    (navigator.maxTouchPoints > 0 || "ontouchstart" in window)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("pwa-install-banner");
  const btnInstall = document.getElementById("btn-pwa-install");
  const btnCancel = document.getElementById("btn-pwa-cancel");

  if (!banner || !btnInstall || !btnCancel) return;

  // Se já estiver instalado ou for desktop, não faz nada
  if (isStandalone() || !isMobileDevice()) return;

  // Fechar banner
  btnCancel.addEventListener("click", () => {
    banner.classList.remove("show");
  });

  // Lógica para iOS (Safari não tem prompt automático)
  if (isIOS()) {
    banner.classList.add("show");
    btnInstall.textContent = "Como instalar";
    btnInstall.addEventListener("click", () => {
      alert(
        "No iPhone/iPad:\n1) Toque no botão de Compartilhar (ícone do quadrado com seta)\n2) Role para baixo e escolha 'Adicionar à Tela de Início'"
      );
    });
    return;
  }

  // Lógica para Android/Chrome
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.add("show");
  });

  btnInstall.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    
    banner.classList.remove("show");
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }
    deferredPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    banner.classList.remove("show");
    deferredPrompt = null;
  });
});