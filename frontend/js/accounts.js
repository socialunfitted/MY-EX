/**
 * TrackWallet — Accounts JavaScript
 */

let accounts = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp('accounts', 'Accounts');
  loadAccounts();
  document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
});

async function loadAccounts() {
  const container = document.getElementById('accounts-grid');
  try {
    accounts = await API.accounts.getAll();

    if (!accounts || accounts.length === 0) {
      showEmptyState(container, 'No Accounts', 'Add your first bank, cash, or loan account', 'account_balance_wallet');
      setText('total-assets-val', '₹0');
      return;
    }

    // Calculate total assets
    const totalAssets = accounts
      .filter(a => a.includeInTotal && a.accountType !== 'LOAN')
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    setText('total-assets-val', formatINR(totalAssets));

    container.innerHTML = accounts.map(a => {
      const isNegative = a.currentBalance < 0;
      const balanceClass = isNegative ? 'text-danger' : 'text-primary-color';

      return `
        <div class="account-card" style="--acc-color: ${a.color || '#6366f1'}">
          <div class="account-header">
            <div class="account-icon" style="background:${a.color}20">
              <span class="material-icons-round">${a.icon || 'account_balance_wallet'}</span>
            </div>
            <span class="badge ${a.isActive ? 'badge-success' : 'badge-muted'}">${a.accountType}</span>
          </div>

          <div class="account-name">${a.name}</div>
          <div class="account-type">${a.institution || a.accountType}</div>

          <div class="account-balance ${balanceClass}">
            ${formatINR(a.currentBalance)}
          </div>

          <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px">
            Opening: ${formatINR(a.openingBalance)}
          </div>

          <div class="account-footer">
            <button class="btn btn-ghost btn-sm" onclick="recalculateAccount('${a.id}')" title="Sync with transactions">
              <span class="material-icons-round" style="font-size:16px">sync</span> Sync
            </button>
            <div class="flex gap-xs">
              <button class="btn btn-ghost btn-sm" onclick="editAccount('${a.id}')">
                <span class="material-icons-round" style="font-size:16px">edit</span> Edit
              </button>
              <button class="btn btn-ghost btn-sm" onclick="deleteAccount('${a.id}')" style="color:var(--danger)">
                <span class="material-icons-round" style="font-size:16px">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load accounts:', err);
    showEmptyState(container, 'Error', 'Failed to load accounts');
  }
}

function openAddAccountModal() {
  setText('account-modal-title', 'Add Account');
  setVal('acc-id', '');
  setVal('acc-name', '');
  setVal('acc-type', 'BANK');
  setVal('acc-opening', '0');
  setVal('acc-institution', '');
  setVal('acc-color', '#6366f1');
  setVal('acc-icon', 'account_balance');
  setVal('acc-notes', '');
  openModal('account-modal');
}

function editAccount(id) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;

  setText('account-modal-title', 'Edit Account');
  setVal('acc-id', acc.id);
  setVal('acc-name', acc.name);
  setVal('acc-type', acc.accountType);
  setVal('acc-opening', acc.openingBalance);
  setVal('acc-institution', acc.institution || '');
  setVal('acc-color', acc.color || '#6366f1');
  setVal('acc-icon', acc.icon || 'account_balance_wallet');
  setVal('acc-notes', acc.notes || '');
  openModal('account-modal');
}

async function handleAccountSubmit(e) {
  e.preventDefault();
  const id = getVal('acc-id');

  const data = {
    name: getVal('acc-name'),
    accountType: getVal('acc-type'),
    openingBalance: parseAmount(getVal('acc-opening')),
    institution: getVal('acc-institution'),
    color: getVal('acc-color'),
    icon: getVal('acc-icon'),
    notes: getVal('acc-notes')
  };

  try {
    if (id) {
      await API.accounts.update(id, data);
      Toast.success('Account updated');
    } else {
      await API.accounts.create(data);
      Toast.success('Account created');
    }
    closeModal('account-modal');
    loadAccounts();
  } catch (err) {
    Toast.error(err.message || 'Failed to save account');
  }
}

function deleteAccount(id) {
  confirmAction('Are you sure you want to delete this account?', async () => {
    try {
      await API.accounts.delete(id);
      Toast.success('Account deleted');
      loadAccounts();
    } catch (err) {
      Toast.error('Failed to delete account');
    }
  });
}

async function recalculateAccount(id) {
  try {
    await API.accounts.recalculate(id);
    Toast.success('Balance synced with transactions');
    loadAccounts();
  } catch (err) {
    Toast.error('Failed to recalculate balance');
  }
}

async function recalculateAllBalances() {
  try {
    await Promise.all(accounts.map(a => API.accounts.recalculate(a.id)));
    Toast.success('All account balances synced!');
    loadAccounts();
  } catch (err) {
    Toast.error('Failed to recalculate balances');
  }
}
