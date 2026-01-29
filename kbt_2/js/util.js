export function showToast(mensagem, tipo = "sucesso") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  const icon = tipo === "sucesso" ? "check_circle" : "error";
  
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span style="font-weight:600">${mensagem}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-in reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// remover o toast temporario se pagar rebento

export function showToast(mensagem, tipo = "sucesso") {
  // Cria o container se não existir
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; display:grid; gap:10px;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  const cor = tipo === "sucesso" ? "#16a34a" : "#ef4444";
  
  toast.style.cssText = `
    background: #fff; color: #111418; padding: 16px 20px; border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-left: 6px solid ${cor};
    display: flex; align-items: center; gap: 12px; font-weight: 800;
    animation: slideIn 0.3s ease-out; font-family: Inter, sans-serif;
  `;

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="color:${cor}">
      ${tipo === "sucesso" ? "check_circle" : "error"}
    </span>
    ${mensagem}
  `;

  container.appendChild(toast);

  // Remover após 4 segundos
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "0.5s";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Adicione a animação no seu base.css
/*
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
*/