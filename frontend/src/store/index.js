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
    commit('logout')
  }
  if (commit && e.message) {
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

const DEFAULT_STATE = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  categories: [],
  transactions: [],
  displayDate: {},
  alert: {
    type: 'error',
    message: null,
    show: false
  },
  sortBy: {
    field: 'tx',
    desc: true
  },
  filterBy: []
}

export default new Vuex.Store({
  state: {
    windowHeight: window.innerHeight,
    ...DEFAULT_STATE
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
      .filter(t => state.filterBy.includes(t.categoryId))
      .filter(t => t.hidden !== true)
      .filter(t => t.amount.currency.code === state.user.settings.currency.code)
      .filter(t => state.user.settings.hideFutureTransactions ? new Date(t.date) <= new Date() : true),
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
    setWindowHeight (state, newHeight) {
      state.windowHeight = newHeight
    },
    sort (state, sortBy) {
      state.sortBy = { ...sortBy }
    },
    filter (state, filters) {
      state.filterBy = filters
    },
    setAlert (state, alert) {
      state.alert = { ...alert, show: true }
    },
    clearAlert (state) {
      state.alert = { ...state.alert, show: false }
    },
    authenticate (state) {
      state.isAuthenticated = true
    },
    loading (state) {
      state.isLoading = true
    },
    loaded (state) {
      state.isLoading = false
    },
    setUser (state, user) {
      state.user = user
    },
    setSettings (state, newSettings) {
      state.user.settings = newSettings
    },
    setCategories (state, categories) {
      state.categories = categories
      state.filterBy = categories.map(c => c.id)
    },
    addCategory (state, category) {
      state.categories = [...state.categories, category]
      state.filterBy = [...state.filterBy, category.id]
    },
    updateCategory (state, updatedCategory) {
      state.categories = state.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    },
    hideCategory (state, { id, hidden }) {
      state.categories = state.categories.map(cat => cat.id === id ? { ...cat, hidden } : cat)
      state.filterBy = hidden ? state.filterBy.filter(c => c !== id) : [...state.filterBy, id]
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
    },
    logout (state) {
      state.isAuthenticated = false
      state.user = {}
      state.categories = []
      state.transaction = []
      state.displayDate = {}
      state.isLoading = false
    }
  },
  actions: {
    loadData ({ commit, dispatch }, user) {
      return Promise.all([dispatch('getCategories'), dispatch('getTransactions')])
        .then(() => {
          commit('authenticate')
          commit('setUser', user)
        })
        .then(() => commit('loaded'))
        .catch(() => commit('logout'))
    },
    createUser ({ commit }, requestBody) {
      return fetch('/api/auth/user', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 201 ? res.json() : reject(res, commit))
        .then(() => commit('setAlert', Alerts.REGISTRATION_SUCCESS))
    },
    getUser ({ commit, dispatch }) {
      return fetch('/api/auth/user', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => dispatch('loadData', acc))
        .catch(() => commit('loaded'))
    },
    updateUserSettings ({ commit, state }, requestBody) {
      return fetch(`/api/auth/user/${state.user.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('setSettings', requestBody) : reject(res, commit))
    },
    changeUserPassword ({ commit, state }, requestBody) {
      return fetch(`/api/auth/user/${state.user.id}/password`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('setAlert', Alerts.PASSWORD_CHANGE_SUCCESS) : reject(res, commit))
    },
    login ({ commit, dispatch }, requestBody) {
      commit('loading')
      return fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 200 ? res.json() : reject(res, commit))
        .catch(() => commit('loaded'))
        .then(acc => dispatch('loadData', acc))
    },
    logout ({ commit }) {
      return fetch('/api/auth/logout', {
        method: 'POST',
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? commit('logout') : reject(res, commit))
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
