import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const reject = (res) => res.json().then(e => Promise.reject(new Error(e.message)))

export default new Vuex.Store({
  state: {
    isAuthenticated: false,
    isLoading: false,
    account: null
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
          commit('setAccount', acc)
          commit('authenticate')
        })
        .catch(() => commit('unAuthenticate'))
    },
    login ({ commit, dispatch }, requestBody) {
      return fetch('/api/auth/login', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
        .then(res => res.status === 200 ? res.json() : reject(res))
        .then(acc => {
          commit('setAccount', acc)
          commit('authenticate')
        })
        .catch(() => {})
    }
  },
  modules: {
  }
})
