import {create} from 'zustand'
import Clients from './clients'
import Alerts from './alerts'

const useStore = create((set, get) => ({
  alert: null,
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  accessToken: null,
  user: {},
  setErrorAlert: (message) => set({alert: {type: 'error', message}}),
  clearAlert: () => set({alert: null}),
  clearUser: () => set({
    isAuthenticated: false,
    accessToken: null,
    user: {},
    isLoading: false
  }),
  getUser: async () => {
    try {
      set({isLoading: true})
      const user = await Clients.get(get().isOnline).getUser(get().accessToken)
      if (!get().user?.id || get().user?.id === user.id) {
        set({user, categories: user.categories})
        // TODO: get transactions
      } else {
        get().clearUser()
        set({alert: Alerts.SESSION_EXPIRED})
      }
    } catch (e) {
      if (!e.status) {
        get().setErrorAlert(e.message)
      }
      // TODO: Maybe clear user
    } finally {
      set({isLoading: false})
    }
  },
  login: async (creds) => {
    try {
      get().clearAlert()
      set({isLoading: true})
      const {access_token} = await Clients.get(get().isOnline).login(creds)
      set({accessToken: access_token})
      set({alert: Alerts.LOGIN_SUCCESS})
    } catch (err) {
      if (err.status === 401) {
        return Promise.reject(new Error(err.message))
      } else {
        get().setErrorAlert(err.message)
      }
    } finally {
      set({isLoading: false})
    }
  }
}));

export default useStore;