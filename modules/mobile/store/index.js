import { create } from 'zustand'
import Clients from './clients'
import Alerts from './alerts'

const useStore = create((set, get) => ({
  alert: null,
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  accessToken: null,
  user: {},
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
      set({alert: { type: 'error', message: e.message}})
    } finally {
      set({isLoading: false})
    }
  },
  login: (creds) => Clients.get(get().isOnline)
      .login(creds)
      .then(({access_token}) => set({accessToken: access_token}))
      .catch(({status, message}) => {
        if (status === 403) {
          get().clearUser()
        } else {
          set({alert: {type: 'error', message}})
        }
      })
}));

export default useStore;