import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const reject = (res) => res.json().then(e => Promise.reject(new Error(e.message)))

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
      state.categories = [category, ...state.categories]
    }
  },
  actions: {
    getAccount ({ commit }) {
      return fetch('/api/auth/account')
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => {
          commit('loaded')
          commit('authenticate')
          commit('setAccount', acc)
        })
        .catch(() => {
          commit('loaded')
          commit('unAuthenticate')
        })
    },
    createAccount ({ commit }, requestBody) {
      return fetch('/api/auth/account', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
        .then(res => res.status === 201 ? res.json() : reject(res))
    },
    login ({ commit }, requestBody) {
      return fetch('/api/auth/login', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => {
          console.log(acc)
          commit('setAccount', acc)
          commit('authenticate')
        })
    },
    createCategory ({ commit, dispatch }, requestBody) {
      return fetch('/api/categories', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
      return fetch(`/api/categories/${id}`)
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(cat => commit('addCategory', cat))
    }
  },
  modules: {
  }
})
