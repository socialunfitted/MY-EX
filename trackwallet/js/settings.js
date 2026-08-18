/**
 * TrackWallet — Settings JavaScript
 */

let categories = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp('settings', 'Settings');
  loadCategories();
  document.getElementById('cat-form').addEventListener('submit', handleCatSubmit);
});

async function loadCategories() {
  const container = document.getElementById('cat-settings-list');
  try {
    categories = await API.categories.getAll();

    if (!categories || categories.length === 0) {
      showEmptyState(container, 'No Categories', 'Add your first category');
      return;
    }

    container.innerHTML = categories.map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="color-dot" style="background:${c.color || '#6366f1'}"></span>
          <span style="font-weight:600;font-size:13.5px">${c.name}</span>
          <span class="badge ${c.type === 'INCOME' ? 'badge-income' : 'badge-expense'}">${c.type}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="deleteCategory('${c.id}')" style="color:var(--danger)">
          <span class="material-icons-round" style="font-size:16px">delete</span>
        </button>
      </div>
    `).join('');

  } catch (err) {
    console.error('Failed to load categories:', err);
    showEmptyState(container, 'Error', 'Failed to load categories');
  }
}

function openAddCatModal() {
  setVal('cat-name', '');
  setVal('cat-type', 'EXPENSE');
  setVal('cat-color', '#6366f1');
  openModal('cat-modal');
}

async function handleCatSubmit(e) {
  e.preventDefault();
  const data = {
    name: getVal('cat-name'),
    type: getVal('cat-type'),
    color: getVal('cat-color')
  };

  try {
    await API.categories.create(data);
    Toast.success('Category created');
    closeModal('cat-modal');
    loadCategories();
  } catch (err) {
    Toast.error(err.message || 'Failed to create category');
  }
}

function deleteCategory(id) {
  confirmAction('Are you sure you want to delete this category?', async () => {
    try {
      await API.categories.delete(id);
      Toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      Toast.error('Failed to delete category');
    }
  });
}

async function exportFullBackup() {
  try {
    const [txs, accs, cats, loans, bizs, budgets, goals] = await Promise.all([
      API.transactions.getAll({ size: 10000 }),
      API.accounts.getAll(),
      API.categories.getAll(),
      API.loans.getAll(),
      API.businesses.getAll(),
      API.budgets.getAll(),
      API.goals.getAll()
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      app: 'TrackWallet',
      version: '1.0.0',
      transactions: txs.content || [],
      accounts: accs,
      categories: cats,
      loans,
      businesses: bizs,
      budgets,
      goals
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `TrackWallet_FULL_BACKUP_${today()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    Toast.success('Full system backup exported successfully!');

  } catch (err) {
    console.error('Backup export failed:', err);
    Toast.error('Failed to export backup');
  }
}
