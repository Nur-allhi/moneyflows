/* MoneyFlows Shared Modal System — 5 bottom-sheet modals */
(function(){
  'use strict';

  var IDS = {
    ADD_ACCT: 'mf-add-acct',
    EDIT_MEMBER: 'mf-edit-member',
    DELETE: 'mf-delete-confirm',
    TX_EDIT: 'mf-tx-edit',
    LOAN_REPORT: 'mf-loan-report'
  };

  var txEditType = 'income';
  var deleteCb = null;

  function qsa(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }

  function inject() {
    var div = document.createElement('div');
    div.innerHTML = [
      '<div class="modal-overlay" id="'+IDS.ADD_ACCT+'">',
        '<div class="modal-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="modal-title">Add Account</div>',
          '<div class="form-group"><label>Account Name</label><input type="text" id="mf-acct-name" placeholder="e.g. bKash" /></div>',
          '<div class="form-group"><label>Type</label><select id="mf-acct-type"><option value="bank">Bank</option><option value="cash">Cash</option><option value="mobile_wallet">Mobile Wallet</option><option value="counterparty">Counterparty</option><option value="credit_card">Credit Card</option><option value="savings">Savings</option><option value="investment">Investment</option></select></div>',
          '<div class="form-group"><label>Opening Balance (BDT)</label><input type="number" inputmode="numeric" id="mf-acct-balance" placeholder="0" /></div>',
          '<div class="form-group"><label>Opening Date</label><input type="date" id="mf-acct-date" /></div>',
          '<button class="submit-btn" onclick="MoneyFlows.Modals.submitAddAccount()">Add Account</button>',
        '</div>',
      '</div>',

      '<div class="modal-overlay" id="'+IDS.EDIT_MEMBER+'">',
        '<div class="modal-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="modal-title">Edit Member</div>',
          '<div class="form-group"><label>Name</label><input type="text" id="mf-edit-name" placeholder="Full name" /></div>',
          '<div class="form-group"><label>Short Name</label><input type="text" id="mf-edit-short" placeholder="e.g. Ef" maxlength="3" /></div>',
          '<button class="submit-btn" onclick="MoneyFlows.Modals.submitEditMember()">Save</button>',
        '</div>',
      '</div>',

      '<div class="modal-overlay" id="'+IDS.DELETE+'">',
        '<div class="modal-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="modal-title" id="mf-delete-title">Delete?</div>',
          '<p id="mf-delete-text" style="font:400 13px var(--font-body);color:var(--muted);margin-bottom:20px;line-height:1.5;">This will be moved to the Recycle Bin. You can recover it within 30 days.</p>',
          '<button class="submit-btn" onclick="MoneyFlows.Modals.submitDelete()" style="background:linear-gradient(135deg,var(--danger),oklch(50% 0.2 30));margin-bottom:8px;">Delete</button>',
          '<button onclick="MoneyFlows.Modals.close(\''+IDS.DELETE+'\')" style="width:100%;padding:14px;border:none;border-radius:12px;background:transparent;color:var(--muted);font:500 14px var(--font-body);cursor:pointer;">Cancel</button>',
        '</div>',
      '</div>',

      '<div class="modal-overlay" id="'+IDS.TX_EDIT+'">',
        '<div class="modal-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="modal-title">Edit Transaction</div>',
          '<div class="mf-type-toggle"><button class="mf-type-btn active" data-type="income" onclick="MoneyFlows.Modals.switchTxType(\'income\')">Income</button><button class="mf-type-btn" data-type="expense" onclick="MoneyFlows.Modals.switchTxType(\'expense\')">Expense</button></div>',
          '<div class="form-group"><label>Amount (BDT)</label><input type="number" inputmode="numeric" id="mf-tx-amount" placeholder="0" /></div>',
          '<div class="form-group"><label>Description</label><input type="text" id="mf-tx-desc" placeholder="Description" /></div>',
          '<div class="form-group"><label>Date</label><input type="date" id="mf-tx-date" /></div>',
          '<button class="submit-btn" onclick="MoneyFlows.Modals.submitTxEdit()">Save</button>',
        '</div>',
      '</div>',

      '<div class="modal-overlay" id="'+IDS.LOAN_REPORT+'">',
        '<div class="modal-sheet">',
          '<div class="modal-handle"></div>',
          '<div class="modal-title">Loan Report</div>',
          '<div id="mf-loan-report-body"></div>',
          '<button class="submit-btn" onclick="MoneyFlows.Modals.close(\''+IDS.LOAN_REPORT+'\')" style="margin-top:16px;">Close</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(div);
    qsa('.modal-overlay', div).forEach(function(el) {
      el.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
    });
  }

  var style = document.createElement('style');
  style.textContent = '.mf-type-toggle{display:flex;background:oklch(100% 0 0 / 0.06);border-radius:12px;padding:3px;margin-bottom:16px;gap:3px;}.mf-type-btn{flex:1;padding:12px;border:none;border-radius:10px;background:transparent;color:var(--muted);font:500 13px var(--font-body);cursor:pointer;transition:background 0.2s,color 0.2s;-webkit-tap-highlight-color:transparent;}.mf-type-btn.active{background:linear-gradient(135deg,var(--violet),oklch(50% 0.2 290));color:#fff;}.mf-type-btn:active{opacity:0.8;}';
  document.head.appendChild(style);

  var M = {};

  M.close = function(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); };

  M.addAccount = function(opts) {
    document.getElementById('mf-acct-name').value = '';
    document.getElementById('mf-acct-balance').value = '';
    document.getElementById('mf-acct-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('mf-acct-type').value = 'bank';
    M._addAcctCb = opts && opts.onSave;
    document.getElementById(IDS.ADD_ACCT).classList.add('open');
  };
  M.submitAddAccount = function() {
    var name = document.getElementById('mf-acct-name').value.trim();
    if (!name) return;
    var data = { name: name, type: document.getElementById('mf-acct-type').value, balance: parseFloat(document.getElementById('mf-acct-balance').value) || 0, date: document.getElementById('mf-acct-date').value };
    if (M._addAcctCb) M._addAcctCb(data);
    M.close(IDS.ADD_ACCT);
  };

  M.editMember = function(opts) {
    document.getElementById('mf-edit-name').value = opts && opts.name || '';
    document.getElementById('mf-edit-short').value = opts && opts.shortName || '';
    M._editMemberCb = opts && opts.onSave;
    document.getElementById(IDS.EDIT_MEMBER).classList.add('open');
  };
  M.submitEditMember = function() {
    var name = document.getElementById('mf-edit-name').value.trim();
    if (!name) return;
    var data = { name: name, shortName: (document.getElementById('mf-edit-short').value.trim() || name.slice(0, 2)).toUpperCase() };
    if (M._editMemberCb) M._editMemberCb(data);
    M.close(IDS.EDIT_MEMBER);
  };

  M.deleteConfirm = function(opts) {
    document.getElementById('mf-delete-title').textContent = opts && opts.title || 'Delete?';
    document.getElementById('mf-delete-text').textContent = opts && opts.message || 'This will be moved to the Recycle Bin. You can recover it within 30 days.';
    deleteCb = opts && opts.onDelete;
    document.getElementById(IDS.DELETE).classList.add('open');
  };
  M.submitDelete = function() {
    if (deleteCb) deleteCb();
    M.close(IDS.DELETE);
    deleteCb = null;
  };

  M.editTransaction = function(opts) {
    txEditType = opts && opts.type || 'income';
    document.getElementById('mf-tx-amount').value = opts && opts.amount || '';
    document.getElementById('mf-tx-desc').value = opts && opts.description || '';
    document.getElementById('mf-tx-date').value = opts && opts.date || new Date().toISOString().slice(0, 10);
    M._txEditCb = opts && opts.onSave;
    qsa('.mf-type-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.type === txEditType); });
    document.getElementById(IDS.TX_EDIT).classList.add('open');
  };
  M.switchTxType = function(type) {
    txEditType = type;
    qsa('.mf-type-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.type === type); });
  };
  M.submitTxEdit = function() {
    var amount = parseFloat(document.getElementById('mf-tx-amount').value) || 0;
    var desc = document.getElementById('mf-tx-desc').value.trim();
    if (amount <= 0 || !desc) return;
    var data = { type: txEditType, amount: txEditType === 'expense' ? -Math.abs(amount) : Math.abs(amount), description: desc, date: document.getElementById('mf-tx-date').value };
    if (M._txEditCb) M._txEditCb(data);
    M.close(IDS.TX_EDIT);
  };

  M.loanReport = function(opts) {
    opts = opts || {};
    var body = document.getElementById('mf-loan-report-body');
    var amount = opts.amount || 0;
    var repaid = opts.repaid || 0;
    var pct = amount > 0 ? Math.min(100, Math.round((repaid / amount) * 100)) : 0;
    var fmt = function(n) { return '\u09F3' + (Math.abs(n).toLocaleString('en-IN')); };
    var h = '';
    h += '<div style="text-align:center;"><div style="width:48px;height:48px;border-radius:50%;background:oklch(55% 0.18 290 / 0.15);color:var(--purple);display:grid;place-items:center;font-size:20px;margin:0 auto 8px;">\u{1F4CB}</div><div style="font:500 11px var(--font-body);letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Loan (Lend)</div><div style="font:600 20px var(--font-display);color:var(--fg);margin-bottom:4px;">' + (opts.borrower || '\u2014') + '</div><div style="font:700 28px var(--font-mono);font-variant-numeric:tabular-nums;color:var(--coral);margin-bottom:4px;">' + fmt(amount) + '</div><div style="font:400 11px var(--font-body);color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;">Total Outstanding</div>';
    if (amount > 0) {
      h += '<div style="margin-top:16px;"><div style="width:100%;height:10px;border-radius:5px;background:oklch(100% 0 0 / 0.08);overflow:hidden;"><div style="height:100%;width:' + pct + '%;border-radius:5px;background:linear-gradient(90deg,var(--teal),oklch(65% 0.15 170 / 0.6));"></div></div></div><div style="font:400 12px var(--font-mono);color:var(--muted);margin-top:8px;font-variant-numeric:tabular-nums;"><span style="color:var(--teal);font-weight:500;">' + pct + '%</span> repaid \u2014 ' + fmt(amount - repaid) + ' remaining</div>';
    }
    h += '</div><div class="td-divider" style="margin:16px 0;"></div><div class="td-field"><span class="td-field-label">Borrower</span><span class="td-field-value">' + (opts.borrower || '\u2014') + '</span></div><div class="td-field"><span class="td-field-label">Issue Date</span><span class="td-field-value">' + (opts.date || '\u2014') + '</span></div><div class="td-field"><span class="td-field-label">Interest</span><span class="td-field-value">' + (opts.interest || 'None') + '</span></div><div class="td-field"><span class="td-field-label">Transactions</span><span class="td-field-value">' + ((opts.transactions && opts.transactions.length) || '0') + '</span></div>';
    if (opts.transactions && opts.transactions.length > 0) {
      h += '<div class="td-divider" style="margin:16px 0;"></div><div style="font:600 14px var(--font-display);color:var(--fg);margin-bottom:8px;">Activity</div>';
      opts.transactions.slice(0, 10).forEach(function(tx) {
        var sign = (tx.amount || 0) >= 0 ? '+' : '';
        h += '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid oklch(100% 0 0 / 0.04);"><div style="font:400 11px var(--font-mono);color:var(--muted);width:56px;flex-shrink:0;">' + (tx.dateLabel || tx.date || '\u2014') + '</div><div style="flex:1;font:400 13px var(--font-body);color:var(--fg);padding:0 8px;">' + (tx.desc || '') + '</div><div style="font:500 13px var(--font-mono);color:' + ((tx.amount || 0) >= 0 ? 'var(--teal)' : 'var(--coral)') + ';">' + sign + fmt(Math.abs(tx.amount || 0)) + '</div></div>';
      });
    }
    body.innerHTML = h;
    document.getElementById(IDS.LOAN_REPORT).classList.add('open');
  };

  window.MoneyFlows = window.MoneyFlows || {};
  window.MoneyFlows.Modals = M;

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', inject); } else { inject(); }
})();
