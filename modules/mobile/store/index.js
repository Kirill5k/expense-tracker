import {create} from 'zustand'
import Clients from './clients'
import Alerts from './alerts'

const handleError = (get, err, rethrow = false) => {
  console.log('error', err)
  if (err.status === 403) {
    get().clearUser()
  } else {
    get().setErrorAlert(err.message)
  }
  if (rethrow) {
    return Promise.reject(new Error(err.message))
  }
}

const txSorts = {
  date: (desc) => (a, b) => desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  amount: (desc) => (a, b) => desc ? a.amount.value - b.amount.value : b.amount.value - a.amount.value
}

const filtered = (txs, user) => {
  const now = new Date()
  return txs
      .filter(t => t?.hidden !== true)
      .filter(t => t?.category?.hidden !== true)
      .filter(t => t?.amount?.currency?.code === user.settings?.currency?.code)
      .filter(t => user.settings?.hideFutureTransactions ? new Date(t.date) <= now : true)
}

const withinDates = (txs, dd) => !dd ? txs : txs.filter(tx => {
  const txDate = new Date(tx.date)
  return dd.start <= txDate && txDate <= dd.end
})

const useStore = create((set, get) => ({
  mode: 'light',
  categories: [],
  incomeCategories: [],
  expenseCategories: [],
  setCategories: (categories) => {
    const incomeCategories = categories.filter(c => c.kind === 'income')
    const expenseCategories = categories.filter(c => c.kind === 'expense')
    set({incomeCategories, expenseCategories, categories})
  },
  transactions: [],
  filteredTransactions: [],
  displayedTransactions: [],
  setTransactions: (transactions) => {
    const filteredTransactions = filtered(transactions, get().user)
    const displayedTransactions = withinDates(filteredTransactions, get().displayDate)
    set({transactions, filteredTransactions, displayedTransactions})
  },
  addUpdatedTransaction: (updatedTx) => {
    const transactions = get()
        .transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx)
        .sort(txSorts.date(true))
    get().setTransactions(transactions)
  },
  addCreatedTransaction: (newTx) => {
    const transactions = [newTx, ...get().transactions].sort(txSorts.date(true))
    get().setTransactions(transactions)
  },
  alert: null,
  isOnline: true,
  isLoading: false,
  isAuthenticated: false,
  accessToken: null,
  user: {
    settings: {
      hideFutureTransactions: false,
      currency: {code: 'GBP', symbol: '£'},
      darkMode: null
    }
  },
  displayDate: null,
  setDisplayDate: (displayDate) => {
    const displayedTransactions = withinDates(get().filteredTransactions, displayDate)
    set({displayDate, displayedTransactions})
  },
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
        set({user})
        get().setCategories(user.categories)
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
  },
  updateTransaction: (tx) => Clients
      .get(get().isOnline)
      .updateTransaction(get().accessToken, tx)
      .then(() => get().addUpdatedTransaction(tx))
      .catch(err => handleError(get, err)),
  createTransaction: (tx) => Clients
      .get(get().isOnline)
      .createTransaction(get().accessToken, tx)
      .then(tx => get().addCreatedTransaction(tx))
      .catch(err => handleError(get, err)),
}));

export default useStore;