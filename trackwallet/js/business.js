/**
 * TrackWallet — Business JavaScript
 */

let businesses = [];
let activeBusinessId = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp('business', 'Business');
  loadBusinesses();
  document.getElementById('biz-form').addEventListener('submit', handleBizSubmit);
});

async function loadBusinesses() {
  try {
    businesses = await API.businesses.getAll();

    const tabsContainer = document.getElementById('biz-tabs');
    if (!businesses || businesses.length === 0) {
      tabsContainer.innerHTML = '<span style="color:var(--text-muted)">No businesses registered</span>';
      return;
    }

    if (!activeBusinessId) activeBusinessId = businesses[0].id;

    tabsContainer.innerHTML = businesses.map(b => `
      <button class="tab-btn ${b.id === activeBusinessId ? 'active' : ''}" onclick="selectBusiness('${b.id}')">
        ${b.name}
      </button>
    `).join('');

    loadBusinessSummary(activeBusinessId);

  } catch (err) {
    console.error('Failed to load businesses:', err);
    Toast.error('Failed to load business data');
  }
}

function selectBusiness(id) {
  activeBusinessId = id;
  const tabs = document.querySelectorAll('#biz-tabs .tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  loadBusinessSummary(id);
}

async function loadBusinessSummary(id) {
  const biz = businesses.find(b => b.id === id);
  if (!biz) return;

  try {
    const summary = await API.businesses.getSummary(id, startOfMonth(), today());

    const rev = summary.revenue || 0;
    const exp = summary.expense || 0;
    const profit = summary.profit || 0;
    const margin = summary.profitMargin || 0;

    setText('biz-revenue', formatINR(rev));
    setText('biz-expense', formatINR(exp));
    setText('biz-profit', formatINR(profit));
    setText('biz-margin', `${margin}%`);

    // Target Progress
    const target = biz.monthlyTarget || 0;
    setText('biz-target-val', formatINR(target));
    const targetPercent = target > 0 ? Math.min(100, Math.round((rev / target) * 100)) : 0;
    setText('biz-target-percent', `${targetPercent}%`);
    const bar = document.getElementById('biz-target-bar');
    if (bar) bar.style.width = `${targetPercent}%`;

  } catch (err) {
    console.error('Failed to load business summary:', err);
  }
}

function openAddBusinessModal() {
  setVal('biz-name', '');
  setVal('biz-type', '');
  setVal('biz-target', '0');
  setVal('biz-desc', '');
  openModal('biz-modal');
}

async function handleBizSubmit(e) {
  e.preventDefault();
  const data = {
    name: getVal('biz-name'),
    businessType: getVal('biz-type'),
    monthlyTarget: parseAmount(getVal('biz-target')),
    description: getVal('biz-desc')
  };

  try {
    await API.businesses.create(data);
    Toast.success('Business added successfully');
    closeModal('biz-modal');
    loadBusinesses();
  } catch (err) {
    Toast.error(err.message || 'Failed to add business');
  }
}
