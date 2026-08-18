/**
 * TrackWallet — Savings Goals JavaScript
 */

let goals = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp('goals', 'Savings Goals');
  loadGoals();
  document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);
});

async function loadGoals() {
  const container = document.getElementById('goals-grid');
  try {
    goals = await API.goals.getAll();

    if (!goals || goals.length === 0) {
      showEmptyState(container, 'No Savings Goals', 'Set a savings goal to stay motivated', 'savings');
      return;
    }

    container.innerHTML = goals.map(g => {
      const target = g.targetAmount || 1;
      const current = g.currentAmount || 0;
      const remaining = target - current;
      const percent = Math.min(100, Math.round((current / target) * 100));

      return `
        <div class="goal-card">
          <div class="goal-icon" style="background:${g.color || '#6366f1'}20;color:${g.color || '#6366f1'}">
            <span class="material-icons-round">${g.icon || 'savings'}</span>
          </div>

          <div class="flex justify-between items-center mb-md">
            <div>
              <div style="font-size:16px;font-weight:700">${g.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">
                ${g.deadline ? `Target Date: ${formatDate(g.deadline)}` : 'No deadline'}
              </div>
            </div>
            <span class="badge ${g.priority === 'HIGH' ? 'badge-danger' : 'badge-primary'}">${g.priority}</span>
          </div>

          <div style="margin:16px 0">
            <div class="flex justify-between text-sm mb-md">
              <span>Saved: <strong style="color:var(--success)">${formatINR(current)}</strong></span>
              <span>Target: <strong>${formatINR(target)}</strong></span>
            </div>

            <div class="progress-bar" style="height:8px">
              <div class="progress-fill success" style="width:${percent}%"></div>
            </div>

            <div class="flex justify-between text-sm text-muted mt-sm">
              <span>${percent}% Complete</span>
              <span>Need: <strong>${formatINR(remaining)}</strong></span>
            </div>
          </div>

          <div class="flex justify-end gap-xs" style="border-top:1px solid var(--border);padding-top:12px">
            <button class="btn btn-ghost btn-sm" onclick="deleteGoal('${g.id}')" style="color:var(--danger)">
              <span class="material-icons-round" style="font-size:16px">delete</span> Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load goals:', err);
    showEmptyState(container, 'Error', 'Failed to load savings goals');
  }
}

function openAddGoalModal() {
  setVal('goal-name', '');
  setVal('goal-target', '');
  setVal('goal-current', '0');
  setVal('goal-deadline', '');
  setVal('goal-priority', 'MEDIUM');
  openModal('goal-modal');
}

async function handleGoalSubmit(e) {
  e.preventDefault();
  const data = {
    name: getVal('goal-name'),
    targetAmount: parseAmount(getVal('goal-target')),
    currentAmount: parseAmount(getVal('goal-current')),
    deadline: getVal('goal-deadline') || null,
    priority: getVal('goal-priority')
  };

  try {
    await API.goals.create(data);
    Toast.success('Savings goal created');
    closeModal('goal-modal');
    loadGoals();
  } catch (err) {
    Toast.error(err.message || 'Failed to create goal');
  }
}

function deleteGoal(id) {
  confirmAction('Are you sure you want to delete this goal?', async () => {
    try {
      await API.goals.delete(id);
      Toast.success('Goal deleted');
      loadGoals();
    } catch (err) {
      Toast.error('Failed to delete goal');
    }
  });
}
