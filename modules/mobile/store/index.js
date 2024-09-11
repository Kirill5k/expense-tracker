import {create} from 'zustand'
import Clients from './clients'
import Alerts from './alerts'

const handleError = (get, { status, message }, rethrow = false) => {
  if (status === 403) {
    get().clearUser()
  } else {
    get().setErrorAlert(message)
  }
  if (rethrow) {
    return Promise.reject(new Error(message))
  }
}

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
      get().clearUser()
      get().setErrorAlert(e.message)
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
    } catch (err) {
      return handleError(get, err, true)
    } finally {
      set({isLoading: false})
    }
  }
}));

export default useStore;