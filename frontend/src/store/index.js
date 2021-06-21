import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const reject = (res) => res.json().then(e => Promise.reject(new Error(e.message)))

export default new Vuex.Store({
  state: {
    isLoading: true,
    isAuthenticated: false,
    account: null,
    categories: [
      { id: 'c1', kind: 'expense', name: 'Shopping', icon: 'mdi-cart-outline' },
      { id: 'c1-1', kind: 'expense', name: 'Shopping', icon: 'mdi-cart-outline' },
      { id: 'c1-2', kind: 'expense', name: 'Shopping', icon: 'mdi-cart-outline' },
      { id: 'c2', kind: 'income', name: 'Salary', icon: 'mdi-piggy-bank-outline' }
    ]
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
    login ({ commit, dispatch }, requestBody) {
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
    }
  },
  modules: {
  }
})
