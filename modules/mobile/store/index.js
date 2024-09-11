import { create } from 'zustand'
import Clients from './clients'

const useStore = create((set, get) => ({
  alert: {
    type: 'error',
    message: null,
    show: false
  },
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  accessToken: null,
  user: {},
  clearAlert: () => set({
    type: 'error',
    message: null,
    show: false
  }),
  clearUser: () => set({
    isAuthenticated: false,
    accessToken: null,
    user: {},
    isLoading: false
  }),
  getUser: () => {
    set({isLoading: true})
    return Clients
        .get(get().isOnline)
        .getUser(get().accessToken)
        .then(user => {
          if (!get().user?.id || get().user?.id === user.id) {
            set({user, categories: user.categories})
            // TODO: get transactions
          } else {
            get().clearUser()
            // TODO: display alerts
          }
        })
        .catch(() => get().clearUser())
        .then(() => set({isLoading: false}))
  }
}));

export default useStore;