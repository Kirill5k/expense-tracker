import { create } from 'zustand'
import Clients from './clients'

const useStore = create((set, get) => ({
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  accessToken: null,
  user: {},
  resetUser: () => set({
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
            get().resetUser()
            // TODO: display alerts
          }
        })
        .catch(() => get().resetUser())
        .then(() => set({isLoading: false}))
  }
}));

export default useStore;