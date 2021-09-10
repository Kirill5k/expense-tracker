import Vue from 'vue'
import Vuex from 'vuex'
import Alerts from './alerts'
import Clients from './clients'
import vuexLocal from '@/plugins/vuexpersist'

Vue.use(Vuex)

const txSorts = {
  date: (desc) => (a, b) => desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  amount: (desc) => (a, b) => desc ? a.amount.value - b.amount.value : b.amount.value - a.amount.value
}

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
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  user: {},
  categories: [],
  transactions: [],
  displayDate: {},
  alert: {
    type: 'error',
    message: null,
    show: false
  },
  filterBy: [],
  sortBy: {
    field: 'date',
    desc: true,
    index: 0
  }
}

export default new Vuex.Store({
  plugins: [vuexLocal.plugin],
  state: {
    ...DEFAULT_STATE
  },
  getters: {
    transactionsByCatsCount: state => state.transactions
      .filter(t => t.hidden !== true)
      .reduce((acc, tx) => {
        if (!acc[tx.categoryId]) {
          acc[tx.categoryId] = 0
        }
        acc[tx.categoryId] = acc[tx.categoryId] + 1
        return acc
      }, {}),
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
    setOnline (state, isOnline) {
      state.isOnline = isOnline
    },
    sort (state, { field, desc, index }) {
      state.transactions = state.transactions.sort(txSorts[field](desc))
      state.sortBy = { field, desc, index }
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
      console.log(state.sortBy.field, state.sortBy.desc)
      state.transactions = [...state.transactions, tx].sort(txSorts[state.sortBy.field](state.sortBy.desc))
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
    getUser ({ state, commit, dispatch }) {
      return Clients.get(state.isOnline)
        .getUser()
        .then(acc => {
          if (!state.user.id || acc.id === state.user.id) {
            return dispatch('loadData', acc)
          } else {
            commit('logout')
            commit('setAlert', Alerts.SESSION_EXPIRED)
          }
        })
        .catch(e => {
          commit('loaded')
          return handleError(commit, e, true)
        })
    },
    login ({ state, commit, dispatch }, requestBody) {
      commit('loading')
      return Clients.get(state.isOnline)
        .login(requestBody)
        .then(acc => dispatch('loadData', acc))
        .catch(e => {
          commit('loaded')
          return handleError(commit, e, true)
        })
    },
    createUser ({ state, commit }, requestBody) {
      return Clients.get(state.isOnline)
        .createUser(requestBody)
        .then(() => commit('setAlert', Alerts.REGISTRATION_SUCCESS))
        .catch(e => handleError(commit, e, true))
    },
    updateUserSettings ({ commit, state }, requestBody) {
      return Clients.get(state.isOnline)
        .updateUserSettings(state.user.id, requestBody)
        .then(() => commit('setSettings', requestBody))
        .catch(e => handleError(commit, e))
    },
    changeUserPassword ({ commit, state }, requestBody) {
      return Clients.get(state.isOnline)
        .changeUserPassword(state.user.id, requestBody)
        .then(() => commit('setAlert', Alerts.PASSWORD_CHANGE_SUCCESS))
        .catch(e => handleError(commit, e))
    },
    logout ({ state, commit }) {
      return Clients.get(state.isOnline)
        .logout()
        .then(() => commit('logout'))
        .catch(e => handleError(commit, e))
    },
    createCategory ({ state, commit, dispatch }, requestBody) {
      return Clients.get(state.isOnline)
        .createCategory(requestBody)
        .then(cat => commit('addCategory', cat))
        .catch(e => handleError(commit, e))
    },
    getCategories ({ state, commit }) {
      return Clients.get(state.isOnline)
        .getCategories()
        .then(cats => commit('setCategories', cats))
    },
    hideCategory ({ state, commit }, { id, hidden }) {
      return Clients.get(state.isOnline)
        .hideCategory({ id, hidden })
        .then(() => commit('hideCategory', { id, hidden }))
        .catch(e => handleError(commit, e, true))
    },
    updateCategory ({ state, commit }, requestBody) {
      return Clients.get(state.isOnline)
        .updateCategory(requestBody)
        .then(res => commit('updateCategory', res))
        .catch(e => handleError(commit, e))
    },
    getTransactions ({ state, commit }) {
      return Clients.get(state.isOnline)
        .getTransactions()
        .then(txs => commit('setTransactions', txs))
    },
    createTransaction ({ state, commit, dispatch }, requestBody) {
      return Clients.get(state.isOnline)
        .createTransaction(requestBody)
        .then(tx => commit('addTransaction', tx))
        .catch(e => handleError(commit, e))
    },
    hideTransaction ({ state, commit }, { id, hidden }) {
      return Clients.get(state.isOnline)
        .hideTransaction({ id, hidden })
        .then(() => commit('hideTransaction', { id, hidden }))
        .catch(e => handleError(commit, e, true))
    },
    updateTransaction ({ state, commit }, requestBody) {
      return Clients.get(state.isOnline)
        .updateTransaction(requestBody)
        .then(() => commit('updateTransaction', requestBody))
        .catch(e => handleError(commit, e))
    }
  },
  modules: {
  }
})
