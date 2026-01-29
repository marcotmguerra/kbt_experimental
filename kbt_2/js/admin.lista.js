// Fragmento para atualizar stats no admin.lista.js
function atualizarStats(agendamentos) {
  const total = agendamentos.length;
  const confirmados = agendamentos.filter(a => a.status === 'confirmado').length;
  const matriculados = agendamentos.filter(a => a.matriculado).length;

  // Taxa de Conversão: Matriculados / Confirmados
  const conversao = confirmados > 0 ? ((matriculados / confirmados) * 100).toFixed(0) : 0;

  document.getElementById("statPendentes").textContent = agendamentos.filter(a => a.status === 'pendente').length;
  document.getElementById("statProfessores").textContent = conversao + "%";
  document.querySelector(".stat-card:nth-child(2) .stat-card__label").textContent = "Conversão (Vendas)";
  document.getElementById("statHoje").textContent = matriculados;
  document.querySelector(".stat-card:nth-child(3) .stat-card__label").textContent = "Total Matrículas";
}