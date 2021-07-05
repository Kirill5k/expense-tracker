import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const withinDates = (txs, { start, end }) => txs.filter(tx => {
  const txdate = new Date(tx.date)
  return start <= txdate && txdate <= end
})

const totalAmount = (txs) => txs.map(t => t.amount.value).reduce((acc, i) => acc + i, 0).toFixed(2)

const reject = (res, commit) => res.json().then(e => {
  if (commit) {
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
    }
  },
  getters: {
    incomeCats: state => state.categories.filter(c => c.kind === 'income'),
    expenseCats: state => state.categories.filter(c => c.kind === 'expense'),
    catsByIds: state => state.categories.reduce((acc, el) => {
      acc[el.id] = el
      return acc
    }, {}),
    displayedTransactions: state => withinDates(state.transactions, state.displayDate),
    expenseTransactions: (state, getters) => getters.displayedTransactions.filter(t => t.kind === 'expense'),
    incomeTransactions: (state, getters) => getters.displayedTransactions.filter(t => t.kind === 'income'),
    totalSpent: (state, getters) => totalAmount(getters.expenseTransactions),
    totalEarned: (state, getters) => totalAmount(getters.incomeTransactions)
  },
  mutations: {
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
    setCategories (state, categories) {
      state.categories = categories
    },
    addCategory (state, category) {
      state.categories = [...state.categories, category]
    },
    updateCategory (state, updatedCategory) {
      state.categories = state.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    },
    removeCategory (state, id) {
      state.categories = state.categories.filter(cat => cat.id !== id)
    },
    setTransactions (state, txs) {
      state.transactions = txs.sort((a, b) => -a.date.localeCompare(b.date))
    },
    addTransaction (state, tx) {
      state.transactions = [...state.transactions, tx].sort((a, b) => -a.date.localeCompare(b.date))
    },
    setDisplayDate (state, newDate) {
      state.displayDate = newDate
    },
    removeTransaction (state, id) {
      state.transactions = state.transactions.filter(tx => tx.id !== id)
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
    },
    getAccount ({ commit, dispatch }) {
      return fetch('/api/auth/account', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => dispatch('loadData', acc))
        .catch(() => commit('loaded'))
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
        .then(res => res.status === 201 ? res.json() : reject(res))
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
    deleteCategory ({ commit }, id) {
      return fetch(`/api/categories/${id}`, { ...defaultRequestParams, method: 'DELETE' })
        .then(res => res.status === 204 ? commit('removeCategory', id) : reject(res))
    },
    updateCategory ({ commit }, requestBody) {
      return fetch(`/api/categories/${requestBody.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('updateCategory', requestBody) : reject(res))
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
        .then(res => res.status === 201 ? res.json() : reject(res))
        .then(res => dispatch('getTransaction', res.id))
    },
    getTransaction ({ commit }, id) {
      return fetch(`/api/transactions/${id}`, defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(tx => commit('addTransaction', tx))
    },
    deleteTransaction ({ commit }, id) {
      return fetch(`/api/transactions/${id}`, { ...defaultRequestParams, method: 'DELETE' })
        .then(res => res.status === 204 ? commit('removeTransaction', id) : reject(res))
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
