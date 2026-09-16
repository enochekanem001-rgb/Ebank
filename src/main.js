import './style.css'

const icon = (name) => {
  const icons = {
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l3-4 3 2 5-7"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4 8h16m-4 4h4"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4m14 4H3"/></svg>',
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-1.2 1.4-2.1 1.5-2.1 3M12 17h.01"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>'
  }
  return icons[name] || ''
}

let transactions = []

const balances = {
  checking: 0,
  savings: 0,
  investment: 0,
}

const currencyState = { code: 'NGN', symbol: '₦', rate: 1, date: 'Today' }

let activeFilter = 'All activity'

const transactionIcon = (type) => ({ groceries: '◒', deposit: '↙', coffee: '◓', subscription: '✦', transfer: '⇄' })[type]

function renderTransactions() {
  return transactions.map(([name, date, amount, type, tone]) => `
    <div class="transaction">
      <span class="transaction-icon ${tone}">${transactionIcon(type)}</span>
      <span class="transaction-copy"><strong>${name}</strong><small>${date}</small></span>
      <strong class="amount ${tone}">${amount}</strong>
    </div>
  `).join('')
}

const money = (value) => `${currencyState.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const filteredTransactions = () => activeFilter === 'Income'
  ? transactions.filter((item) => item[4] === 'credit')
  : activeFilter === 'Spending'
    ? transactions.filter((item) => item[4] === 'debit')
    : activeFilter === 'Transfers'
      ? transactions.filter((item) => item[3] === 'transfer')
      : transactions

const renderFilteredTransactions = () => filteredTransactions().map(([name, date, amount, type, tone]) => `
  <div class="transaction"><span class="transaction-icon ${tone}">${transactionIcon(type)}</span><span class="transaction-copy"><strong>${name}</strong><small>${date}</small></span><strong class="amount ${tone}">${amount}</strong></div>
`).join('') || '<p class="empty-state">No transactions found.</p>'

const refreshDashboard = () => {
  const total = balances.checking + balances.savings + balances.investment
  document.querySelector('.total-balance').textContent = money(total * currencyState.rate)
  document.querySelector('.checking-balance').textContent = money(balances.checking * currencyState.rate)
  document.querySelector('.savings-balance').textContent = money(balances.savings * currencyState.rate)
  document.querySelector('.investment-balance').textContent = money(balances.investment * currencyState.rate)
  document.querySelector('#transaction-list').innerHTML = renderFilteredTransactions()
}

function appTemplate() {
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">N</span><span>northstar</span></div>
        <div class="profile"><span class="avatar signed-out">?</span><span><strong>Signed out</strong><small>Sign in to continue</small></span><span class="chevron">⌄</span></div>
        <nav class="nav" aria-label="Main navigation">
          <button class="nav-item active" data-view="Overview">${icon('grid')}<span>Overview</span></button>
          <button class="nav-item" data-view="Accounts">${icon('wallet')}<span>Accounts</span><span class="nav-count">3</span></button>
          <button class="nav-item" data-view="Payments">${icon('repeat')}<span>Payments</span></button>
          <button class="nav-item" data-view="Cards">${icon('card')}<span>Cards</span></button>
          <button class="nav-item" data-view="Insights">${icon('chart')}<span>Insights</span></button>
          <button class="nav-item" data-view="Documents">${icon('file')}<span>Documents</span></button>
        </nav>
        <div class="sidebar-bottom">
          <button class="nav-item" data-view="Help">${icon('help')}<span>Help center</span></button>
          <div class="upgrade"><span class="spark">✦</span><strong>Make your money<br/>work harder</strong><small>Explore Smart Invest</small><button class="upgrade-arrow" aria-label="Explore Smart Invest">${icon('arrow')}</button></div>
          <div class="secure"><span>◉</span> FDIC insured up to $250,000</div>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div class="mobile-brand"><span class="brand-mark">N</span> northstar</div><div class="top-actions"><button class="icon-button" title="Search">${icon('search')}</button><button class="icon-button notification" title="Notifications">${icon('bell')}<i></i></button><button class="top-avatar" title="Account menu">?</button></div></header>
        <section class="welcome"><div><p class="eyebrow">Thursday, March 20, 2025</p><h1>Welcome to Northstar <span>✦</span></h1><p class="muted">Sign in to manage your money securely.</p></div><button class="primary-action" id="add-money">Sign in</button></section>
        <section class="metrics" aria-label="Account summary">
          <article class="balance-card"><div class="card-top"><span class="eyebrow light">Total balance</span><button class="more-button" aria-label="More options">•••</button></div><div class="total-balance">₦0.00</div><div class="balance-footer"><span class="positive">↗ 0.0%</span><span>new account</span><button class="balance-link" id="convert-currency">Convert currency ${icon('arrow')}</button></div></article>
          <article class="metric-card"><div class="metric-head"><span class="metric-icon green">${icon('chart')}</span><span class="positive">0.0%</span></div><span class="eyebrow">This month's income</span><strong>₦0.00</strong><div class="mini-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
          <article class="metric-card"><div class="metric-head"><span class="metric-icon coral">${icon('arrow')}</span><span class="negative">0.0%</span></div><span class="eyebrow">This month's spending</span><strong>₦0.00</strong><div class="spend-line"><span></span></div><small>Under budget by <b>₦0.00</b></small></article>
        </section>
        <div class="content-grid">
          <section class="panel activity-panel"><div class="section-head"><div><h2>Recent activity</h2><p class="muted">Your latest transactions</p></div><button class="text-button" id="view-all">View all ${icon('arrow')}</button></div><div class="filter-row"><button class="filter active">All activity</button><button class="filter">Income</button><button class="filter">Spending</button><button class="filter">Transfers</button><button class="download" title="Download activity">${icon('download')}</button></div><div class="transaction-list" id="transaction-list">${renderTransactions()}</div></section>
          <section class="panel accounts-panel"><div class="section-head"><div><h2>Your accounts</h2><p class="muted">Money across your accounts</p></div><button class="round-button" id="new-account" title="Add account">${icon('plus')}</button></div><div class="account-list"><div class="account-row"><span class="account-symbol checking">₦</span><span><strong>Everyday Checking</strong><small>•••• 4821</small></span><strong class="checking-balance">₦0.00</strong></div><div class="account-row"><span class="account-symbol savings">✧</span><span><strong>Rainy Day Savings</strong><small>•••• 1039</small></span><strong class="savings-balance">₦0.00</strong></div><div class="account-row"><span class="account-symbol invest">↗</span><span><strong>Investment account</strong><small>•••• 7044</small></span><strong class="investment-balance">₦0.00</strong></div></div><button class="outline-button" id="open-account">Open a new account ${icon('arrow')}</button></section>
        </div>
        <section class="quick-section"><div class="section-head"><div><h2>Quick actions</h2><p class="muted">Common things, one tap away</p></div></div><div class="quick-actions"><button class="quick-action" data-action="Send money"><span class="quick-icon send">↗</span><span><strong>Send money</strong><small>To anyone, instantly</small></span>${icon('arrow')}</button><button class="quick-action" data-action="Pay a bill"><span class="quick-icon bill">▤</span><span><strong>Pay a bill</strong><small>Manage your payments</small></span>${icon('arrow')}</button><button class="quick-action" data-action="Move money"><span class="quick-icon move">⇄</span><span><strong>Move money</strong><small>Between your accounts</small></span>${icon('arrow')}</button><button class="quick-action" data-action="View insights"><span class="quick-icon insight">◔</span><span><strong>View insights</strong><small>See your spending trends</small></span>${icon('arrow')}</button></div></section>
        <div class="toast" id="toast" role="status"></div>
        <div class="modal-backdrop" id="modal-backdrop" hidden>
          <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button class="modal-close" id="modal-close" aria-label="Back to dashboard">←</button>
            <div id="modal-content"></div>
          </section>
        </div>
      </main>
    </div>`
}

document.querySelector('#app').innerHTML = appTemplate()

const toast = (message) => {
  const element = document.querySelector('#toast')
  element.textContent = message
  element.classList.add('show')
  window.setTimeout(() => element.classList.remove('show'), 2600)
}

const authState = {
  signedIn: false,
  name: 'Jordan Davis',
  email: 'jordan@example.com',
  username: '',
  pendingCode: '',
}

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `${window.location.protocol}//${window.location.hostname}:8787`
  : ''

const apiRequest = async (path, payload) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

const modal = document.querySelector('#modal-backdrop')
const modalContent = document.querySelector('#modal-content')

const closeModal = () => {
  modal.hidden = true
  document.body.classList.remove('modal-open')
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'))
  document.querySelector('.nav-item[data-view="Overview"]')?.classList.add('active')
}

const setActivePage = (view) => {
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'))
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active')
}

const openModal = (title, content, submitLabel = '', onSubmit) => {
  modalContent.innerHTML = `<p class="eyebrow">Northstar banking</p><h2 id="modal-title">${title}</h2>${content}${submitLabel ? `<button class="modal-submit" id="modal-submit">${submitLabel}</button>` : ''}`
  modal.hidden = false
  document.body.classList.add('modal-open')
  document.querySelector('#modal-submit')?.addEventListener('click', async () => {
    if (onSubmit && await onSubmit() === false) return
    if (title === 'Help center') {
      window.location.href = 'tel:+2347012735525'
      return
    }
    toast(`${title} completed successfully`)
    closeModal()
  })
  document.querySelectorAll('.selectable button').forEach((button) => button.addEventListener('click', () => {
    toast(`${button.textContent.trim()} selected`)
    closeModal()
  }))
  document.querySelector('#freeze-card')?.addEventListener('click', () => {
    toast('Card frozen successfully')
    closeModal()
  })
  document.querySelectorAll('[data-page-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.pageAction
    if (action === 'send-money') showAction('Send money')
    if (action === 'pay-bill') showAction('Pay a bill')
    if (action === 'move-money') showAction('Move money')
    if (action === 'add-money') showAction('Add money')
    if (action === 'new-account') openModal('Open a new account', '<p class="modal-note">Choose the account that fits your next goal.</p><div class="modal-list selectable"><button>High-yield savings <b>3.75% APY</b></button><button>Everyday checking <b>No monthly fee</b></button></div>')
    if (action === 'freeze-card') {
      button.textContent = 'Card frozen'
      button.disabled = true
      toast('Card frozen successfully')
    }
    if (action === 'replace-card') openModal('Replace card', '<p class="modal-note">Your replacement card will arrive in 5-7 business days. Your current card stays active until you confirm delivery.</p>', 'Request replacement')
    if (action === 'budget') openModal('Set a monthly budget', '<div class="modal-form"><label>Monthly budget<input type="number" min="1" placeholder="₦0.00" /></label></div>', 'Save budget')
    if (action === 'export-insights') toast('Insights report downloaded')
    if (action === 'document') toast(`${button.dataset.document} is downloading`)
  }))
}

const updateProfile = () => {
  const profile = document.querySelector('.profile')
  const avatar = document.querySelector('.top-avatar')
  profile.innerHTML = authState.signedIn
    ? `<span class="avatar">${(authState.name || authState.username || 'P').slice(0, 2).toUpperCase()}</span><span><strong>${authState.name || authState.username || 'Personal account'}</strong><small>Personal account</small></span><span class="chevron">⌄</span>`
    : '<span class="avatar signed-out">?</span><span><strong>Signed out</strong><small>Sign in to continue</small></span><span class="chevron">⌄</span>'
  avatar.textContent = authState.signedIn ? (authState.name || authState.username || 'P').slice(0, 2).toUpperCase() : '?'
  avatar.classList.toggle('signed-out', !authState.signedIn)
  document.querySelector('.welcome h1').innerHTML = authState.signedIn ? `Good morning, ${authState.name || authState.username} <span>✦</span>` : 'Welcome to Northstar <span>✦</span>'
  document.querySelector('.welcome .muted').textContent = authState.signedIn ? "Here's your financial snapshot for today." : 'Sign in to manage your money securely.'
  const primaryAction = document.querySelector('#add-money')
  primaryAction.innerHTML = authState.signedIn ? `${icon('plus')} Add money` : 'Sign in'
}

const openUsernameSetup = () => {
  openModal('Choose your username', '<p class="modal-note">Your email is verified. Choose a username for your Northstar profile.</p><div class="modal-form"><label>Username<input id="username-input" type="text" maxlength="20" placeholder="jordan_davis" autocomplete="username" required /></label><small class="username-hint">3-20 lowercase letters, numbers, or underscores.</small><button class="modal-submit" id="save-username">Save username</button></div>')
  document.querySelector('#save-username').addEventListener('click', async () => {
    const username = document.querySelector('#username-input').value.trim().toLowerCase()
    try {
      const result = await apiRequest('/api/users/username', { email: authState.email, username })
      authState.username = result.username
      updateProfile()
      closeModal()
      toast(`Username ${result.username} saved`)
    } catch (error) {
      toast(error.message)
    }
  })
}

const openNameSetup = () => {
  openModal('What should we call you?', '<p class="modal-note">Your email is verified. Tell us the name you want Northstar to use.</p><div class="modal-form"><label>Your name<input id="name-input" type="text" minlength="3" maxlength="10" placeholder="Jordan" autocomplete="name" required /></label><small class="username-hint">Use 3-10 characters.</small><button class="modal-submit" id="save-name">Continue</button></div>')
  document.querySelector('#save-name').addEventListener('click', () => {
    const name = document.querySelector('#name-input').value.trim()
    if (name.length < 3 || name.length > 10) {
      toast('Your name must be 3-10 characters')
      return
    }
    saveProfileName(name)
  })
}

const saveProfileName = async (name) => {
  try {
    const result = await apiRequest('/api/users/profile', { email: authState.email, displayName: name })
    authState.name = result.displayName
    updateProfile()
    if (authState.username) {
      closeModal()
      toast('Profile name saved')
    } else {
      openUsernameSetup()
    }
  } catch (error) {
    toast(error.message)
  }
}

const currencyOptions = [
  ['NGN', '₦', 'Nigerian naira'],
  ['USD', '$', 'US dollar'],
  ['GBP', '£', 'British pound'],
  ['EUR', '€', 'Euro'],
  ['GHS', '₵', 'Ghanaian cedi'],
  ['KES', 'KSh', 'Kenyan shilling'],
]

const openCurrencyConverter = () => {
  openModal('Convert currency', `<p class="modal-note">Your account remains held in naira. This only changes the display currency using today's live exchange rate.</p><div class="modal-form"><label>Show balance in<select id="currency-select">${currencyOptions.map(([code, symbol, name]) => `<option value="${code}" data-symbol="${symbol}">${symbol} ${name} (${code})</option>`).join('')}</select></label><button class="modal-submit" id="get-rate">Get today's rate</button></div>`)
  document.querySelector('#currency-select').value = currencyState.code
  document.querySelector('#get-rate').addEventListener('click', async () => {
    const select = document.querySelector('#currency-select')
    const code = select.value
    const option = select.selectedOptions[0]
    const symbol = option.dataset.symbol
    const button = document.querySelector('#get-rate')
    button.disabled = true
    button.textContent = 'Getting live rate...'
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/NGN`)
      const data = await response.json()
      if (data.result !== 'success' || !data.rates[code]) throw new Error('Live exchange rate unavailable')
      currencyState.code = code
      currencyState.symbol = symbol
      currencyState.rate = data.rates[code]
      currencyState.date = data.time_last_update_utc?.slice(0, 16) || 'Today'
      refreshDashboard()
      closeModal()
      toast(`Balances now shown in ${code}`)
    } catch (error) {
      button.disabled = false
      button.textContent = "Get today's rate"
      toast(error.message)
    }
  })
}

const openSignIn = () => {
  openModal('Sign in to Northstar', '<p class="modal-note">Enter your email address and we will send the verification code there.</p><div class="modal-form"><label>Your email address<input id="auth-email" type="email" placeholder="Enter your email address" autocomplete="email" required /></label><button class="modal-submit" id="send-code">Send verification code</button></div>')
  document.querySelector('#send-code').addEventListener('click', async () => {
    const email = document.querySelector('#auth-email').value.trim()
    try {
      await apiRequest('/api/auth/request-code', { email })
      authState.email = email
      modalContent.innerHTML = `<p class="eyebrow">Verification required</p><h2 id="modal-title">Check your email</h2><p class="modal-note">We sent a 6-digit code to <strong>${email}</strong>. Enter it below to finish signing in.</p><div class="modal-form"><label>Verification code<input id="auth-code" type="text" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code" required /></label><button class="modal-submit" id="verify-code">Verify and sign in</button><button class="link-button" id="resend-code">Send a new code</button></div>`
    } catch (error) {
      toast(error.message.includes('fetch') ? 'Start the API with npm run dev' : error.message)
      return
    }
    document.querySelector('#verify-code').addEventListener('click', async () => {
      const code = document.querySelector('#auth-code').value.trim()
      try {
        const result = await apiRequest('/api/auth/verify-code', { email, code })
        authState.email = result.user.email
        authState.username = result.user.username
        authState.name = result.user.display_name || ''
      } catch (error) {
        toast(error.message)
        return
      }
      authState.signedIn = true
      updateProfile()
      if (authState.username && authState.name) {
        closeModal()
        toast('You are signed in')
      } else if (!authState.name) {
        openNameSetup()
      } else {
        openUsernameSetup()
      }
    })
    document.querySelector('#resend-code').addEventListener('click', async () => {
      try {
        await apiRequest('/api/auth/request-code', { email })
        toast(`A new code was sent to ${email}`)
      } catch (error) {
        toast(error.message.includes('fetch') ? 'Start the API with npm run dev' : error.message)
      }
    })
  })
}

const openAccountMenu = () => {
  const actions = authState.signedIn
    ? '<button id="switch-account">Switch account <b>›</b></button><button id="account-settings">Account settings <b>›</b></button><button id="sign-out">Sign out <b>›</b></button>'
    : '<button id="sign-in">Sign in <b>›</b></button><button id="switch-account">Switch account <b>›</b></button>'
  openModal(authState.signedIn ? authState.username : 'Your Northstar account', `<p class="modal-note">${authState.signedIn ? authState.email : 'You are currently signed out.'}</p><div class="modal-list selectable">${actions}</div>`)
  document.querySelector('#sign-in')?.addEventListener('click', openSignIn)
  document.querySelector('#sign-out')?.addEventListener('click', () => {
    authState.signedIn = false
    updateProfile()
    closeModal()
    toast('You are signed out')
  })
  document.querySelector('#switch-account')?.addEventListener('click', () => {
    openModal('Switch account', '<p class="modal-note">Choose another profile or sign in with a different email.</p><div class="modal-list selectable"><button id="jordan-account">Use saved account <b>jordan@example.com</b></button><button id="different-account">Use a different email <b>›</b></button></div>')
    document.querySelector('#jordan-account').addEventListener('click', () => { authState.signedIn = true; updateProfile(); closeModal(); toast(`${authState.username || 'Account'} selected`) })
    document.querySelector('#different-account').addEventListener('click', openSignIn)
  })
  document.querySelector('#account-settings')?.addEventListener('click', () => {
    openModal('Account settings', '<div class="modal-list selectable"><button id="personal-details">Personal details <b>›</b></button><button id="security-settings">Security and passcode <b>›</b></button><button id="notification-settings">Notification preferences <b>›</b></button></div>')
    document.querySelector('#personal-details').addEventListener('click', () => openModal('Personal details', `<div class="modal-form"><label>Name<input id="settings-name" type="text" minlength="3" maxlength="10" value="${authState.name}" /></label><label>Email<input type="email" value="${authState.email}" disabled /></label><button class="modal-submit" id="save-settings-name">Save changes</button></div>`))
    document.querySelector('#save-settings-name')?.addEventListener('click', () => saveProfileName(document.querySelector('#settings-name').value.trim()))
    document.querySelector('#security-settings').addEventListener('click', () => openModal('Security and passcode', '<p class="modal-note">Your account uses email verification for sign-in. A new code is required each time you sign in.</p>', 'Send a new code'))
    document.querySelector('#notification-settings').addEventListener('click', () => openModal('Notification preferences', '<div class="modal-form"><label><input type="checkbox" checked /> Email notifications</label><label><input type="checkbox" checked /> Security alerts</label></div>', 'Save preferences'))
  })
}

const actionForms = {
  'Add money': ['Add money', '<label>Amount<input type="number" placeholder="0.00" min="1" /></label><label>Deposit into<select><option>Everyday Checking •••• 4821</option><option>Rainy Day Savings •••• 1039</option></select></label>', 'Continue'],
  'Pay a bill': ['Pay a bill', '<label>Biller<select><option>Choose a biller</option><option>Electricity</option><option>Internet</option><option>Mobile phone</option></select></label><label>Amount<input type="number" placeholder="0.00" min="1" /></label><label>Pay from<select><option>Everyday Checking •••• 4821</option></select></label>', 'Schedule payment'],
  'Move money': ['Move money', '<label>Move from<select><option>Everyday Checking •••• 4821</option><option>Rainy Day Savings •••• 1039</option></select></label><label>Move to<select><option>Rainy Day Savings •••• 1039</option><option>Everyday Checking •••• 4821</option></select></label><label>Amount<input type="number" placeholder="0.00" min="1" /></label>', 'Move money'],
}

const openSendMoney = async () => {
  openModal('Send money', '<p class="modal-note">Send NGN to any supported Nigerian bank account. We verify the account before sending.</p><div class="modal-form"><label>Bank<select id="transfer-bank"><option>Loading banks...</option></select></label><label>Account number<input id="transfer-account" type="text" inputmode="numeric" maxlength="10" placeholder="10-digit account number" autocomplete="off" /></label><button class="link-button" id="verify-recipient" type="button">Verify account</button><p class="recipient-status" id="recipient-status" role="status"></p><label>Amount (NGN)<input id="transfer-amount" type="number" placeholder="0.00" min="1" step="1" /></label></div>', 'Review transfer', () => completeAction('Send money'))
  const bankSelect = document.querySelector('#transfer-bank')
  try {
    const response = await fetch('http://localhost:8787/api/banks')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not load banks')
    bankSelect.innerHTML = '<option value="">Choose a bank</option>' + data.banks.map((bank) => `<option value="${bank.code}">${bank.name}</option>`).join('')
    document.querySelector('#verify-recipient').addEventListener('click', verifyRecipient)
  } catch (error) {
    bankSelect.innerHTML = '<option value="">Banks unavailable</option>'
    toast(error.message.includes('fetch') ? 'Start the API with npm run dev' : error.message)
  }
}

const verifyRecipient = async () => {
  const accountNumber = document.querySelector('#transfer-account')?.value.trim()
  const bankCode = document.querySelector('#transfer-bank')?.value
  const status = document.querySelector('#recipient-status')
  if (!accountNumber || !bankCode) {
    toast('Choose a bank and enter the account number')
    return
  }
  status.textContent = 'Verifying account...'
  try {
    const response = await fetch(`http://localhost:8787/api/banks/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not verify account')
    status.textContent = `Verified: ${data.accountName}`
    status.dataset.accountName = data.accountName
  } catch (error) {
    status.textContent = ''
    toast(error.message.includes('fetch') ? 'Start the API with npm run dev' : error.message)
  }
}

const completeAction = async (action) => {
  const amountInput = document.querySelector('.modal input[type="number"]')
  const amount = Number(amountInput?.value) / (action === 'Send money' ? 1 : currencyState.rate)
  if (!amount || amount <= 0) {
    toast('Enter an amount greater than zero')
    return false
  }
  const today = 'Just now'
  if (action === 'Add money') {
    balances.checking += amount
    transactions.unshift(['Money added', today, `+${money(amount)}`, 'deposit', 'credit'])
  } else if (action === 'Send money') {
    const status = document.querySelector('#recipient-status')
    const recipient = status?.dataset.accountName
    const accountNumber = document.querySelector('#transfer-account')?.value.trim()
    const bankCode = document.querySelector('#transfer-bank')?.value
    if (!recipient || !accountNumber || !bankCode) {
      toast('Verify the recipient account before sending')
      return false
    }
    const button = document.querySelector('#modal-submit')
    button.disabled = true
    button.textContent = 'Sending securely...'
    try {
      const result = await apiRequest('/api/transfers', { email: authState.email, name: recipient, accountNumber, bankCode, amount: Math.round(amount * 100) })
      balances.checking -= amount
      transactions.unshift([`Sent to ${result.recipient}`, today, `−${money(amount)}`, 'transfer', 'debit'])
      toast(`Transfer ${result.status || 'submitted'}: ${result.reference}`)
    } catch (error) {
      button.disabled = false
      button.textContent = 'Review transfer'
      toast(error.message)
      return false
    }
  } else if (action === 'Pay a bill') {
    if (amount > balances.checking) {
      toast('Insufficient checking balance')
      return false
    }
    balances.checking -= amount
    transactions.unshift(['Bill payment', today, `−${money(amount)}`, 'subscription', 'debit'])
  } else if (action === 'Move money') {
    const selects = document.querySelectorAll('.modal select')
    const fromSavings = selects[0]?.value.includes('Savings')
    const toSavings = selects[1]?.value.includes('Savings')
    const source = fromSavings ? 'savings' : 'checking'
    const destination = toSavings ? 'savings' : 'checking'
    if (source === destination) {
      toast('Choose two different accounts')
      return false
    }
    if (amount > balances[source]) {
      toast('Insufficient balance')
      return false
    }
    balances[source] -= amount
    balances[destination] += amount
    transactions.unshift(['Account transfer', today, `−${money(amount)}`, 'transfer', 'debit'])
  }
  refreshDashboard()
  return true
}

const showAction = (action) => {
  if (!authState.signedIn) {
    openSignIn()
    return
  }
  const form = actionForms[action]
  if (action === 'Send money') {
    openSendMoney()
    return
  }
  if (form) openModal(form[0], `<div class="modal-form">${form[1]}</div>`, form[2], () => completeAction(action))
  if (action === 'View insights') openModal('Spending insights', '<div class="insight-summary"><div><strong>58%</strong><span>Needs & bills</span></div><div><strong>24%</strong><span>Flexible spending</span></div><div><strong>18%</strong><span>Saving</span></div></div><p class="modal-note">You spent 8.2% less than last month. Your strongest saving category is dining out.</p>')
}

const viewContent = {
  Accounts: ['Your accounts', '<p class="modal-note">Manage balances, account details, and new accounts from one place.</p><div class="modal-list"><span>Everyday Checking <b>$8,420.18</b></span><span>Rainy Day Savings <b>$15,260.24</b></span><span>Investment account <b>$1,000.00</b></span></div><div class="page-actions"><button data-page-action="add-money">Add money</button><button data-page-action="new-account">Open new account</button><button data-page-action="move-money">Move money</button></div>'],
  Payments: ['Payments', '<p class="modal-note">Send money, pay bills, and review scheduled payments securely.</p><div class="modal-list"><span>Upcoming: Internet bill <b>Mar 25</b></span><span>Recent transfers <b>View activity</b></span></div><div class="page-actions"><button data-page-action="send-money">Send money</button><button data-page-action="pay-bill">Pay a bill</button><button data-page-action="move-money">Transfer between accounts</button></div>'],
  Cards: ['Cards', '<p class="modal-note">Your cards are protected and ready for everyday spending.</p><div class="virtual-card"><small>NORTHSTAR DEBIT</small><strong>•••• 4821</strong><span>Jordan Davis</span></div><div class="page-actions"><button data-page-action="freeze-card">Freeze card</button><button data-page-action="replace-card">Replace card</button></div>'],
  Insights: ['Insights', '<p class="modal-note">Your spending is trending lower this month.</p><div class="insight-summary"><div><strong>$1,840</strong><span>Spent this month</span></div><div><strong>$359</strong><span>Left in budget</span></div><div><strong>4.8%</strong><span>Balance growth</span></div></div><div class="page-actions"><button data-page-action="budget">Set a budget</button><button data-page-action="export-insights">Export report</button></div>'],
  Documents: ['Documents', '<div class="modal-list"><button data-page-action="document" data-document="February statement">February statement <b>Download PDF</b></button><button data-page-action="document" data-document="January statement">January statement <b>Download PDF</b></button><button data-page-action="document" data-document="Tax documents">Tax documents <b>Download</b></button></div>'],
  Help: ['Help center', '<p class="modal-note">Find answers about transfers, cards, security, and account access.</p><label>Search help<input type="search" placeholder="What do you need help with?" /></label><div class="support-card"><strong>Need more help?</strong><span>Call Northstar support</span><a href="tel:+2347012735525">+234 701 273 5525</a></div>', 'Contact support'],
}

document.querySelectorAll('.nav-item[data-view], .balance-link').forEach((button) => button.addEventListener('click', () => {
  setActivePage(button.dataset.view)
  const view = button.dataset.view === 'Accounts'
    ? ['Your accounts', `<p class="modal-note">Money across your accounts.</p><div class="modal-list"><span>Everyday Checking <b>${money(balances.checking * currencyState.rate)}</b></span><span>Rainy Day Savings <b>${money(balances.savings * currencyState.rate)}</b></span><span>Investment account <b>${money(balances.investment * currencyState.rate)}</b></span></div><div class="page-actions"><button data-page-action="add-money">Add money</button><button data-page-action="new-account">Open new account</button><button data-page-action="move-money">Move money</button></div>`]
    : viewContent[button.dataset.view]
  if (view) openModal(view[0], view[1], view[2] || '')
  if (button.dataset.view === 'Overview') closeModal()
}))

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'))
  button.classList.add('active')
  activeFilter = button.textContent
  refreshDashboard()
}))

document.querySelectorAll('.quick-action').forEach((button) => button.addEventListener('click', () => showAction(button.dataset.action)))
document.querySelector('#add-money').addEventListener('click', () => authState.signedIn ? showAction('Add money') : openSignIn())
document.querySelector('#convert-currency').addEventListener('click', openCurrencyConverter)
document.querySelector('#new-account').addEventListener('click', () => openModal('Open a new account', '<p class="modal-note">Choose the account that fits your next goal.</p><div class="modal-list selectable"><button>High-yield savings <b>3.75% APY</b></button><button>Everyday checking <b>No monthly fee</b></button><button>Investment account <b>Build your future</b></button></div>'))
document.querySelector('#open-account').addEventListener('click', () => openModal('Open a new account', '<p class="modal-note">Choose the account that fits your next goal.</p><div class="modal-list selectable"><button>High-yield savings <b>3.75% APY</b></button><button>Everyday checking <b>No monthly fee</b></button></div>'))
document.querySelector('#view-all').addEventListener('click', () => openModal('All activity', `<div class="modal-list">${transactions.map(([name, date, amount]) => `<span>${name}<b>${amount}<small>${date}</small></b></span>`).join('')}</div>`))
document.querySelector('.download').addEventListener('click', () => toast('Activity statement downloaded'))
document.querySelector('.icon-button[title="Search"]').addEventListener('click', () => openModal('Search your money', '<label>Search<input type="search" placeholder="Try “salary” or “coffee”" autofocus /></label>', 'Search'))
document.querySelector('.icon-button[title="Notifications"]').addEventListener('click', () => openModal('Notifications', '<div class="modal-list"><span>Salary deposit received <b>Today</b></span><span>Your March statement is ready <b>Yesterday</b></span></div>'))
document.querySelector('.more-button').addEventListener('click', () => openModal('Balance options', '<div class="modal-list selectable"><button>Hide balance</button><button>Share account details</button><button>Download statement</button></div>'))
document.querySelector('.upgrade-arrow').addEventListener('click', () => openModal('Smart Invest', '<p class="modal-note">Put your extra money to work with a simple, diversified portfolio.</p>', 'Explore investing'))
document.querySelector('.profile').addEventListener('click', openAccountMenu)
document.querySelector('.top-avatar').addEventListener('click', openAccountMenu)
document.querySelector('#modal-close').addEventListener('click', closeModal)
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal() })
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal() })
