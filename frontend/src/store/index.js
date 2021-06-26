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
    categories: []
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
    }
  },
  actions: {
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
        .then(acc => {
          commit('authenticate')
          commit('setAccount', acc)
        })
        .then(() => dispatch('getCategories'))
        .catch(() => {
          commit('unAuthenticate')
        })
        .then(() => commit('loaded'))
    },
    login ({ commit, dispatch }, requestBody) {
      return fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        ...defaultRequestParams
      })
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => {
          commit('setAccount', acc)
          commit('authenticate')
        })
        .then(() => dispatch('getCategories'))
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
      return fetch('/api/categories')
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
    }
  },
  modules: {
  }
})
