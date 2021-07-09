import Vue from 'vue'
import Vuex from 'vuex'
import Alerts from './alerts'

Vue.use(Vuex)

const withinDates = (txs, { start, end }) => txs.filter(tx => {
  const txdate = new Date(tx.date)
  return start <= txdate && txdate <= end
})

const totalAmount = (txs) => txs.map(t => t.amount.value).reduce((acc, i) => acc + i, 0).toFixed(2)

const reject = (res, commit) => res.json().then(e => {
  if (commit && res.status === 403) {
    commit('unAuthenticate')
  } else if (commit && e.message) {
    commit('setAlert', { type: 'error', message: e.message })
  }
  return Promise.reject(new Error(e.message))
})

const defaultRequestParams = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}

export default new Vuex.Store({
  state: {
    isLoading: true,
    isAuthenticated: false,
    account: null,
    categories: [],
    transactions: [],
    displayDate: {},
    alert: {
      type: 'error',
      message: ''
    },
    sortBy: {
      field: 'tx',
      desc: true
    }
  },
  getters: {
    filteredCats: state => state.categories.filter(c => c.hidden !== true),
    incomeCats: (state, getters) => getters.filteredCats.filter(c => c.kind === 'income'),
    expenseCats: (state, getters) => getters.filteredCats.filter(c => c.kind === 'expense'),
    catsByIds: (state, getters) => getters.filteredCats.reduce((acc, el) => {
      acc[el.id] = el
      return acc
    }, {}),
    filteredTransactions: state => state.transactions
      .filter(t => t.hidden !== true)
      .filter(t => t.amount.currency.code === state.account.settings.currency.code)
      .filter(t => state.account.settings.hideFutureTransactions ? new Date(t.date) <= new Date() : true),
    displayedTransactions: (state, getters) => ({
      current: withinDates(getters.filteredTransactions, state.displayDate),
      previous: withinDates(getters.filteredTransactions, state.displayDate.previous || {})
    }),
    expenseTransactions: (state, getters) => ({
      current: getters.displayedTransactions.current.filter(t => t.kind === 'expense'),
      previous: getters.displayedTransactions.previous.filter(t => t.kind === 'expense')
    }),
    totalSpent: (state, getters) => totalAmount(getters.expenseTransactions.current),
    incomeTransactions: (state, getters) => getters.displayedTransactions.current.filter(t => t.kind === 'income'),
    totalEarned: (state, getters) => totalAmount(getters.incomeTransactions)
  },
  mutations: {
    sort (state, sortBy) {
      state.sortBy = { ...sortBy }
    },
    setAlert (state, alert) {
      state.alert = { ...alert }
    },
    clearAlert (state) {
      state.alert = { message: '', type: '' }
    },
    authenticate (state) {
      state.isAuthenticated = true
    },
    unAuthenticate (state) {
      state.isAuthenticated = false
    },
    loading (state) {
      state.isLoading = true
    },
    loaded (state) {
      state.isLoading = false
    },
    setAccount (state, account) {
      state.account = account
    },
    setSettings (state, newSettings) {
      state.account.settings = newSettings
    },
    setCategories (state, categories) {
      state.categories = categories
    },
    addCategory (state, category) {
      state.categories = [...state.categories, category]
    },
    updateCategory (state, updatedCategory) {
      state.categories = state.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    },
    hideCategory (state, { id, hidden }) {
      state.categories = state.categories.map(cat => cat.id === id ? { ...cat, hidden } : cat)
    },
    setTransactions (state, txs) {
      state.transactions = txs
    },
    addTransaction (state, tx) {
      state.transactions = [...state.transactions, tx]
    },
    setDisplayDate (state, newDate) {
      state.displayDate = newDate
    },
    hideTransaction (state, { id, hidden }) {
      state.transactions = state.transactions.map(tx => tx.id === id ? { ...tx, hidden } : tx)
    },
    updateTransaction (state, updatedTx) {
      state.transactions = state.transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx)
    }
  },
  actions: {
    loadData ({ commit, dispatch }, account) {
      return Promise.all([dispatch('getCategories'), dispatch('getTransactions')])
        .then(() => {
          commit('authenticate')
          commit('setAccount', account)
        })
        .catch(() => {
          commit('unAuthenticate')
        })
        .then(() => commit('loaded'))
    },
    createAccount ({ commit }, requestBody) {
      return fetch('/api/auth/account', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 201 ? res.json() : reject(res, commit))
        .then(() => commit('setAlert', Alerts.REGISTRATION_SUCCESS))
    },
    getAccount ({ commit, dispatch }) {
      return fetch('/api/auth/account', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => dispatch('loadData', acc))
        .catch(() => commit('loaded'))
    },
    updateAccountSettings ({ commit, state }, requestBody) {
      return fetch(`/api/auth/account/${state.account.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('setSettings', requestBody) : reject(res, commit))
    },
    changeAccountPassword ({ commit, state }, requestBody) {
      return fetch(`/api/auth/account/${state.account.id}/password`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('setAlert', Alerts.PASSWORD_CHANGE_SUCCESS) : reject(res, commit))
    },
    login ({ commit, dispatch }, requestBody) {
      return fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 200 ? res.json() : reject(res, commit))
        .then(acc => dispatch('loadData', acc))
    },
    logout ({ commit }) {
      return fetch('/api/auth/logout', {
        method: 'POST',
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? {} : reject(res))
        .then(() => {
          commit('setAccount', {})
          commit('unAuthenticate')
          commit('setCategories', [])
          commit('setTransactions', [])
          commit('setDisplayDate', {})
        })
    },
    createCategory ({ commit, dispatch }, requestBody) {
      return fetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 201 ? res.json() : reject(res, commit))
        .then(res => dispatch('getCategory', res.id))
    },
    getCategories ({ commit }) {
      return fetch('/api/categories', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(cats => commit('setCategories', cats))
    },
    getCategory ({ commit }, id) {
      return fetch(`/api/categories/${id}`, defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(cat => commit('addCategory', cat))
    },
    hideCategory ({ commit }, { id, hidden }) {
      return fetch(`/api/categories/${id}/hidden`, {
        ...defaultRequestParams,
        method: 'PUT',
        body: JSON.stringify({ hidden })
      })
        .then(res => res.status === 204 ? commit('hideCategory', { id, hidden }) : reject(res))
    },
    updateCategory ({ commit }, requestBody) {
      return fetch(`/api/categories/${requestBody.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('updateCategory', requestBody) : reject(res, commit))
    },
    getTransactions ({ commit }) {
      return fetch('/api/transactions', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(txs => commit('setTransactions', txs))
    },
    createTransaction ({ commit, dispatch }, requestBody) {
      return fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 201 ? res.json() : reject(res, commit))
        .then(res => dispatch('getTransaction', res.id))
    },
    getTransaction ({ commit }, id) {
      return fetch(`/api/transactions/${id}`, defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(tx => commit('addTransaction', tx))
    },
    hideTransaction ({ commit }, { id, hidden }) {
      return fetch(`/api/transactions/${id}/hidden`, {
        ...defaultRequestParams,
        method: 'PUT',
        body: JSON.stringify({ hidden })
      })
        .then(res => res.status === 204 ? commit('hideTransaction', { id, hidden }) : reject(res))
    },
    updateTransaction ({ commit }, requestBody) {
      return fetch(`/api/transactions/${requestBody.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('updateTransaction', requestBody) : reject(res))
    }
  },
  modules: {
  }
})
