/**
 * TrackWallet — Reports & Analytics JavaScript
 * Supports Year and Month filtering + CSV and Vector PDF exports
 */

let currentReportData = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp('reports', 'Reports');
  loadReports();
});

async function loadReports() {
  const year = getVal('report-year') || new Date().getFullYear();
  const month = getVal('report-month') || 'ALL';
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  try {
    const data = await API.reports.getMonthly(year, month);
    currentReportData = { ...data, selectedYear: year, selectedMonth: month };

    const inc = data.totalIncome || 0;
    const exp = data.totalExpense || 0;
    const net = data.netSavings || (inc - exp);
    const rate = inc > 0 ? ((net / inc) * 100).toFixed(1) : 0;

    setText('rpt-income', formatINR(inc));
    setText('rpt-expense', formatINR(exp));
    setText('rpt-savings', formatINR(net));
    setText('rpt-rate', `${rate}%`);

    const monthLabel = month !== 'ALL' ? monthNames[parseInt(month) - 1] : 'Yearly';
    setText('rpt-income-label', `${monthLabel} Income`);
    setText('rpt-expense-label', `${monthLabel} Expenses`);

    const breakdown = data.monthlyBreakdown || [];

    // Header & Table
    const thead = document.getElementById('rpt-table-head');
    const tbody = document.getElementById('rpt-table-body');

    if (month === 'ALL') {
      setText('rpt-chart-title', `Monthly Cash Flow Trend (${year})`);
      setText('rpt-table-title', `Monthly Statement Summary (${year})`);

      thead.innerHTML = `
        <tr>
          <th>Month</th>
          <th style="text-align:right">Income (₹)</th>
          <th style="text-align:right">Expense (₹)</th>
          <th style="text-align:right">Net Cash Flow (₹)</th>
          <th style="text-align:right">Savings Rate</th>
        </tr>
      `;

      if (!breakdown || breakdown.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px">No data recorded for ${year}</td></tr>`;
      } else {
        const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        tbody.innerHTML = breakdown.map(m => {
          const mInc = m.income || 0;
          const mExp = m.expense || 0;
          const mNet = mInc - mExp;
          const mRate = mInc > 0 ? ((mNet / mInc) * 100).toFixed(1) : 0;
          const netClass = mNet >= 0 ? 'text-success' : 'text-danger';

          return `
            <tr>
              <td style="font-weight:600">${shortMonths[(m.month || 1) - 1]} ${m.year || year}</td>
              <td style="text-align:right" class="amount-income">${formatINR(mInc)}</td>
              <td style="text-align:right" class="amount-expense">${formatINR(mExp)}</td>
              <td style="text-align:right;font-weight:700" class="${netClass}">${formatINR(mNet)}</td>
              <td style="text-align:right"><span class="badge ${mRate >= 0 ? 'badge-success' : 'badge-danger'}">${mRate}%</span></td>
            </tr>
          `;
        }).join('');
      }

      // Chart — Always render complete 12-month timeline for the year
      initChartDefaults();
      const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const incData = new Array(12).fill(0);
      const expData = new Array(12).fill(0);

      breakdown.forEach(m => {
        const mIdx = (m.month || 1) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          incData[mIdx] = m.income || 0;
          expData[mIdx] = m.expense || 0;
        }
      });

      renderIncomeExpenseChart('rpt-chart-trend', labels, incData, expData);

    } else {
      // Month-specific view
      const selectedMonthName = monthNames[parseInt(month) - 1];
      setText('rpt-chart-title', `Category Expense Breakdown — ${selectedMonthName} ${year}`);
      setText('rpt-table-title', `Transaction Summary Ledger — ${selectedMonthName} ${year}`);

      thead.innerHTML = `
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Account</th>
          <th style="text-align:right">Money Out (₹)</th>
          <th style="text-align:right">Money In (₹)</th>
        </tr>
      `;

      // Filter transactions for selected month
      let txs = data.filteredTransactions;
      if (!txs) {
        const allRes = await API.transactions.getAll({ size: 5000 });
        const mNum = String(month).padStart(2, '0');
        txs = (allRes.content || []).filter(t => {
          const dt = t.transactionDate || t.createdAt || '';
          return dt.startsWith(`${year}-${mNum}`);
        });
      }

      if (!txs || txs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px">No transactions recorded for ${selectedMonthName} ${year}</td></tr>`;
      } else {
        tbody.innerHTML = txs.map(t => `
          <tr>
            <td style="font-weight:600;white-space:nowrap">${t.transactionDate || ''}</td>
            <td>${escapeHTML(t.description || 'N/A')}</td>
            <td><span class="badge badge-primary">${escapeHTML(t.categoryName || 'Uncategorized')}</span></td>
            <td style="color:var(--text-muted)">${escapeHTML(t.accountName || 'Cash')}</td>
            <td style="text-align:right" class="amount-expense">${['EXPENSE','TRANSFER_OUT','LOAN_PAYMENT','INTEREST'].includes(t.type) ? formatINR(t.amount) : '-'}</td>
            <td style="text-align:right" class="amount-income">${['INCOME','TRANSFER_IN','REFUND'].includes(t.type) ? formatINR(t.amount) : '-'}</td>
          </tr>
        `).join('');
      }

      // Render category chart
      const catMap = {};
      (txs || []).filter(t => ['EXPENSE','LOAN_PAYMENT','INTEREST'].includes(t.type)).forEach(t => {
        const cName = t.categoryName || 'Uncategorized';
        catMap[cName] = (catMap[cName] || 0) + (t.amount || 0);
      });
      const catNames = Object.keys(catMap);
      const catAmts = Object.values(catMap);
      const catColors = ['#ef4444', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308', '#6366f1', '#10b981'];

      initChartDefaults();
      renderCategoryChart('rpt-chart-trend', catNames.length > 0 ? catNames : ['No Expense Data'], catAmts.length > 0 ? catAmts : [1], catColors);
    }

  } catch (err) {
    console.error('Failed to load reports:', err);
    Toast.error('Failed to load report data');
  }
}

async function exportData(format) {
  if (format === 'csv') {
    return exportCSV();
  } else if (format === 'pdf') {
    return exportPDF();
  }
}

async function exportCSV() {
  try {
    const year = getVal('report-year') || new Date().getFullYear();
    const month = getVal('report-month') || 'ALL';
    const res = await API.transactions.getAll({ size: 5000 });
    let txs = res.content || [];

    if (year) {
      txs = txs.filter(t => (t.transactionDate || '').startsWith(String(year)));
    }
    if (month && month !== 'ALL') {
      const mNum = String(month).padStart(2, '0');
      txs = txs.filter(t => (t.transactionDate || '').slice(5, 7) === mNum);
    }

    if (txs.length === 0) {
      Toast.warning('No transactions to export for selected period');
      return;
    }

    const headers = ['Date', 'Type', 'Description', 'Account', 'Category', 'Business', 'Amount', 'Status'];
    const rows = txs.map(t => [
      t.transactionDate,
      t.type,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.accountName || ''}"`,
      `"${t.categoryName || ''}"`,
      `"${t.businessName || ''}"`,
      t.amount,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrackWallet_Report_${year}_Month_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    Toast.success('CSV Report exported successfully');
  } catch (err) {
    Toast.error('CSV Export failed');
  }
}

async function exportPDF() {
  try {
    Toast.info('Generating PDF Financial Statement...');

    const year = getVal('report-year') || new Date().getFullYear();
    const month = getVal('report-month') || 'ALL';
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthLabel = month !== 'ALL' ? monthNames[parseInt(month) - 1] : 'Full Year';

    // Fetch transactions
    const res = await API.transactions.getAll({ size: 5000 });
    let txs = res.content || [];

    if (year) {
      txs = txs.filter(t => (t.transactionDate || '').startsWith(String(year)));
    }
    if (month && month !== 'ALL') {
      const mNum = String(month).padStart(2, '0');
      txs = txs.filter(t => (t.transactionDate || '').slice(5, 7) === mNum);
    }

    const totalIncome = txs.filter(t => ['INCOME','TRANSFER_IN','REFUND'].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = txs.filter(t => ['EXPENSE','TRANSFER_OUT','LOAN_PAYMENT','INTEREST'].includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0);
    const netSavings = totalIncome - totalExpense;

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      window.print();
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Title / Header Banner
    doc.setFillColor(18, 21, 30);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('TrackWallet', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('FINANCIAL SUMMARY STATEMENT', 14, 23);

    doc.setFontSize(10);
    doc.setTextColor(248, 250, 252);
    doc.text(`Period: ${monthLabel} ${year}`, 145, 16);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 23);

    // Summary KPI Box
    doc.setFillColor(25, 28, 40);
    doc.roundedRect(14, 44, 182, 26, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('TOTAL INCOME', 22, 53);
    doc.text('TOTAL EXPENSE', 82, 53);
    doc.text('NET SAVINGS', 142, 53);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(`INR ${formatINR(totalIncome)}`, 22, 62);

    doc.setTextColor(239, 68, 68);
    doc.text(`INR ${formatINR(totalExpense)}`, 82, 62);

    doc.setTextColor(netSavings >= 0 ? 99 : 239, netSavings >= 0 ? 102 : 68, netSavings >= 0 ? 241 : 68);
    doc.text(`INR ${formatINR(netSavings)}`, 142, 62);

    // Table
    const tableData = txs.map(t => [
      t.transactionDate || '',
      t.type || '',
      t.description || '',
      t.accountName || 'Cash',
      t.categoryName || 'Uncategorized',
      ['EXPENSE','TRANSFER_OUT','LOAN_PAYMENT','INTEREST'].includes(t.type) ? formatINR(t.amount) : '-',
      ['INCOME','TRANSFER_IN','REFUND'].includes(t.type) ? formatINR(t.amount) : '-'
    ]);

    doc.autoTable({
      startY: 76,
      head: [['Date', 'Type', 'Description', 'Account', 'Category', 'Out (INR)', 'In (INR)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
        6: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`TrackWallet Statement • Page ${i} of ${pageCount}`, 14, 288);
    }

    doc.save(`TrackWallet_Statement_${year}_${month}.pdf`);
    Toast.success('PDF Financial Statement exported');
  } catch (err) {
    console.error('PDF generation error:', err);
    Toast.error('PDF Export failed');
  }
}
