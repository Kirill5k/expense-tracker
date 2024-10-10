import {create} from 'zustand'
import Clients from './clients'
import Alerts from './alerts'
import {insertSorted} from '@/utils/arrays'
import {withUpdatedCategory, withinDates, sorts} from '@/utils/transactions'
import {addDays, format, startOfMonth, endOfMonth} from 'date-fns'

const defaultDisplayDate = () => {
  const now = new Date()
  return {range: 'monthly', start: startOfMonth(now), end: endOfMonth(now), text: format(now, 'LLLL yyyy')}
}

const DefaultState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
  categories: [],
  displayedCategories: [],
  incomeCategories: [],
  expenseCategories: [],
  transactions: [],
  filteredTransactions: [],
  displayedTransactions: [],
  displayDate: defaultDisplayDate(),
  isLoading: false
}

const handleError = (get, err, rethrow = false, displayAlert = true) => {
  console.log('error', err)

  if (err.status === 403) {
    get().clearUser()
  } else if (displayAlert) {
    get().setErrorAlert(err.message)
  }
  if (rethrow) {
    return Promise.reject(new Error(err.message))
  }
}

const filtered = (txs, user) => {
  const maxTxDate = addDays(new Date(), user?.settings?.futureTransactionVisibilityDays || 0)
  return txs
      .filter(t => {
        return (t?.hidden !== true) &&
            (t?.category?.hidden !== true) &&
            (t?.amount?.currency?.code === user?.settings?.currency?.code) &&
            (user.settings?.futureTransactionVisibilityDays === null || new Date(t.date) <= maxTxDate)
      })
}

const useStore = create((set, get) => ({
  ...DefaultState,
  isOnline: true,
  alert: null,
  mode: 'light',
  setMode: (mode) => set({mode}),
  setLoading: (isLoading) => set({isLoading}),
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
    const categories = get().categories.filter(c => c.id !== category.id)
    get().setCategories(insertSorted(categories, category, c => c.name))
    const transactions = get().transactions.map(t => t.category.id === category.id ? ({...t, category}) : t)
    get().setTransactions(transactions, false)
  },
  setHiddenForCategory: (id, hidden) => {
    const cats = get().categories.map(c => c.id === id ? {...c, hidden} : c)
    get().setCategories(cats)
    const transactions = get().transactions.map(t => t.category.id === id ? withUpdatedCategory(t, {hidden}) : t)
    get().setTransactions(transactions, false)
  },
  setDisplayDate: (displayDate) => {
    const displayedTransactions = withinDates(get().filteredTransactions, displayDate)
    set({displayDate, displayedTransactions})
  },
  setTransactions: (transactions, withSorting = true) => {
    let filteredTransactions = filtered(transactions, get().user)
    if (withSorting) {
      filteredTransactions = filteredTransactions.sort(sorts.byDate(true))
    }
    const displayedTransactions = withinDates(filteredTransactions, get().displayDate)
    set({transactions, filteredTransactions, displayedTransactions})
  },
  reloadTransactions: () => {
    if (get().transactions.length > 0) {
      get().setTransactions(get().transactions)
    }
  },
  addUpdatedTransaction: (updatedTx) => {
    const transactions = get().transactions.filter(tx => tx.id !== updatedTx.id)
    const sortedTxs = insertSorted(transactions, updatedTx, tx => tx.date, false)
    get().setTransactions(sortedTxs, false)
  },
  addCreatedTransaction: (newTx) => {
    const transactions = insertSorted(get().transactions, newTx, tx => tx.date, false)
    get().setTransactions(transactions, false)
  },
  setHiddenForTransaction: (id, hidden) => {
    const txs = get().transactions.map(t => t.id === id ? ({...t, hidden}) : t)
    get().setTransactions(txs, false)
  },
  setErrorAlert: (message) => set({alert: {type: 'error', title: 'Error!', message}}),
  setUndoAlert: (message, undoAction) => set({alert: {type: 'info', message, undoAction}}),
  clearAlert: () => set({alert: null}),
  clearUser: () => set({...DefaultState, displayDate: defaultDisplayDate()}),
  login: (creds, showAlert = true) => {
    get().clearAlert()
    return Clients.get(get().isOnline)
        .login(creds)
        .then(({access_token}) => {
          set({accessToken: access_token, isAuthenticated: true})
          if (showAlert) {
            set({alert: Alerts.LOGIN_SUCCESS})
          }
        })
  },
  createAccount: (acc) => {
    return Clients.get(get().isOnline)
        .createUser(acc)
        .then(() => {
          set({alert: Alerts.REGISTRATION_SUCCESS})
          return get().login({email: acc.email, password: acc.password}, false)
        })
        .catch(e => handleError(get, e, e.status === 409, e.status !== 409))
  },
  logout: () => {
    return Clients.get(get().isOnline)
        .logout(get().accessToken)
        .then(() => get().clearUser())
        .catch(err => handleError(get, err))
  },
  getUser: () => {
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
      .catch(err => handleError(get, err)),
  updateUserSettings: (settings) => Clients
      .get(get().isOnline)
      .updateUserSettings(get().accessToken, get().user.id, settings)
      .then(() => set({user: {...(get().user), settings}}))
      .catch(err => handleError(get, err)),
  changeUserPassword: ({currentPassword, newPassword}) => Clients
      .get(get().isOnline)
      .changeUserPassword(get().accessToken, get().user.id, {currentPassword, newPassword})
      .then(() => get().login({email: get().user.email, password: newPassword}, false))
      .then(() => set({alert: Alerts.PASSWORD_CHANGE_SUCCESS}))
      .catch(e => handleError(get, e, e.status === 401, e.status !== 401))
}));

export default useStore;