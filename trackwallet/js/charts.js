/**
 * TrackWallet — Charts Module
 * Chart.js wrappers for all financial charts
 */

// Chart.js defaults
function initChartDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.padding = 20;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1e2130';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

// Destroy chart if already exists
function destroyChart(id) {
  const existing = Chart.getChart(id);
  if (existing) existing.destroy();
}

// ============================================================
// Income vs Expense (Bar Chart)
// ============================================================
function renderIncomeExpenseChart(canvasId, labels, incomeData, expenseData) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 44,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 44,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => formatINRCompact(v) }
        }
      }
    }
  });
}

// ============================================================
// Expense Categories (Doughnut)
// ============================================================
function renderExpenseCategoryChart(canvasId, labels, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const colors = [
    '#6366f1', '#10b981', '#ef4444', '#f59e0b', '#06b6d4',
    '#ec4899', '#8b5cf6', '#84cc16', '#f97316', '#14b8a6',
    '#e11d48', '#0ea5e9', '#a855f7', '#22c55e', '#fb923c'
  ];

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#15181f',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, padding: 15 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatINR(ctx.raw)} (${((ctx.raw / ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`
          }
        }
      },
      cutout: '65%'
    }
  });
}

// ============================================================
// Monthly Cash Flow (Line)
// ============================================================
function renderCashFlowChart(canvasId, labels, netData) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Net Cash Flow',
        data: netData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Net: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => formatINRCompact(v) }
        }
      }
    }
  });
}

// ============================================================
// Account Balances (Horizontal Bar)
// ============================================================
function renderAccountBalancesChart(canvasId, labels, data, colors) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Balance',
        data,
        backgroundColor: colors || 'rgba(99, 102, 241, 0.7)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Balance: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => formatINRCompact(v) }
        },
        y: { grid: { display: false } }
      }
    }
  });
}

// ============================================================
// Business Revenue Trend (Line)
// ============================================================
function renderBusinessChart(canvasId, labels, revenueData, expenseData) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => formatINRCompact(v) }
        }
      }
    }
  });
}

// ============================================================
// Debt Breakdown (Pie)
// ============================================================
function renderDebtChart(canvasId, labels, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const colors = ['#ef4444','#f97316','#eab308','#ec4899','#f43f5e','#dc2626','#b91c1c'];

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#15181f',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 15 } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatINR(ctx.raw)}`
          }
        }
      }
    }
  });
}

// ============================================================
// Monthly Savings (Bar)
// ============================================================
function renderSavingsChart(canvasId, labels, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Net Savings',
        data,
        backgroundColor: data.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
        borderColor: data.map(v => v >= 0 ? '#10b981' : '#ef4444'),
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Savings: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => formatINRCompact(v) }
        }
      }
    }
  });
}
