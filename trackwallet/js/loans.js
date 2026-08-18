/**
 * TrackWallet — Loans & EMI JavaScript
 */

let loans = [];
let cachedAccounts = [];

document.addEventListener('DOMContentLoaded', async () => {
  initApp('loans', 'Loans & EMI');
  await loadAccountDropdown();
  loadLoans();

  document.getElementById('loan-form').addEventListener('submit', handleLoanSubmit);
  document.getElementById('pay-form').addEventListener('submit', handlePaySubmit);
});

async function loadAccountDropdown() {
  try {
    cachedAccounts = await API.accounts.getAll();
    const select = document.getElementById('loan-account');
    if (select) {
      select.innerHTML = '<option value="">None (Standalone)</option>' +
        cachedAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load accounts for loans:', err);
  }
}

async function loadLoans() {
  const container = document.getElementById('loans-grid');
  try {
    loans = await API.loans.getAll();

    if (!loans || loans.length === 0) {
      showEmptyState(container, 'No Loans Found', 'Add your active loans or EMIs to track payments', 'credit_score');
      setText('total-debt-val', '₹0');
      setText('total-emi-val', '₹0');
      return;
    }

    const totalDebt = loans.reduce((sum, l) => sum + (l.outstanding || 0), 0);
    const totalEmi = loans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

    setText('total-debt-val', formatINR(totalDebt));
    setText('total-emi-val', formatINR(totalEmi));

    container.innerHTML = loans.map(l => {
      const total = l.principal || l.outstanding;
      const paid = l.totalPaid || 0;
      const progressPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

      return `
        <div class="loan-card">
          <div class="loan-card-header">
            <div>
              <div class="loan-title">${l.name}</div>
              <div class="loan-lender">${l.lender || 'Personal Loan'}</div>
            </div>
            <span class="badge ${l.status === 'PAID' ? 'badge-success' : 'badge-loan'}">${l.status}</span>
          </div>

          <div class="loan-amounts">
            <div>
              <div class="loan-amt-label">Outstanding</div>
              <div class="loan-amt-val" style="color:var(--danger)">${formatINR(l.outstanding)}</div>
            </div>
            <div>
              <div class="loan-amt-label">Monthly EMI</div>
              <div class="loan-amt-val" style="color:var(--warning)">${formatINR(l.emiAmount)}</div>
            </div>
          </div>

          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px">
              <span>Paid: ${formatINR(paid)}</span>
              <span>${progressPercent}% Paid</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill success" style="width:${progressPercent}%"></div>
            </div>
          </div>

          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">
            <div>Next Due: <strong>${l.nextPaymentDate ? formatDate(l.nextPaymentDate) : 'Not scheduled'}</strong></div>
            ${l.interestRate ? `<div style="margin-top:2px">Interest Rate: ${l.interestRate}% p.a.</div>` : ''}
          </div>

          <div class="flex gap-sm justify-between" style="border-top:1px solid var(--border);padding-top:12px">
            <button class="btn btn-success btn-sm" onclick="openPayModal('${l.id}', ${l.emiAmount})" ${l.outstanding <= 0 ? 'disabled' : ''}>
              <span class="material-icons-round" style="font-size:16px">check_circle</span> Mark Paid
            </button>

            <div class="flex gap-xs">
              <button class="btn btn-ghost btn-sm" onclick="editLoan('${l.id}')">
                <span class="material-icons-round" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm" onclick="deleteLoan('${l.id}')" style="color:var(--danger)">
                <span class="material-icons-round" style="font-size:16px">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load loans:', err);
    showEmptyState(container, 'Error', 'Failed to load loans');
  }
}

function openAddLoanModal() {
  setText('loan-modal-title', 'Add Loan / EMI');
  setVal('loan-id', '');
  setVal('loan-name', '');
  setVal('loan-lender', '');
  setVal('loan-type', 'PERSONAL');
  setVal('loan-principal', '0');
  setVal('loan-outstanding', '0');
  setVal('loan-emi', '0');
  setVal('loan-rate', '0');
  setVal('loan-next-date', today());
  setVal('loan-account', '');
  setVal('loan-notes', '');
  openModal('loan-modal');
}

function editLoan(id) {
  const loan = loans.find(l => l.id === id);
  if (!loan) return;

  setText('loan-modal-title', 'Edit Loan / EMI');
  setVal('loan-id', loan.id);
  setVal('loan-name', loan.name);
  setVal('loan-lender', loan.lender || '');
  setVal('loan-type', loan.loanType || 'PERSONAL');
  setVal('loan-principal', loan.principal);
  setVal('loan-outstanding', loan.outstanding);
  setVal('loan-emi', loan.emiAmount);
  setVal('loan-rate', loan.interestRate);
  setVal('loan-next-date', dateToInput(loan.nextPaymentDate));
  setVal('loan-account', loan.accountId || '');
  setVal('loan-notes', loan.notes || '');
  openModal('loan-modal');
}

async function handleLoanSubmit(e) {
  e.preventDefault();
  const id = getVal('loan-id');

  const data = {
    name: getVal('loan-name'),
    lender: getVal('loan-lender'),
    loanType: getVal('loan-type'),
    principal: parseAmount(getVal('loan-principal')),
    outstanding: parseAmount(getVal('loan-outstanding')),
    emiAmount: parseAmount(getVal('loan-emi')),
    interestRate: parseAmount(getVal('loan-rate')),
    nextPaymentDate: getVal('loan-next-date') || null,
    accountId: getVal('loan-account') || null,
    notes: getVal('loan-notes')
  };

  try {
    if (id) {
      await API.loans.update(id, data);
      Toast.success('Loan updated');
    } else {
      await API.loans.create(data);
      Toast.success('Loan created');
    }
    closeModal('loan-modal');
    loadLoans();
  } catch (err) {
    Toast.error(err.message || 'Failed to save loan');
  }
}

function deleteLoan(id) {
  confirmAction('Are you sure you want to delete this loan?', async () => {
    try {
      await API.loans.delete(id);
      Toast.success('Loan deleted');
      loadLoans();
    } catch (err) {
      Toast.error('Failed to delete loan');
    }
  });
}

function openPayModal(loanId, defaultAmount) {
  setVal('pay-loan-id', loanId);
  setVal('pay-amount', defaultAmount || '0');
  setVal('pay-date', today());
  openModal('pay-modal');
}

async function handlePaySubmit(e) {
  e.preventDefault();
  const loanId = getVal('pay-loan-id');
  const amount = parseAmount(getVal('pay-amount'));
  const paymentDate = getVal('pay-date');

  try {
    await API.loans.markPaid(loanId, { amount, paymentDate });
    Toast.success('EMI Payment recorded successfully');
    closeModal('pay-modal');
    loadLoans();
  } catch (err) {
    Toast.error(err.message || 'Failed to record payment');
  }
}
