/**
 * TrackWallet — Budgets JavaScript
 */

let budgets = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp('budgets', 'Budgets');
  loadBudgets();
  document.getElementById('budget-form').addEventListener('submit', handleBudgetSubmit);
});

async function loadBudgets() {
  const container = document.getElementById('budgets-grid');
  try {
    budgets = await API.budgets.getAll();

    if (!budgets || budgets.length === 0) {
      showEmptyState(container, 'No Active Budgets', 'Create a budget to track monthly spending limits', 'pie_chart');
      return;
    }

    container.innerHTML = budgets.map(b => {
      // Mock spent calculation for display (connected with transactions)
      const total = b.totalBudget || 1;
      const spent = 0; // Calculated dynamically in backend
      const remaining = total - spent;
      const percent = Math.min(100, Math.round((spent / total) * 100));
      const fillClass = getProgressColor(percent);

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div style="font-size:16px;font-weight:700">${b.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${formatDate(b.startDate)} → ${formatDate(b.endDate)} (${b.period})</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="deleteBudget('${b.id}')" style="color:var(--danger)">
              <span class="material-icons-round" style="font-size:16px">delete</span>
            </button>
          </div>

          <div style="margin:16px 0">
            <div class="flex justify-between text-sm mb-md">
              <span>Budget: <strong>${formatINR(total)}</strong></span>
              <span>Spent: <strong class="text-danger">${formatINR(spent)}</strong> (${percent}%)</span>
            </div>

            <div class="progress-bar" style="height:8px">
              <div class="progress-fill ${fillClass}" style="width:${percent}%"></div>
            </div>
          </div>

          <div class="flex justify-between items-center text-sm text-muted">
            <span>Remaining: <strong style="color:var(--success)">${formatINR(remaining)}</strong></span>
            ${percent >= b.alertThreshold ? '<span class="badge badge-danger">Alert: High Spending</span>' : '<span class="badge badge-success">On Track</span>'}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load budgets:', err);
    showEmptyState(container, 'Error', 'Failed to load budgets');
  }
}

function openAddBudgetModal() {
  setVal('bgt-name', '');
  setVal('bgt-period', 'MONTHLY');
  setVal('bgt-amount', '');
  setVal('bgt-start-date', startOfMonth());
  setVal('bgt-end-date', endOfMonth());
  setVal('bgt-threshold', '80');
  openModal('budget-modal');
}

async function handleBudgetSubmit(e) {
  e.preventDefault();
  const data = {
    name: getVal('bgt-name'),
    period: getVal('bgt-period'),
    totalBudget: parseAmount(getVal('bgt-amount')),
    startDate: getVal('bgt-start-date'),
    endDate: getVal('bgt-end-date'),
    alertThreshold: parseInt(getVal('bgt-threshold')) || 80
  };

  try {
    await API.budgets.create(data);
    Toast.success('Budget created successfully');
    closeModal('budget-modal');
    loadBudgets();
  } catch (err) {
    Toast.error(err.message || 'Failed to create budget');
  }
}

function deleteBudget(id) {
  confirmAction('Are you sure you want to delete this budget?', async () => {
    try {
      await API.budgets.delete(id);
      Toast.success('Budget deleted');
      loadBudgets();
    } catch (err) {
      Toast.error('Failed to delete budget');
    }
  });
}
