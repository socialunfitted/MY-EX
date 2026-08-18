/**
 * TrackWallet — Utilities
 * Formatters, helpers, validators
 */

// ============================================================
// Currency Formatting (Indian Number System)
// ============================================================
function formatINR(amount, showSign = false) {
  if (amount === null || amount === undefined) return '₹0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';

  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const sign = showSign && num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}₹${formatted}`;
}

function formatINRCompact(amount) {
  const num = parseFloat(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

// ============================================================
// Date Formatting
// ============================================================
function formatDate(dateStr, format = 'display') {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const shortYear = String(year).slice(-2);

  switch (format) {
    case 'display': return `${day} ${month} ${year}`;
    case 'short': return `${day} ${month} '${shortYear}`;
    case 'input': return `${year}-${monthNum}-${day}`;
    case 'indian': return `${day}-${monthNum}-${year}`;
    case 'monthYear': return `${month} ${year}`;
    default: return `${day} ${month} ${year}`;
  }
}

function dateToInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function endOfMonth() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split('T')[0];
}

function startOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

function endOfYear() {
  return `${new Date().getFullYear()}-12-31`;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// ============================================================
// Transaction Type Helpers
// ============================================================
function getTypeColor(type) {
  const colors = {
    INCOME: 'var(--success)',
    EXPENSE: 'var(--danger)',
    TRANSFER_IN: 'var(--info)',
    TRANSFER_OUT: 'var(--info)',
    LOAN_RECEIVED: 'var(--warning)',
    LOAN_PAYMENT: 'var(--warning)',
    INTEREST: 'var(--danger)',
    REFUND: 'var(--success)',
    ADJUSTMENT: 'var(--text-muted)'
  };
  return colors[type] || 'var(--text-muted)';
}

function getTypeBadgeClass(type) {
  const classes = {
    INCOME: 'badge-income',
    EXPENSE: 'badge-expense',
    TRANSFER_IN: 'badge-transfer',
    TRANSFER_OUT: 'badge-transfer',
    LOAN_RECEIVED: 'badge-loan',
    LOAN_PAYMENT: 'badge-loan',
    INTEREST: 'badge-interest',
    REFUND: 'badge-income',
    ADJUSTMENT: 'badge-muted'
  };
  return classes[type] || 'badge-muted';
}

function getTypeLabel(type) {
  const labels = {
    INCOME: 'Income',
    EXPENSE: 'Expense',
    TRANSFER_IN: 'Transfer In',
    TRANSFER_OUT: 'Transfer Out',
    LOAN_RECEIVED: 'Loan Received',
    LOAN_PAYMENT: 'Loan Payment',
    INTEREST: 'Interest',
    REFUND: 'Refund',
    ADJUSTMENT: 'Adjustment'
  };
  return labels[type] || type;
}

function isDebit(type) {
  return ['EXPENSE', 'TRANSFER_OUT', 'LOAN_PAYMENT', 'INTEREST'].includes(type);
}

function isCredit(type) {
  return ['INCOME', 'TRANSFER_IN', 'LOAN_RECEIVED', 'REFUND'].includes(type);
}

// ============================================================
// Toast Notifications
// ============================================================
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-icons-round">${icons[type] || 'info'}</span>
      <span class="toast-msg">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;display:flex;">
        <span class="material-icons-round" style="font-size:16px">close</span>
      </button>
    `;
    this.container.appendChild(toast);
    setTimeout(() => toast.style.opacity = '0', duration);
    setTimeout(() => toast.remove(), duration + 300);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

// ============================================================
// Modal Helpers
// ============================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// Click outside to close modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

// ============================================================
// Loading States
// ============================================================
function showLoading(container, text = 'Loading...') {
  if (typeof container === 'string') container = document.getElementById(container);
  if (container) {
    container.innerHTML = `<div class="loading" style="justify-content:center;padding:32px">
      <div class="spinner"></div><span>${text}</span>
    </div>`;
  }
}

function showEmptyState(container, title, subtitle, icon = 'inbox') {
  if (typeof container === 'string') container = document.getElementById(container);
  if (container) {
    container.innerHTML = `<div class="empty-state">
      <span class="material-icons-round">${icon}</span>
      <h3>${title}</h3>
      <p>${subtitle}</p>
    </div>`;
  }
}

// ============================================================
// Confirm Dialog
// ============================================================
function confirmAction(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <h3 class="modal-title">Confirm Action</h3>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">${message}</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// Number Helpers
// ============================================================
function parseAmount(str) {
  if (typeof str === 'number') return str;
  return parseFloat(String(str).replace(/[₹,]/g, '')) || 0;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// ============================================================
// DOM Helpers
// ============================================================
function el(selector) {
  return document.querySelector(selector);
}

function els(selector) {
  return document.querySelectorAll(selector);
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setText(id, text) {
  const elem = document.getElementById(id);
  if (elem) elem.textContent = text;
}

function setHTML(id, html) {
  const elem = document.getElementById(id);
  if (elem) elem.innerHTML = html;
}

// ============================================================
// Sidebar Mobile Toggle
// ============================================================
function initSidebar() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('active');
    });

    overlay && overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ============================================================
// Auth Guard
// ============================================================
function requireAuth() {
  const token = localStorage.getItem('tw_token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('tw_user') || '{}');
  } catch { return {}; }
}

function setUserDisplay() {
  const user = getStoredUser();
  if (!user.username) return;

  const nameEls = document.querySelectorAll('.user-name');
  nameEls.forEach(el => el.textContent = user.fullName || user.username);

  const avatarEls = document.querySelectorAll('.user-avatar');
  avatarEls.forEach(el => {
    el.textContent = (user.fullName || user.username).charAt(0).toUpperCase();
  });
}

// ============================================================
// Color Progress Helper
// ============================================================
function getProgressColor(percent) {
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'success';
}

// ============================================================
// Debounce
// ============================================================
function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
