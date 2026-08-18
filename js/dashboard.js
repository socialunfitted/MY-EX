/**
 * TrackWallet — Dashboard JavaScript
 */

let currentStartDate = null;
let currentEndDate = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp('dashboard', 'Dashboard');
  initDateFilters();
  loadDashboardData();
});

function initDateFilters() {
  const pills = document.querySelectorAll('#date-filters .date-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      const range = e.target.dataset.range;
      if (!range) return;

      pills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');

      const now = new Date();
      if (range === 'today') {
        currentStartDate = today();
        currentEndDate = today();
      } else if (range === 'week') {
        const first = now.getDate() - now.getDay();
        const firstDay = new Date(now.setDate(first)).toISOString().split('T')[0];
        currentStartDate = firstDay;
        currentEndDate = today();
      } else if (range === 'month') {
        currentStartDate = startOfMonth();
        currentEndDate = today();
      } else if (range === 'year') {
        currentStartDate = startOfYear();
        currentEndDate = today();
      } else if (range === 'alltime') {
        currentStartDate = '2025-01-01';
        currentEndDate = today();
      }

      loadDashboardData();
    });
  });

  const applyBtn = document.getElementById('apply-custom');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const start = getVal('custom-start');
      const end = getVal('custom-end');
      if (start && end) {
        pills.forEach(p => p.classList.remove('active'));
        currentStartDate = start;
        currentEndDate = end;
        loadDashboardData();
      } else {
        Toast.warning('Please select both start and end dates');
      }
    });
  }
}

async function loadDashboardData() {
  try {
    const data = await API.dashboard.getSummary(currentStartDate, currentEndDate);

    // Update Date Range Label
    if (data.startDate && data.endDate) {
      setText('date-range-label', `${formatDate(data.startDate)} → ${formatDate(data.endDate)}`);
    } else {
      setText('date-range-label', 'Overall Financial Summary');
    }

    // Update Stat Cards with defensive defaults
    setText('stat-balance', formatINR(data.totalBalance || 0));
    setText('stat-income', formatINR(data.totalIncome || 0));
    setText('stat-expense', formatINR(data.totalExpense || 0));
    setText('stat-net', formatINR(data.netCashFlow || 0));
    setText('stat-debt', formatINR(data.totalDebt || 0));
    setText('stat-biz-rev', formatINR(data.businessRevenue || 0));
    setText('stat-biz-profit', formatINR(data.businessProfit || 0));
    
    const savings = (data.totalIncome || 0) - (data.totalExpense || 0);
    setText('stat-savings', formatINR(savings));

    // Render Charts safely
    try { renderCharts(data); } catch (ce) { console.error('Chart error:', ce); }

    // Render Lists
    renderAccounts(data.accounts || []);
    renderUpcomingEMIs(data.upcomingEmis || []);
    loadRecentTransactions();

  } catch (err) {
    console.error('Failed to load dashboard:', err);
    Toast.error('Failed to load dashboard data. Refreshing...');
  }
}

function renderCharts(data) {
  initChartDefaults();

  // Income vs Expense Chart
  renderIncomeExpenseChart(
    'chart-income-expense',
    ['Income', 'Expenses', 'Net'],
    [data.totalIncome || 0, 0, Math.max(0, data.netCashFlow || 0)],
    [0, data.totalExpense || 0, Math.abs(Math.min(0, data.netCashFlow || 0))]
  );

  // Categories Chart
  const categories = data.expenseByCategory || [];
  if (categories.length > 0) {
    const labels = categories.map(c => c.name);
    const amounts = categories.map(c => c.amount);
    renderExpenseCategoryChart('chart-categories', labels, amounts);

    const topHtml = categories.slice(0, 5).map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="font-weight:500">${c.name}</span>
        <span class="amount-expense">${formatINR(c.amount)}</span>
      </div>
    `).join('');
    setHTML('top-expenses', topHtml);
  } else {
    showEmptyState('chart-categories', 'No Data', 'No category expenses recorded for this period');
    showEmptyState('top-expenses', 'No Expenses', 'No recorded expenses');
  }
}

function renderAccounts(accounts) {
  const container = document.getElementById('accounts-list');
  if (!accounts || accounts.length === 0) {
    showEmptyState(container, 'No Accounts', 'No active accounts found', 'account_balance_wallet');
    return;
  }

  container.innerHTML = accounts.map(a => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:${a.color || '#6366f1'}20;color:${a.color || '#6366f1'};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-round" style="font-size:18px">${a.icon || 'account_balance_wallet'}</span>
        </div>
        <div>
          <div style="font-weight:600;font-size:13.5px">${a.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${a.type}</div>
        </div>
      </div>
      <div style="font-weight:700;font-size:14px;color:${(a.balance || a.currentBalance || 0) < 0 ? 'var(--danger)' : 'var(--text-primary)'}">
        ${formatINR(a.balance || a.currentBalance || 0)}
      </div>
    </div>
  `).join('');
}

function renderUpcomingEMIs(emis) {
  const container = document.getElementById('emi-list');
  if (!emis || emis.length === 0) {
    showEmptyState(container, 'No Pending EMIs', 'All EMIs are up to date', 'verified');
    return;
  }

  container.innerHTML = emis.map(e => `
    <div class="emi-card">
      <div class="emi-status-dot ${(e.status || 'UPCOMING').toLowerCase()}"></div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:13.5px">${e.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">Due: ${formatDate(e.nextPaymentDate)} (${e.daysRemaining || 0} days left)</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;font-size:14px;color:var(--danger)">${formatINR(e.emiAmount)}</div>
        <button class="btn btn-sm btn-primary" onclick="markEmiPaid('${e.id}', ${e.emiAmount})" style="margin-top:4px;padding:3px 8px;font-size:11px">
          Mark Paid
        </button>
      </div>
    </div>
  `).join('');
}

async function loadRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  try {
    const res = await API.transactions.getAll({ size: 6 });
    const txs = res.content || [];

    if (txs.length === 0) {
      showEmptyState(container, 'No Transactions', 'No recent transactions found', 'receipt_long');
      return;
    }

    container.innerHTML = txs.map(t => {
      const isDebitTx = isDebit(t.type);
      const amountClass = isDebitTx ? 'amount-expense' : isCredit(t.type) ? 'amount-income' : 'amount-neutral';
      const prefix = isDebitTx ? '-' : isCredit(t.type) ? '+' : '';

      return `
        <div class="tx-row">
          <div class="tx-icon" style="background:${t.categoryColor || '#6366f1'}20;color:${t.categoryColor || '#6366f1'}">
            <span class="material-icons-round">receipt</span>
          </div>
          <div class="tx-details">
            <div class="tx-desc">${t.description || t.categoryName || 'Transaction'}</div>
            <div class="tx-meta">${formatDate(t.transactionDate)} • ${t.accountName || 'N/A'}</div>
          </div>
          <div class="tx-amount ${amountClass}">
            ${prefix}${formatINR(t.amount)}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load recent tx:', err);
    showEmptyState(container, 'Error', 'Failed to load recent transactions');
  }
}

async function markEmiPaid(loanId, emiAmount) {
  confirmAction(`Mark EMI payment of ${formatINR(emiAmount)} as paid?`, async () => {
    try {
      await API.loans.markPaid(loanId, { amount: emiAmount, paymentDate: today() });
      Toast.success('EMI Payment recorded successfully');
      loadDashboardData();
    } catch (err) {
      Toast.error(err.message || 'Failed to record EMI payment');
    }
  });
}
