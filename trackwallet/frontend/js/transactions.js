/**
 * TrackWallet — Transactions JavaScript
 */

let currentPage = 0;
const pageSize = 20;
let cachedAccounts = [];
let cachedCategories = [];
let currentTxList = [];

document.addEventListener('DOMContentLoaded', async () => {
  initApp('transactions', 'Transactions');
  await loadFilterDropdowns();
  initFilterEvents();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('add')) {
    openAddTransactionModal(urlParams.get('add').toUpperCase());
  } else if (urlParams.has('transfer')) {
    openTransferModal();
  }

  loadTransactions();
});

async function loadFilterDropdowns() {
  try {
    const [accs, cats] = await Promise.all([
      API.accounts.getAll(),
      API.categories.getAll()
    ]);

    cachedAccounts = accs;
    cachedCategories = cats;

    const filterAcc = document.getElementById('filter-account');
    if (filterAcc) {
      filterAcc.innerHTML = '<option value="">All Accounts</option>' +
        accs.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }

    const filterCat = document.getElementById('filter-category');
    if (filterCat) {
      filterCat.innerHTML = '<option value="">All Categories</option>' +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    populateModalSelects();
  } catch (err) {
    console.error('Failed to load dropdowns:', err);
  }
}

function populateModalSelects() {
  const txAcc = document.getElementById('tx-account');
  if (txAcc) {
    txAcc.innerHTML = '<option value="">Select Account</option>' +
      cachedAccounts.filter(a => a.isActive).map(a =>
        `<option value="${a.id}">${a.name} (${formatINR(a.currentBalance)})</option>`
      ).join('');
  }

  const txCat = document.getElementById('tx-category');
  if (txCat) {
    txCat.innerHTML = '<option value="">Select Category</option>' +
      cachedCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  const trFrom = document.getElementById('tr-from-account');
  const trTo = document.getElementById('tr-to-account');
  if (trFrom && trTo) {
    const options = '<option value="">Select Account</option>' +
      cachedAccounts.filter(a => a.isActive).map(a =>
        `<option value="${a.id}">${a.name} (${formatINR(a.currentBalance)})</option>`
      ).join('');
    trFrom.innerHTML = options;
    trTo.innerHTML = options;
  }
}

function initFilterEvents() {
  const searchInput = document.getElementById('tx-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      currentPage = 0;
      loadTransactions();
    }, 400));
  }

  ['filter-type', 'filter-account', 'filter-category', 'filter-review', 'filter-start-date', 'filter-end-date'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('change', () => {
        currentPage = 0;
        loadTransactions();
      });
    }
  });

  document.getElementById('tx-form').addEventListener('submit', handleTxSubmit);
  document.getElementById('transfer-form').addEventListener('submit', handleTransferSubmit);
}

function resetFilters() {
  setVal('tx-search', '');
  setVal('filter-type', '');
  setVal('filter-account', '');
  setVal('filter-category', '');
  setVal('filter-review', '');
  setVal('filter-start-date', '');
  setVal('filter-end-date', '');
  currentPage = 0;
  loadTransactions();
}

async function loadTransactions() {
  const tbody = document.getElementById('tx-table-body');
  try {
    const params = {
      page: currentPage,
      size: pageSize,
      search: getVal('tx-search'),
      type: getVal('filter-type'),
      accountId: getVal('filter-account'),
      categoryId: getVal('filter-category'),
      needsReview: getVal('filter-review') || null,
      startDate: getVal('filter-start-date'),
      endDate: getVal('filter-end-date')
    };

    const res = await API.transactions.getAll(params);
    currentTxList = res.content || [];

    if (currentTxList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:48px">
            <span class="material-icons-round" style="font-size:36px;color:var(--text-muted)">receipt_long</span>
            <div style="font-weight:600;margin-top:8px">No Transactions Found</div>
            <div style="font-size:12px;color:var(--text-muted)">Try adjusting your search or filters</div>
          </td>
        </tr>
      `;
      setHTML('tx-pagination', '');
      return;
    }

    tbody.innerHTML = currentTxList.map(t => {
      const isDebitTx = isDebit(t.type);
      const moneyOutVal = t.moneyOut || (isDebitTx ? t.amount : 0);
      const moneyInVal = t.moneyIn || (!isDebitTx ? t.amount : 0);

      return `
        <tr>
          <td style="white-space:nowrap">
            <div style="font-weight:600">${formatDate(t.transactionDate)}</div>
            <button class="source-badge" onclick="viewSource('${t.id}')">
              📄 Page ${t.sourcePage || 1}
            </button>
          </td>
          <td><span class="badge ${getTypeBadgeClass(t.type)}">${getTypeLabel(t.type)}</span></td>
          <td>
            <div style="font-weight:600;color:var(--text-primary)">${t.description || 'N/A'}</div>
            ${t.originalDescription && t.originalDescription !== t.description ? `<div style="font-size:11px;color:var(--primary-light)">Original: ${t.originalDescription}</div>` : ''}
          </td>
          <td>${t.accountName || '-'}</td>
          <td>
            ${t.categoryName ? `
              <div style="display:flex;align-items:center;gap:6px">
                <span class="color-dot" style="background:${t.categoryColor || '#6366f1'}"></span>
                <span>${t.categoryName}</span>
              </div>
            ` : '-'}
          </td>
          <td style="text-align:right" class="${moneyOutVal > 0 ? 'amount-expense' : 'text-muted'}">
            ${moneyOutVal > 0 ? formatINR(moneyOutVal) : '-'}
          </td>
          <td style="text-align:right" class="${moneyInVal > 0 ? 'amount-income' : 'text-muted'}">
            ${moneyInVal > 0 ? formatINR(moneyInVal) : '-'}
          </td>
          <td>
            ${t.needsReview ? '<span class="badge badge-warning">Needs Review</span>' : '<span class="badge badge-muted">Cleared</span>'}
          </td>
          <td style="text-align:right">
            <div class="action-menu">
              <button class="tx-actions-btn" title="View PDF Source" onclick="viewSource('${t.id}')">
                <span class="material-icons-round" style="font-size:18px;color:var(--primary-light)">find_in_page</span>
              </button>
              <button class="tx-actions-btn" title="Edit" onclick="editTransaction('${t.id}')">
                <span class="material-icons-round" style="font-size:18px">edit</span>
              </button>
              <button class="tx-actions-btn" title="Delete" onclick="deleteTransaction('${t.id}')">
                <span class="material-icons-round" style="font-size:18px;color:var(--danger)">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPagination(res.totalPages, res.currentPage);

  } catch (err) {
    console.error('Failed to load txs:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--danger);padding:24px">Failed to load transactions</td></tr>`;
  }
}

function renderPagination(totalPages, page) {
  const container = document.getElementById('tx-pagination');
  if (!container || totalPages <= 1) {
    setHTML('tx-pagination', '');
    return;
  }

  let html = `<button class="page-btn" ${page === 0 ? 'disabled' : ''} onclick="changePage(${page - 1})">‹</button>`;
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="changePage(${i})">${i + 1}</button>`;
    } else if (Math.abs(i - page) === 2) {
      html += `<span style="padding:0 4px;color:var(--text-muted)">...</span>`;
    }
  }
  html += `<button class="page-btn" ${page === totalPages - 1 ? 'disabled' : ''} onclick="changePage(${page + 1})">›</button>`;
  container.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  loadTransactions();
}

function viewSource(id) {
  const tx = currentTxList.find(t => t.id === id);
  if (!tx) return;

  setText('src-file-page', `${tx.sourceFile || 'twallet-statement_all_time.pdf'} — Page ${tx.sourcePage || 1}`);
  setText('src-raw-text', tx.rawText || tx.originalDescription || tx.description);
  setText('src-orig-desc', tx.originalDescription || tx.description);
  setText('src-curr-desc', tx.description);
  openModal('source-modal');
}

function openAddTransactionModal(type = 'EXPENSE') {
  setText('tx-modal-title', 'Add Transaction');
  setVal('tx-id', '');
  setVal('tx-type', type);
  setVal('tx-amount', '');
  setVal('tx-money-out', '');
  setVal('tx-money-in', '');
  setVal('tx-source-page', '1');
  setVal('tx-date', today());
  setVal('tx-description', '');
  setVal('tx-original-desc', '');
  setVal('tx-notes', '');
  setVal('tx-context', 'PERSONAL');
  setVal('tx-account', cachedAccounts[0]?.id || '');
  setVal('tx-category', '');

  openModal('tx-modal');
}

async function editTransaction(id) {
  try {
    const tx = await API.transactions.getById(id);
    setText('tx-modal-title', 'Edit Transaction');
    setVal('tx-id', tx.id);
    setVal('tx-type', tx.type);
    setVal('tx-amount', tx.amount);
    setVal('tx-money-out', tx.moneyOut || '');
    setVal('tx-money-in', tx.moneyIn || '');
    setVal('tx-source-page', tx.sourcePage || 1);
    setVal('tx-date', dateToInput(tx.transactionDate));
    setVal('tx-description', tx.description || '');
    setVal('tx-original-desc', tx.originalDescription || '');
    setVal('tx-notes', tx.notes || '');
    setVal('tx-context', tx.context || 'PERSONAL');
    setVal('tx-account', tx.accountId || '');
    setVal('tx-category', tx.categoryId || '');

    openModal('tx-modal');
  } catch (err) {
    Toast.error('Failed to load transaction for edit');
  }
}

async function handleTxSubmit(e) {
  e.preventDefault();
  const id = getVal('tx-id');

  const data = {
    type: getVal('tx-type'),
    amount: parseAmount(getVal('tx-amount')),
    moneyOut: parseAmount(getVal('tx-money-out')),
    moneyIn: parseAmount(getVal('tx-money-in')),
    sourcePage: parseInt(getVal('tx-source-page')) || 1,
    transactionDate: getVal('tx-date'),
    accountId: getVal('tx-account'),
    categoryId: getVal('tx-category') || null,
    context: getVal('tx-context'),
    description: getVal('tx-description'),
    originalDescription: getVal('tx-original-desc') || getVal('tx-description'),
    notes: getVal('tx-notes')
  };

  try {
    if (id) {
      await API.transactions.update(id, data);
      Toast.success('Transaction updated');
    } else {
      await API.transactions.create(data);
      Toast.success('Transaction added');
    }
    closeModal('tx-modal');
    loadTransactions();
  } catch (err) {
    Toast.error(err.message || 'Failed to save transaction');
  }
}

function deleteTransaction(id) {
  confirmAction('Are you sure you want to delete this transaction?', async () => {
    try {
      await API.transactions.delete(id);
      Toast.success('Transaction deleted');
      loadTransactions();
    } catch (err) {
      Toast.error('Failed to delete transaction');
    }
  });
}

function openTransferModal() {
  setVal('tr-amount', '');
  setVal('tr-date', today());
  setVal('tr-from-account', '');
  setVal('tr-to-account', '');
  openModal('transfer-modal');
}

async function handleTransferSubmit(e) {
  e.preventDefault();
  const fromAcc = getVal('tr-from-account');
  const toAcc = getVal('tr-to-account');

  if (fromAcc === toAcc) {
    Toast.warning('From and To accounts cannot be the same');
    return;
  }

  const data = {
    fromAccountId: fromAcc,
    toAccountId: toAcc,
    amount: parseAmount(getVal('tr-amount')),
    date: getVal('tr-date')
  };

  try {
    await API.transfers.create(data);
    Toast.success('Money transferred successfully');
    closeModal('transfer-modal');
    loadTransactions();
  } catch (err) {
    Toast.error(err.message || 'Failed to complete transfer');
  }
}

function handleTypeChange() {
  const type = getVal('tx-type');
  const context = document.getElementById('tx-context');
  if (type === 'LOAN_PAYMENT' || type === 'INTEREST') {
    if (context) context.value = 'DEBT';
  } else if (type === 'INCOME') {
    if (context) context.value = 'PERSONAL';
  }
}
