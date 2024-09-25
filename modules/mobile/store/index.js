import {create} from 'zustand'
import Clients from './clients'
import Alerts from './alerts'
import {insertSorted, sortedBy} from '@/utils/arrays'

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
  displayedCategories: [],
  incomeCategories: [],
  expenseCategories: [],
  setCategories: (categories) => {
    const displayedCategories = categories.filter(c => !c.hidden)
    const incomeCategories = displayedCategories.filter(c => c.kind === 'income')
    const expenseCategories = displayedCategories.filter(c => c.kind === 'expense')
    set({incomeCategories, expenseCategories, categories, displayedCategories})
  },
  addCreatedCategory: (newCat) => {
    const categories = insertSorted(get().categories, newCat, c => c.name)
    get().setCategories(categories)
  },
  addUpdatedCategory: (category) => {
    const categories = [...get().categories.filter(c => c.id !== category.id), category]
    get().setCategories(sortedBy(categories, c => c.name))
    const transactions = get().transactions.map(t => t.category.id === category.id ? ({...t, category}) : t)
    get().setTransactions(transactions)
  },
  setHiddenForCategory: (id, hidden) => {
    const cats = get().categories.map(c => c.id === id ? {...c, hidden} : c)
    get().setCategories(cats)
    const transactions = get().transactions.map(t => t.category.id === id ? ({...t, category: {...t.category, hidden}}) : t)
    get().setTransactions(transactions)
  },
  displayDate: null,
  setDisplayDate: (displayDate) => {
    const displayedTransactions = withinDates(get().filteredTransactions, displayDate).sort(txSorts.date(true))
    set({displayDate, displayedTransactions})
  },
  transactions: [],
  filteredTransactions: [],
  displayedTransactions: [],
  setTransactions: (transactions) => {
    const filteredTransactions = filtered(transactions, get().user)
    const displayedTransactions = withinDates(filteredTransactions, get().displayDate).sort(txSorts.date(true))
    set({transactions, filteredTransactions, displayedTransactions})
  },
  addUpdatedTransaction: (updatedTx) => {
    const transactions = get()
        .transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx)
    get().setTransactions(transactions)
  },
  addCreatedTransaction: (newTx) => {
    const transactions = [newTx, ...get().transactions]
    get().setTransactions(transactions)
  },
  setHiddenForTransaction: (id, hidden) => {
    const txs = get().transactions.map(t => t.id === id ? ({...t, hidden}) : t)
    get().setTransactions(txs)
  },
  alert: null,
  isOnline: true,
  isLoading: false,
  setLoading: (isLoading) => set({isLoading}),
  isAuthenticated: false,
  accessToken: null,
  user: {
    firstName: '',
    lastName: '',
    email: '',
    registrationDate: '',
    settings: {
      hideFutureTransactions: false,
      currency: {code: 'GBP', symbol: '£'},
      darkMode: null
    }
  },
  setErrorAlert: (message) => set({alert: {type: 'error', title: 'Error!', message}}),
  setUndoAlert: (message, undoAction) => set({alert: {type: 'info', message, undoAction}}),
  clearAlert: () => set({alert: null}),
  clearUser: () => set({
    isAuthenticated: false,
    accessToken: null,
    user: {},
  }),
  login: async (creds) => {
    get().clearAlert()
    return Clients.get(get().isOnline)
        .login(creds)
        .then(({access_token}) => {
          set({accessToken: access_token})
          set({alert: Alerts.LOGIN_SUCCESS})
        })
  },
  getUser: async () => {
    return Clients.get(get().isOnline)
        .getUser(get().accessToken)
        .then(user => {
          if (!get().user?.id || get().user?.id === user.id) {
            set({user})
            get().setCategories(user.categories)
          } else {
            return Promise.reject(new Error(Alerts.SESSION_EXPIRED.message))
          }
        })
  },
  getTransactions: () => {
    return Clients.get(get().isOnline)
        .getTransactions(get().accessToken)
        .then(txs => get().setTransactions(txs))
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
  hideTransaction: (id, hidden, undoAction) => Clients
      .get(get().isOnline)
      .hideTransaction(get().accessToken, {id, hidden})
      .then(() => {
        get().setHiddenForTransaction(id, hidden)
        if (hidden) {
          get().setUndoAlert('Transaction has been deleted', undoAction)
        }
      })
      .catch(err => handleError(get, err)),
  createCategory: (cat) => Clients
      .get(get().isOnline)
      .createCategory(get().accessToken, cat)
      .then(cat => get().addCreatedCategory(cat))
      .catch(err => handleError(get, err)),
  updateCategory: (cat) => Clients
      .get(get().isOnline)
      .updateCategory(get().accessToken, cat)
      .then(() => get().addUpdatedCategory(cat))
      .catch(err => handleError(get, err)),
  hideCategory: (id, hidden, undoAction) => Clients
      .get(get().isOnline)
      .hideCategory(get().accessToken, {id, hidden})
      .then(() => {
        get().setHiddenForCategory(id, hidden)
        if (hidden) {
          get().setUndoAlert('Category has been deleted', undoAction)
        }
      })
      .catch(err => handleError(get, err))
}));

export default useStore;