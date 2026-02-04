document.addEventListener("DOMContentLoaded", () => {
  const paginaAtual = window.location.pathname.split("/").pop();

  document.querySelectorAll(".nav-mobile__item").forEach(item => {
    const href = item.getAttribute("href");
    const paginaLink = href.split("/").pop();

    if (paginaAtual === paginaLink) {
      item.classList.add("nav-mobile__item--ativo");
    } else {
      item.classList.remove("nav-mobile__item--ativo");
    }
  });
});
