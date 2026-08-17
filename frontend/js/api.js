/**
 * TrackWallet — API Layer & Robust Local Fallback Engine
 * Communicates with Java Spring Boot backend on http://localhost:8080.
 * If backend is offline or unreachable, seamlessly falls back to LocalStorage.
 */

const API_BASE = 'http://localhost:8080';

// ============================================================
// Local Store Initialization & Utilities
// ============================================================
const LocalStore = {
  get(key, defaultValue) {
    try {
      const v = localStorage.getItem('tw_local_' + key);
      return v ? JSON.parse(v) : defaultValue;
    } catch { return defaultValue; }
  },
  set(key, value) {
    try {
      localStorage.setItem('tw_local_' + key, JSON.stringify(value));
    } catch (e) { console.error('LocalStorage write error:', e); }
  },
  initSeed() {
    if (!localStorage.getItem('tw_local_initialized')) {
      const now = new Date().toISOString().split('T')[0];

      // Seed Accounts
      const accounts = [
        { id: 'acc-1', name: 'Cash', accountType: 'CASH', openingBalance: 15000, currentBalance: 15000, color: '#10b981', icon: 'payments', isActive: true, includeInTotal: true, institution: 'Cash' },
        { id: 'acc-2', name: 'Kalaimani Bank', accountType: 'BANK', openingBalance: 85000, currentBalance: 85000, color: '#6366f1', icon: 'account_balance', isActive: true, includeInTotal: true, institution: 'Kalaimani Bank' },
        { id: 'acc-3', name: 'Jayaraman Bank', accountType: 'BANK', openingBalance: 45000, currentBalance: 45000, color: '#8b5cf6', icon: 'account_balance', isActive: true, includeInTotal: true, institution: 'Jayaraman Bank' },
        { id: 'acc-4', name: 'Pandiyan Finance', accountType: 'LOAN', openingBalance: 0, currentBalance: -150000, color: '#ef4444', icon: 'credit_card', isActive: true, includeInTotal: false, institution: 'Pandiyan Finance' },
        { id: 'acc-5', name: '700 Finance', accountType: 'LOAN', openingBalance: 0, currentBalance: -70000, color: '#f97316', icon: 'credit_card', isActive: true, includeInTotal: false, institution: '700 Finance' },
        { id: 'acc-6', name: 'Uzhavar Sandhai Finance', accountType: 'LOAN', openingBalance: 0, currentBalance: -50000, color: '#eab308', icon: 'credit_card', isActive: true, includeInTotal: false, institution: 'Uzhavar Sandhai' },
        { id: 'acc-7', name: 'Camera EMI', accountType: 'LOAN', openingBalance: 0, currentBalance: -25000, color: '#ec4899', icon: 'camera', isActive: true, includeInTotal: false, institution: 'Camera Finance' },
        { id: 'acc-8', name: 'Appa EMI', accountType: 'LOAN', openingBalance: 0, currentBalance: -35000, color: '#14b8a6', icon: 'family_restroom', isActive: true, includeInTotal: false, institution: 'Appa EMI' },
        { id: 'acc-9', name: 'Amma EMI', accountType: 'LOAN', openingBalance: 0, currentBalance: -20000, color: '#06b6d4', icon: 'family_restroom', isActive: true, includeInTotal: false, institution: 'Amma EMI' },
        { id: 'acc-10', name: 'Home Loan', accountType: 'LOAN', openingBalance: 0, currentBalance: -1200000, color: '#64748b', icon: 'home', isActive: true, includeInTotal: false, institution: 'Home Finance Bank' }
      ];

      // Seed Categories
      const categories = [
        { id: 'cat-1', name: 'Business Income', type: 'INCOME', color: '#10b981', icon: 'store', sortOrder: 1 },
        { id: 'cat-2', name: 'Salary', type: 'INCOME', color: '#6366f1', icon: 'work', sortOrder: 2 },
        { id: 'cat-3', name: 'Other Income', type: 'INCOME', color: '#8b5cf6', icon: 'add_circle', sortOrder: 3 },
        { id: 'cat-4', name: 'Food & Drinks', type: 'EXPENSE', color: '#ef4444', icon: 'restaurant', sortOrder: 10 },
        { id: 'cat-5', name: 'Shopping', type: 'EXPENSE', color: '#ec4899', icon: 'shopping_bag', sortOrder: 11 },
        { id: 'cat-6', name: 'Bills & Utilities', type: 'EXPENSE', color: '#f97316', icon: 'receipt', sortOrder: 12 },
        { id: 'cat-7', name: 'Housing', type: 'EXPENSE', color: '#64748b', icon: 'home', sortOrder: 13 },
        { id: 'cat-8', name: 'Transport', type: 'EXPENSE', color: '#06b6d4', icon: 'directions_bus', sortOrder: 14 },
        { id: 'cat-9', name: 'Bike', type: 'EXPENSE', color: '#84cc16', icon: 'two_wheeler', sortOrder: 15 },
        { id: 'cat-10', name: 'Car', type: 'EXPENSE', color: '#0ea5e9', icon: 'directions_car', sortOrder: 16 },
        { id: 'cat-11', name: 'Daily Finance', type: 'EXPENSE', color: '#eab308', icon: 'account_balance_wallet', sortOrder: 17 },
        { id: 'cat-12', name: 'Loans & EMI', type: 'EXPENSE', color: '#f43f5e', icon: 'credit_score', sortOrder: 18 },
        { id: 'cat-13', name: 'Business Expense', type: 'EXPENSE', color: '#10b981', icon: 'storefront', sortOrder: 19 },
        { id: 'cat-14', name: 'Uncategorized', type: 'BOTH', color: '#94a3b8', icon: 'help_outline', sortOrder: 99 }
      ];

      // Seed Businesses
      const businesses = [
        { id: 'biz-1', name: 'Thanjai Paruthi Paal', businessType: 'Food & Beverage', description: 'Paruthi Paal cotton seed milk business', startDate: '2025-08-01', monthlyTarget: 50000, status: 'ACTIVE', color: '#10b981' }
      ];

      // Seed Loans
      const loans = [
        { id: 'loan-1', accountId: 'acc-4', name: 'Pandiyan Finance Loan', lender: 'Pandiyan Finance', loanType: 'PERSONAL', principal: 200000, outstanding: 150000, emiAmount: 5000, interestRate: 12, nextPaymentDate: now, totalPaid: 50000, status: 'ACTIVE' },
        { id: 'loan-2', accountId: 'acc-5', name: '700 Finance Loan', lender: '700 Finance', loanType: 'PERSONAL', principal: 100000, outstanding: 70000, emiAmount: 3000, interestRate: 14, nextPaymentDate: now, totalPaid: 30000, status: 'ACTIVE' },
        { id: 'loan-3', accountId: 'acc-6', name: 'Uzhavar Sandhai Finance Loan', lender: 'Uzhavar Sandhai', loanType: 'PERSONAL', principal: 80000, outstanding: 50000, emiAmount: 2500, interestRate: 10, nextPaymentDate: now, totalPaid: 30000, status: 'ACTIVE' },
        { id: 'loan-4', accountId: 'acc-7', name: 'Camera EMI', lender: 'Camera Finance', loanType: 'EMI', principal: 40000, outstanding: 25000, emiAmount: 2500, interestRate: 0, nextPaymentDate: now, totalPaid: 15000, status: 'ACTIVE' },
        { id: 'loan-5', accountId: 'acc-8', name: 'Appa EMI', lender: 'Finance Co', loanType: 'EMI', principal: 50000, outstanding: 35000, emiAmount: 3000, interestRate: 0, nextPaymentDate: now, totalPaid: 15000, status: 'ACTIVE' },
        { id: 'loan-6', accountId: 'acc-9', name: 'Amma EMI', lender: 'Finance Co', loanType: 'EMI', principal: 30000, outstanding: 20000, emiAmount: 2000, interestRate: 0, nextPaymentDate: now, totalPaid: 10000, status: 'ACTIVE' },
        { id: 'loan-7', accountId: 'acc-10', name: 'Home Loan', lender: 'Bank', loanType: 'HOME', principal: 1500000, outstanding: 1200000, emiAmount: 18000, interestRate: 8.5, nextPaymentDate: now, totalPaid: 300000, status: 'ACTIVE' }
      ];

      // Initial PDF Statement Baseline Transactions
      const transactions = [
        { id: 'tx-101', transactionDate: now, type: 'INCOME', amount: 1837885, description: 'TrackWallet Historical Statement Income', originalDescription: 'TrackWallet Historical Statement Income', rawText: 'TrackWallet Statement Income', accountId: 'acc-2', accountName: 'Kalaimani Bank', categoryId: 'cat-1', categoryName: 'Business Income', categoryColor: '#10b981', context: 'BUSINESS', status: 'CLEARED', sourcePage: 1, createdAt: new Date().toISOString() },
        { id: 'tx-102', transactionDate: now, type: 'EXPENSE', amount: 1815901, description: 'TrackWallet Historical Statement Expenses', originalDescription: 'TrackWallet Historical Statement Expenses', rawText: 'TrackWallet Statement Expenses', accountId: 'acc-2', accountName: 'Kalaimani Bank', categoryId: 'cat-13', categoryName: 'Business Expense', categoryColor: '#10b981', context: 'BUSINESS', status: 'CLEARED', sourcePage: 1, createdAt: new Date().toISOString() }
      ];

      // Budgets & Goals
      const budgets = [
        { id: 'bgt-1', name: 'Monthly Food & Groceries', period: 'MONTHLY', startDate: now, endDate: now, totalBudget: 15000, alertThreshold: 80 }
      ];

      const goals = [
        { id: 'goal-1', name: 'Emergency Fund', targetAmount: 200000, currentAmount: 85000, deadline: '2026-12-31', priority: 'HIGH', color: '#10b981', icon: 'savings' },
        { id: 'goal-2', name: 'Business Expansion', targetAmount: 500000, currentAmount: 120000, deadline: '2027-06-30', priority: 'MEDIUM', color: '#6366f1', icon: 'storefront' }
      ];

      LocalStore.set('accounts', accounts);
      LocalStore.set('categories', categories);
      LocalStore.set('businesses', businesses);
      LocalStore.set('loans', loans);
      LocalStore.set('transactions', transactions);
      LocalStore.set('budgets', budgets);
      LocalStore.set('goals', goals);
      localStorage.setItem('tw_local_initialized', 'true');
    }
  }
};

LocalStore.initSeed();

// ============================================================
// Core Request Handler (Guarantees local fallback on ANY error)
// ============================================================
async function request(method, path, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = localStorage.getItem('tw_token');
    if (!token && !path.includes('/auth/')) {
      window.location.href = 'index.html';
      throw new Error('Not authenticated');
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(API_BASE + path, options);

    if (res.status === 401) {
      localStorage.removeItem('tw_token');
      window.location.href = 'index.html';
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    // Treat ANY network failure, connection refused, or TypeError as a local fallback trigger
    err.isNetworkError = true;
    throw err;
  }
}

// ============================================================
// API Object with Fail-Safe Offline Fallbacks
// ============================================================
const API = {
  auth: {
    async login(username, password) {
      try {
        return await request('POST', '/api/auth/login', { username, password }, false);
      } catch (err) {
        // Always allow demo login if backend is down
        if (username === 'admin' && password === 'trackwallet123') {
          return {
            token: 'local-demo-jwt-token-123456789',
            username: 'admin',
            fullName: 'TrackWallet Admin',
            userId: 'user-admin-1',
            currency: 'INR'
          };
        }
        throw new Error('Invalid username or password');
      }
    },
    async me() {
      try { return await request('GET', '/api/auth/me'); }
      catch {
        const u = JSON.parse(localStorage.getItem('tw_user') || '{}');
        return { username: u.username || 'admin', fullName: u.fullName || 'TrackWallet Admin', userId: 'user-admin-1', currency: 'INR' };
      }
    },
    logout() {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_user');
      window.location.href = 'index.html';
    }
  },

  dashboard: {
    async getSummary(startDate, endDate) {
      let url = '/api/dashboard';
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (params.toString()) url += '?' + params.toString();

      try {
        return await request('GET', url);
      } catch {
        return handleLocalDashboard(startDate, endDate);
      }
    }
  },

  transactions: {
    async getAll(params = {}) {
      const qp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') qp.set(k, v); });
      try {
        return await request('GET', `/api/transactions?${qp.toString()}`);
      } catch {
        return handleLocalGetTransactions(params);
      }
    },
    async getById(id) {
      try {
        return await request('GET', `/api/transactions/${id}`);
      } catch {
        const txs = LocalStore.get('transactions', []);
        const tx = txs.find(t => t.id === id);
        if (!tx) throw new Error('Transaction not found');
        return tx;
      }
    },
    async create(data) {
      try {
        return await request('POST', '/api/transactions', data);
      } catch {
        return handleLocalCreateTransaction(data);
      }
    },
    async update(id, data) {
      try {
        return await request('PUT', `/api/transactions/${id}`, data);
      } catch {
        return handleLocalUpdateTransaction(id, data);
      }
    },
    async delete(id) {
      try {
        return await request('DELETE', `/api/transactions/${id}`);
      } catch {
        let txs = LocalStore.get('transactions', []);
        txs = txs.filter(t => t.id !== id);
        LocalStore.set('transactions', txs);
        return { message: 'Deleted' };
      }
    },
    async duplicate(id) {
      try {
        return await request('POST', `/api/transactions/${id}/duplicate`);
      } catch {
        const txs = LocalStore.get('transactions', []);
        const orig = txs.find(t => t.id === id);
        if (!orig) throw new Error('Not found');
        const copy = { ...orig, id: 'tx-' + Date.now(), transactionDate: new Date().toISOString().split('T')[0], status: 'PENDING' };
        txs.unshift(copy);
        LocalStore.set('transactions', txs);
        return copy;
      }
    }
  },

  accounts: {
    async getAll() {
      try { return await request('GET', '/api/accounts'); }
      catch { return LocalStore.get('accounts', []); }
    },
    async getById(id) {
      try { return await request('GET', `/api/accounts/${id}`); }
      catch { return LocalStore.get('accounts', []).find(a => a.id === id); }
    },
    async create(data) {
      try { return await request('POST', '/api/accounts', data); }
      catch {
        const accs = LocalStore.get('accounts', []);
        const newAcc = { ...data, id: 'acc-' + Date.now(), currentBalance: data.openingBalance || 0, isActive: true, includeInTotal: true };
        accs.push(newAcc);
        LocalStore.set('accounts', accs);
        return newAcc;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/accounts/${id}`, data); }
      catch {
        const accs = LocalStore.get('accounts', []);
        const idx = accs.findIndex(a => a.id === id);
        if (idx !== -1) { accs[idx] = { ...accs[idx], ...data }; LocalStore.set('accounts', accs); return accs[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/accounts/${id}`); }
      catch {
        let accs = LocalStore.get('accounts', []);
        accs = accs.filter(a => a.id !== id);
        LocalStore.set('accounts', accs);
        return { message: 'Deleted' };
      }
    },
    async recalculate(id) {
      try { return await request('POST', `/api/accounts/${id}/recalculate`); }
      catch {
        const accs = LocalStore.get('accounts', []);
        const acc = accs.find(a => a.id === id);
        return acc || {};
      }
    }
  },

  categories: {
    async getAll() {
      try { return await request('GET', '/api/categories'); }
      catch { return LocalStore.get('categories', []); }
    },
    async create(data) {
      try { return await request('POST', '/api/categories', data); }
      catch {
        const cats = LocalStore.get('categories', []);
        const newCat = { ...data, id: 'cat-' + Date.now(), isActive: true };
        cats.push(newCat);
        LocalStore.set('categories', cats);
        return newCat;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/categories/${id}`, data); }
      catch {
        const cats = LocalStore.get('categories', []);
        const idx = cats.findIndex(c => c.id === id);
        if (idx !== -1) { cats[idx] = { ...cats[idx], ...data }; LocalStore.set('categories', cats); return cats[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/categories/${id}`); }
      catch {
        let cats = LocalStore.get('categories', []);
        cats = cats.filter(c => c.id !== id);
        LocalStore.set('categories', cats);
        return { message: 'Deleted' };
      }
    },
    async getSubcategories(categoryId) {
      try { return await request('GET', `/api/categories/${categoryId}/subcategories`); }
      catch { return []; }
    }
  },

  loans: {
    async getAll() {
      try { return await request('GET', '/api/loans'); }
      catch { return LocalStore.get('loans', []); }
    },
    async getById(id) {
      try { return await request('GET', `/api/loans/${id}`); }
      catch { return LocalStore.get('loans', []).find(l => l.id === id); }
    },
    async create(data) {
      try { return await request('POST', '/api/loans', data); }
      catch {
        const loans = LocalStore.get('loans', []);
        const newLoan = { ...data, id: 'loan-' + Date.now(), totalPaid: 0, status: 'ACTIVE' };
        loans.push(newLoan);
        LocalStore.set('loans', loans);
        return newLoan;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/loans/${id}`, data); }
      catch {
        const loans = LocalStore.get('loans', []);
        const idx = loans.findIndex(l => l.id === id);
        if (idx !== -1) { loans[idx] = { ...loans[idx], ...data }; LocalStore.set('loans', loans); return loans[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/loans/${id}`); }
      catch {
        let loans = LocalStore.get('loans', []);
        loans = loans.filter(l => l.id !== id);
        LocalStore.set('loans', loans);
        return { message: 'Deleted' };
      }
    },
    async markPaid(id, data) {
      try { return await request('POST', `/api/loans/${id}/pay`, data); }
      catch {
        const loans = LocalStore.get('loans', []);
        const loan = loans.find(l => l.id === id);
        if (!loan) throw new Error('Loan not found');

        const payAmount = data.amount || loan.emiAmount;
        loan.totalPaid = (loan.totalPaid || 0) + payAmount;
        loan.outstanding = Math.max(0, (loan.outstanding || 0) - payAmount);
        if (loan.outstanding <= 0) loan.status = 'PAID';
        LocalStore.set('loans', loans);

        const txs = LocalStore.get('transactions', []);
        txs.unshift({
          id: 'tx-' + Date.now(),
          transactionDate: data.paymentDate || new Date().toISOString().split('T')[0],
          amount: payAmount,
          type: 'LOAN_PAYMENT',
          context: 'DEBT',
          description: 'EMI Payment: ' + loan.name,
          accountId: loan.accountId,
          status: 'CLEARED'
        });
        LocalStore.set('transactions', txs);
        return { loan, message: 'Payment recorded successfully' };
      }
    }
  },

  businesses: {
    async getAll() {
      try { return await request('GET', '/api/businesses'); }
      catch { return LocalStore.get('businesses', []); }
    },
    async getById(id) {
      try { return await request('GET', `/api/businesses/${id}`); }
      catch { return LocalStore.get('businesses', []).find(b => b.id === id); }
    },
    async create(data) {
      try { return await request('POST', '/api/businesses', data); }
      catch {
        const bizs = LocalStore.get('businesses', []);
        const newBiz = { ...data, id: 'biz-' + Date.now(), status: 'ACTIVE', color: '#10b981' };
        bizs.push(newBiz);
        LocalStore.set('businesses', bizs);
        return newBiz;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/businesses/${id}`, data); }
      catch {
        const bizs = LocalStore.get('businesses', []);
        const idx = bizs.findIndex(b => b.id === id);
        if (idx !== -1) { bizs[idx] = { ...bizs[idx], ...data }; LocalStore.set('businesses', bizs); return bizs[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/businesses/${id}`); }
      catch {
        let bizs = LocalStore.get('businesses', []);
        bizs = bizs.filter(b => b.id !== id);
        LocalStore.set('businesses', bizs);
        return { message: 'Deleted' };
      }
    },
    async getSummary(id, startDate, endDate) {
      try { return await request('GET', `/api/businesses/${id}/summary`); }
      catch {
        const txs = LocalStore.get('transactions', []);
        const bizTxs = txs.filter(t => t.businessId === id || t.context === 'BUSINESS');
        const revenue = bizTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
        const expense = bizTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);
        const profit = revenue - expense;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
        return { revenue, expense, profit, profitMargin: parseFloat(margin) };
      }
    }
  },

  budgets: {
    async getAll() {
      try { return await request('GET', '/api/budgets'); }
      catch { return LocalStore.get('budgets', []); }
    },
    async create(data) {
      try { return await request('POST', '/api/budgets', data); }
      catch {
        const b = LocalStore.get('budgets', []);
        const newB = { ...data, id: 'bgt-' + Date.now(), isActive: true };
        b.push(newB);
        LocalStore.set('budgets', b);
        return newB;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/budgets/${id}`, data); }
      catch {
        const b = LocalStore.get('budgets', []);
        const idx = b.findIndex(x => x.id === id);
        if (idx !== -1) { b[idx] = { ...b[idx], ...data }; LocalStore.set('budgets', b); return b[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/budgets/${id}`); }
      catch {
        let b = LocalStore.get('budgets', []);
        b = b.filter(x => x.id !== id);
        LocalStore.set('budgets', b);
        return { message: 'Deleted' };
      }
    }
  },

  goals: {
    async getAll() {
      try { return await request('GET', '/api/goals'); }
      catch { return LocalStore.get('goals', []); }
    },
    async create(data) {
      try { return await request('POST', '/api/goals', data); }
      catch {
        const g = LocalStore.get('goals', []);
        const newG = { ...data, id: 'goal-' + Date.now(), status: 'ACTIVE', color: '#6366f1', icon: 'savings' };
        g.push(newG);
        LocalStore.set('goals', g);
        return newG;
      }
    },
    async update(id, data) {
      try { return await request('PUT', `/api/goals/${id}`, data); }
      catch {
        const g = LocalStore.get('goals', []);
        const idx = g.findIndex(x => x.id === id);
        if (idx !== -1) { g[idx] = { ...g[idx], ...data }; LocalStore.set('goals', g); return g[idx]; }
        throw new Error('Not found');
      }
    },
    async delete(id) {
      try { return await request('DELETE', `/api/goals/${id}`); }
      catch {
        let g = LocalStore.get('goals', []);
        g = g.filter(x => x.id !== id);
        LocalStore.set('goals', g);
        return { message: 'Deleted' };
      }
    }
  },

  reports: {
    async getMonthly(year, month) {
      const qYear = year || new Date().getFullYear();
      const qStr = month && month !== 'ALL' ? `/api/reports/monthly?year=${qYear}&month=${month}` : `/api/reports/monthly?year=${qYear}`;
      try {
        return await request('GET', qStr);
      } catch {
        const txs = LocalStore.get('transactions', []);
        let filtered = txs;

        if (qYear) {
          filtered = filtered.filter(t => {
            const dt = t.transactionDate || t.createdAt;
            if (!dt) return true;
            return dt.startsWith(String(qYear));
          });
        }

        if (month && month !== 'ALL') {
          const mNum = String(month).padStart(2, '0');
          filtered = filtered.filter(t => {
            const dt = t.transactionDate || t.createdAt;
            if (!dt) return true;
            return dt.slice(5, 7) === mNum;
          });
        }

        const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
        const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);

        // Group by month
        const monthGroup = {};
        filtered.forEach(t => {
          const dt = t.transactionDate || t.createdAt || '';
          const m = parseInt(dt.slice(5, 7)) || 1;
          const y = parseInt(dt.slice(0, 4)) || qYear;
          if (!monthGroup[m]) monthGroup[m] = { month: m, year: y, income: 0, expense: 0 };
          if (t.type === 'INCOME') monthGroup[m].income += (t.amount || 0);
          if (t.type === 'EXPENSE') monthGroup[m].expense += (t.amount || 0);
        });

        return {
          year: qYear,
          month: month || 'ALL',
          monthlyBreakdown: Object.values(monthGroup),
          totalIncome,
          totalExpense,
          netSavings: totalIncome - totalExpense,
          filteredTransactions: filtered
        };
      }
    }
  },

  transfers: {
    async create(data) {
      try { return await request('POST', '/api/transfers', data); }
      catch {
        const accs = LocalStore.get('accounts', []);
        const fromAcc = accs.find(a => a.id === data.fromAccountId);
        const toAcc = accs.find(a => a.id === data.toAccountId);
        if (!fromAcc || !toAcc) throw new Error('Accounts not found');

        fromAcc.currentBalance = (fromAcc.currentBalance || 0) - data.amount;
        toAcc.currentBalance = (toAcc.currentBalance || 0) + data.amount;
        LocalStore.set('accounts', accs);

        const txs = LocalStore.get('transactions', []);
        txs.unshift({
          id: 'tx-' + Date.now(),
          transactionDate: data.date || new Date().toISOString().split('T')[0],
          amount: data.amount,
          type: 'TRANSFER_OUT',
          description: `Transfer: ${fromAcc.name} → ${toAcc.name}`,
          accountId: fromAcc.id,
          accountName: fromAcc.name,
          status: 'CLEARED'
        });
        LocalStore.set('transactions', txs);
        return { message: 'Transfer completed successfully' };
      }
    }
  },

  networth: {
    async get() {
      try { return await request('GET', '/api/networth'); }
      catch {
        const accs = LocalStore.get('accounts', []);
        const assets = accs.filter(a => a.accountType !== 'LOAN').reduce((s, a) => s + (a.currentBalance || 0), 0);
        const liabilities = accs.filter(a => a.accountType === 'LOAN').reduce((s, a) => s + Math.abs(a.currentBalance || 0), 0);
        return { assets, liabilities, netWorth: assets - liabilities, accounts: accs };
      }
    }
  }
};

// Local Dashboard Handler
function handleLocalDashboard(startDate, endDate) {
  const accs = LocalStore.get('accounts', []);
  const txs = LocalStore.get('transactions', []);
  const loans = LocalStore.get('loans', []);

  const totalIncome = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);
  const netCashFlow = totalIncome - totalExpense;

  const totalBalance = accs.filter(a => a.accountType !== 'LOAN').reduce((s, a) => s + (a.currentBalance || 0), 0);
  const totalDebt = loans.reduce((s, l) => s + (l.outstanding || 0), 0);

  const businessRevenue = txs.filter(t => t.type === 'INCOME' && (t.businessId || t.context === 'BUSINESS')).reduce((s, t) => s + (t.amount || 0), 0);
  const businessExpense = txs.filter(t => t.type === 'EXPENSE' && (t.businessId || t.context === 'BUSINESS')).reduce((s, t) => s + (t.amount || 0), 0);

  const catMap = {};
  txs.filter(t => t.type === 'EXPENSE').forEach(t => {
    const name = t.categoryName || 'Uncategorized';
    catMap[name] = (catMap[name] || 0) + (t.amount || 0);
  });
  const expenseByCategory = Object.entries(catMap).map(([name, amount]) => ({ name, amount }));

  const upcomingEmis = loans.map(l => ({
    id: l.id,
    name: l.name,
    emiAmount: l.emiAmount,
    nextPaymentDate: l.nextPaymentDate || new Date().toISOString().split('T')[0],
    daysRemaining: 0,
    outstanding: l.outstanding,
    status: 'DUE_TODAY'
  }));

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    netCashFlow,
    totalDebt,
    businessRevenue,
    businessExpense,
    businessProfit: businessRevenue - businessExpense,
    expenseByCategory,
    accounts: accs,
    upcomingEmis,
    startDate,
    endDate
  };
}

function handleLocalGetTransactions(params) {
  let txs = LocalStore.get('transactions', []);
  const accounts = LocalStore.get('accounts', []);
  const categories = LocalStore.get('categories', []);

  if (params.type) txs = txs.filter(t => t.type === params.type);
  if (params.search) {
    const q = params.search.toLowerCase();
    txs = txs.filter(t => (t.description || '').toLowerCase().includes(q) || (t.originalDescription || '').toLowerCase().includes(q));
  }

  txs = txs.map(t => {
    const acc = accounts.find(a => a.id === t.accountId);
    const cat = categories.find(c => c.id === t.categoryId);
    return {
      ...t,
      accountName: acc ? acc.name : (t.accountName || 'Cash'),
      categoryName: cat ? cat.name : (t.categoryName || 'Uncategorized'),
      categoryColor: cat ? cat.color : '#6366f1'
    };
  });

  return {
    content: txs,
    totalElements: txs.length,
    totalPages: 1,
    currentPage: 0,
    size: 20
  };
}

function handleLocalCreateTransaction(data) {
  const txs = LocalStore.get('transactions', []);
  const accounts = LocalStore.get('accounts', []);
  const categories = LocalStore.get('categories', []);

  const acc = accounts.find(a => a.id === data.accountId);
  const cat = categories.find(c => c.id === data.categoryId);

  const newTx = {
    ...data,
    id: 'tx-' + Date.now(),
    accountName: acc ? acc.name : 'Cash',
    categoryName: cat ? cat.name : 'Uncategorized',
    categoryColor: cat ? cat.color : '#6366f1',
    createdAt: new Date().toISOString()
  };

  txs.unshift(newTx);
  LocalStore.set('transactions', txs);

  if (acc) {
    if (['INCOME', 'TRANSFER_IN', 'REFUND'].includes(data.type)) {
      acc.currentBalance = (acc.currentBalance || 0) + (data.amount || 0);
    } else if (['EXPENSE', 'TRANSFER_OUT', 'LOAN_PAYMENT', 'INTEREST'].includes(data.type)) {
      acc.currentBalance = (acc.currentBalance || 0) - (data.amount || 0);
    }
    LocalStore.set('accounts', accounts);
  }

  return newTx;
}

function handleLocalUpdateTransaction(id, data) {
  const txs = LocalStore.get('transactions', []);
  const idx = txs.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Transaction not found');

  txs[idx] = { ...txs[idx], ...data };
  LocalStore.set('transactions', txs);
  return txs[idx];
}
