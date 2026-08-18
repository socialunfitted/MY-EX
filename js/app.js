/**
 * TrackWallet — App Shell
 * Sidebar, navigation, shared components
 */

// ============================================================
// Sidebar HTML Generator
// ============================================================
function renderSidebar(activePage) {
  const navItems = [
    { group: 'MAIN', items: [
      { href: 'dashboard.html', icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
      { href: 'transactions.html', icon: 'receipt_long', label: 'Transactions', id: 'transactions' },
    ]},
    { group: 'MONEY', items: [
      { href: 'accounts.html', icon: 'account_balance_wallet', label: 'Accounts', id: 'accounts' },
      { href: 'loans.html', icon: 'credit_score', label: 'Loans & EMI', id: 'loans' },
      { href: 'budgets.html', icon: 'pie_chart', label: 'Budgets', id: 'budgets' },
      { href: 'goals.html', icon: 'savings', label: 'Savings Goals', id: 'goals' },
    ]},
    { group: 'BUSINESS', items: [
      { href: 'business.html', icon: 'storefront', label: 'Business', id: 'business' },
    ]},
    { group: 'INSIGHTS', items: [
      { href: 'reports.html', icon: 'bar_chart', label: 'Reports', id: 'reports' },
    ]},
    { group: 'MANAGE', items: [
      { href: 'import.html', icon: 'upload_file', label: 'Import Data', id: 'import' },
      { href: 'settings.html', icon: 'settings', label: 'Settings', id: 'settings' },
    ]},
  ];

  const navHTML = navItems.map(group => `
    <div class="nav-section">${group.group}</div>
    ${group.items.map(item => `
      <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}" id="nav-${item.id}">
        <span class="material-icons-round">${item.icon}</span>
        ${item.label}
      </a>
    `).join('')}
  `).join('');

  const user = getStoredUser();

  return `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">💰</div>
        <div>
          <div class="logo-text">TrackWallet</div>
          <span class="logo-sub">Finance Manager</span>
        </div>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="user-card" onclick="confirmLogout()">
          <div class="user-avatar">${(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-name">${user.fullName || user.username || 'User'}</div>
            <div class="user-role">Personal Finance</div>
          </div>
          <span class="material-icons-round" style="margin-left:auto;color:var(--text-muted);font-size:18px">logout</span>
        </div>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;
}

// ============================================================
// Bottom Navigation (Mobile)
// ============================================================
function renderBottomNav(activePage) {
  const items = [
    { href: 'dashboard.html', icon: 'dashboard', label: 'Home', id: 'dashboard' },
    { href: 'transactions.html', icon: 'receipt_long', label: 'Trans.', id: 'transactions' },
    { href: 'accounts.html', icon: 'account_balance_wallet', label: 'Accounts', id: 'accounts' },
    { href: 'loans.html', icon: 'credit_score', label: 'Loans', id: 'loans' },
    { href: 'reports.html', icon: 'bar_chart', label: 'Reports', id: 'reports' },
  ];

  return `
    <nav class="bottom-nav">
      ${items.map(item => `
        <a href="${item.href}" class="bottom-nav-item ${activePage === item.id ? 'active' : ''}">
          <span class="material-icons-round">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
  `;
}

// ============================================================
// Mobile Header
// ============================================================
function renderMobileHeader(title) {
  return `
    <div class="mobile-header" id="mobile-header">
      <button class="mobile-menu-btn" id="mobile-menu-btn">
        <span class="material-icons-round">menu</span>
      </button>
      <span style="font-size:15px;font-weight:700">${title}</span>
      <div style="width:36px"></div>
    </div>
  `;
}

// ============================================================
// Initialize App Shell
// ============================================================
function initApp(activePage, pageTitle) {
  if (!requireAuth()) return;

  // Insert sidebar
  const sidebarEl = document.getElementById('app-sidebar');
  if (sidebarEl) sidebarEl.innerHTML = renderSidebar(activePage);

  // Insert bottom nav
  const bottomNavEl = document.getElementById('app-bottom-nav');
  if (bottomNavEl) bottomNavEl.innerHTML = renderBottomNav(activePage);

  // Insert mobile header
  const mobileHeaderEl = document.getElementById('app-mobile-header');
  if (mobileHeaderEl) mobileHeaderEl.innerHTML = renderMobileHeader(pageTitle);

  // Init sidebar toggle
  initSidebar();
  setUserDisplay();
}

function confirmLogout() {
  confirmAction('Are you sure you want to sign out?', () => API.auth.logout());
}

// ============================================================
// Quick Add Transaction (Global)
// ============================================================
function showQuickAdd(type = 'EXPENSE') {
  const modal = document.getElementById('quick-add-modal');
  if (modal) {
    document.getElementById('qa-type').value = type;
    document.getElementById('qa-date').value = today();
    document.getElementById('qa-amount').value = '';
    document.getElementById('qa-description').value = '';
    openModal('quick-add-modal');
    loadQuickAddSelects();
  } else {
    // Navigate to transactions page with query param
    window.location.href = `transactions.html?add=${type.toLowerCase()}`;
  }
}

async function loadQuickAddSelects() {
  try {
    const [accounts, categories] = await Promise.all([
      API.accounts.getAll(),
      API.categories.getAll()
    ]);

    const accSel = document.getElementById('qa-account');
    const catSel = document.getElementById('qa-category');

    if (accSel) {
      accSel.innerHTML = '<option value="">Select Account</option>' +
        accounts.filter(a => a.isActive).map(a =>
          `<option value="${a.id}">${a.name} (${formatINR(a.currentBalance)})</option>`
        ).join('');
    }

    if (catSel) {
      catSel.innerHTML = '<option value="">Select Category</option>' +
        categories.map(c =>
          `<option value="${c.id}">${c.name}</option>`
        ).join('');
    }
  } catch (err) {
    console.error('Failed to load quick add selects:', err);
  }
}
