import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const reject = (res) => res.json().then(e => Promise.reject(new Error(e.message)))

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
    transactions: []
  },
  getters: {
    incomeCats: state => state.categories.filter(c => c.kind === 'income'),
    expenseCats: state => state.categories.filter(c => c.kind === 'expense'),
    catsByIds: state => state.categories.reduce((acc, el) => {
      acc[el.id] = el
      return acc
    }, {})
  },
  mutations: {
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
      state.transactions = txs
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
        .then(res => res.status === 201 ? res.json() : reject(res))
    },
    getAccount ({ commit, dispatch }) {
      return fetch('/api/auth/account', defaultRequestParams)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => dispatch('loadData', acc))
    },
    login ({ commit, dispatch }, requestBody) {
      return fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => dispatch('loadData', acc))
    },
    logout ({ commit }) {
      return fetch('/api/auth/logout', {
        method: 'POST',
        ...defaultRequestParams
      })
        .then(res => res.status === 204 ? {} : reject(res))
        .then(acc => {
          commit('setAccount', {})
          commit('unAuthenticate')
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
      //  return fetch('/api/categories', defaultRequestParams)
      //    .then(res => res.status === 200 ? res.json() : reject(res))
      //    .then(txs => commit('setTransaction', txs))
      setTimeout(() => {
        const txs = [
          { id: '1', kind: 'expense', categoryId: '60d83bad919b494d3b17a379', amount: { value: 5.99, currency: 'GBP' }, note: 'test transaction', date: '2021-06-30' },
          { id: '2', kind: 'expense', categoryId: '60d83bad919b494d3b17a379', amount: { value: 0.99, currency: 'GBP' }, note: null, date: '2021-06-29' },
          { id: '3', kind: 'expense', categoryId: '60d83bad919b494d3b17a379', amount: { value: 12.30, currency: 'GBP' }, note: null, date: '2021-06-28' },
          { id: '4', kind: 'income', categoryId: '60d83c2f919b494d3b17a37b', amount: { value: 100.0, currency: 'GBP' }, note: null, date: '2021-06-27' }
        ]
        commit('setTransactions', txs)
      }, 0)
    }
  },
  modules: {
  }
})
