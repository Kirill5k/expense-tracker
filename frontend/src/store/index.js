import Vue from 'vue'
import Vuex from 'vuex'
import Alerts from './alerts'
import Clients from './clients'

Vue.use(Vuex)

const withinDates = (txs, { start, end }) => txs.filter(tx => {
  const txdate = new Date(tx.date)
  return start <= txdate && txdate <= end
})

const totalAmount = (txs) => txs.map(t => t.amount.value).reduce((acc, i) => acc + i, 0).toFixed(2)

const handleError = (commit, { status, message }, rethrow = false) => {
  if (status === 403) {
    commit('logout')
  } else {
    commit('setAlert', { type: 'error', message })
  }
  if (rethrow) {
    return Promise.reject(new Error(message))
  }
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
    displayedTransactions: (state, getters) => withinDates(getters.filteredTransactions, state.displayDate),
    expenseTransactions: (state, getters) => getters.displayedTransactions.filter(t => t.kind === 'expense'),
    incomeTransactions: (state, getters) => getters.displayedTransactions.filter(t => t.kind === 'income'),
    totalSpent: (state, getters) => totalAmount(getters.expenseTransactions),
    totalEarned: (state, getters) => totalAmount(getters.incomeTransactions)
  },
  mutations: {
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
    getUser ({ commit, dispatch }) {
      return Clients.online.getUser()
        .then(acc => dispatch('loadData', acc))
        .catch(() => commit('loaded'))
    },
    login ({ commit, dispatch }, requestBody) {
      commit('loading')
      return Clients.online
        .login(requestBody)
        .then(acc => dispatch('loadData', acc))
        .catch(e => {
          commit('loaded')
          handleError(commit, e)
        })
    },
    createUser ({ commit }, requestBody) {
      return Clients.online.createUser(requestBody)
        .then(() => commit('setAlert', Alerts.REGISTRATION_SUCCESS))
        .catch(e => handleError(commit, e, true))
    },
    updateUserSettings ({ commit, state }, requestBody) {
      return Clients.online
        .updateUserSettings(state.user.id, requestBody)
        .then(() => commit('setSettings', requestBody))
        .catch(e => handleError(commit, e))
    },
    changeUserPassword ({ commit, state }, requestBody) {
      return Clients.online
        .changeUserPassword(state.user.id, requestBody)
        .then(() => commit('setAlert', Alerts.PASSWORD_CHANGE_SUCCESS))
        .catch(e => handleError(commit, e))
    },
    logout ({ commit }) {
      return Clients.online.logout()
        .then(() => commit('logout'))
        .catch(e => handleError(commit, e))
    },
    createCategory ({ commit, dispatch }, requestBody) {
      return Clients.online.createCategory(requestBody)
        .then(cat => commit('addCategory', cat))
        .catch(e => handleError(commit, e))
    },
    getCategories ({ commit }) {
      return Clients.online.getCategories().then(cats => commit('setCategories', cats))
    },
    hideCategory ({ commit }, { id, hidden }) {
      return Clients.online.hideCategory({ id, hidden })
        .then(() => commit('hideCategory', { id, hidden }))
    },
    updateCategory ({ commit }, requestBody) {
      return Clients.online
        .updateCategory(requestBody)
        .then(res => commit('updateCategory', res))
        .catch(e => handleError(commit, e))
    },
    getTransactions ({ commit }) {
      return Clients.online.getTransactions().then(txs => commit('setTransactions', txs))
    },
    createTransaction ({ commit, dispatch }, requestBody) {
      return Clients.online.createTransaction(requestBody).then(tx => commit('addTransaction', tx))
    },
    hideTransaction ({ commit }, { id, hidden }) {
      return Clients.online.hideTransaction({ id, hidden }).then(() => commit('hideTransaction', { id, hidden }))
    },
    updateTransaction ({ commit }, requestBody) {
      return Clients.online.updateTransaction(requestBody).then(() => commit('updateTransaction', requestBody))
    }
  },
  modules: {
  }
})
