
const DEFAULT_REQUEST_PARAMS = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}

const requestWithBody = (reqBody, method) => ({ ...DEFAULT_REQUEST_PARAMS, method, body: JSON.stringify(reqBody) })

// eslint-disable-next-line
const notConnectedToTheInternet = () => Promise.reject({
  message: 'Unable to complete the action - no internet connection',
  status: 500
})

const reject = (res) => res.json().then(e => {
  // eslint-disable-next-line
  return Promise.reject({ message: e.message, status: res.status })
})

class StubClient {
  getUser = () => notConnectedToTheInternet()
  login = () => notConnectedToTheInternet()
  createUser = () => notConnectedToTheInternet()
  updateUserSettings = () => notConnectedToTheInternet()
  changeUserPassword = () => notConnectedToTheInternet()
  logout = () => notConnectedToTheInternet()
  getCategories = () => notConnectedToTheInternet()
  createCategory = () => notConnectedToTheInternet()
  getCategory = () => notConnectedToTheInternet()
  hideCategory = () => notConnectedToTheInternet()
  updateCategory = () => notConnectedToTheInternet()
  getTransactions = () => notConnectedToTheInternet()
  createTransaction = () => notConnectedToTheInternet()
  getTransaction = () => notConnectedToTheInternet()
  hideTransaction = () => notConnectedToTheInternet()
  updateTransaction = () => notConnectedToTheInternet()
}

class BackendClient {
  getUser = () => fetch('/api/auth/user', DEFAULT_REQUEST_PARAMS)
    .then(res => res.status === 200 ? res.json() : reject(res))

  login = (requestBody) => fetch('/api/auth/login', requestWithBody(requestBody, 'POST'))
    .then(res => res.status === 200 ? res.json() : reject(res))

  createUser = (requestBody) => fetch('/api/auth/user', requestWithBody(requestBody, 'POST'))
    .then(res => res.status === 201 ? {} : reject(res))

  updateUserSettings = (userId, requestBody) => fetch(`/api/auth/user/${userId}/settings`, requestWithBody(requestBody, 'PUT'))
    .then(res => res.status === 204 ? requestBody : reject(res))

  changeUserPassword = (userId, requestBody) => fetch(`/api/auth/user/${userId}/password`, requestWithBody(requestBody, 'POST'))
    .then(res => res.status === 204 ? {} : reject(res))

  logout = () => fetch('/api/auth/logout', requestWithBody({}, 'POST'))
    .then(res => res.status === 204 ? {} : reject(res))

  getCategories = () => fetch('/api/categories', DEFAULT_REQUEST_PARAMS)
    .then(res => res.status === 200 ? res.json() : reject(res))

  createCategory = (requestBody) => fetch('/api/categories', requestWithBody(requestBody, 'POST'))
    .then(res => res.status === 201 ? res.json() : reject(res))
    .then(res => this.getCategory(res.id))

  getCategory = (id) => fetch(`/api/categories/${id}`, DEFAULT_REQUEST_PARAMS)
    .then(res => res.status === 200 ? res.json() : reject(res))

  hideCategory = ({ id, hidden }) => fetch(`/api/categories/${id}/hidden`, requestWithBody({ hidden }, 'PUT'))
    .then(res => res.status === 204 ? {} : reject(res))

  updateCategory = (requestBody) => fetch(`/api/categories/${requestBody.id}`, requestWithBody(requestBody, 'PUT'))
    .then(res => res.status === 204 ? requestBody : reject(res))

  getTransactions = () => fetch('/api/transactions', DEFAULT_REQUEST_PARAMS)
    .then(res => res.status === 200 ? res.json() : reject(res))

  createTransaction = (requestBody) => fetch('/api/transactions', requestWithBody(requestBody, 'POST'))
    .then(res => res.status === 201 ? res.json() : reject(res))
    .then(res => this.getTransaction(res.id))

  getTransaction = (id) => fetch(`/api/transactions/${id}`, DEFAULT_REQUEST_PARAMS)
    .then(res => res.status === 200 ? res.json() : reject(res))

  hideTransaction = ({ id, hidden }) => fetch(`/api/transactions/${id}/hidden`, requestWithBody({ hidden }, 'PUT'))
    .then(res => res.status === 204 ? {} : reject(res))

  updateTransaction = (requestBody) => fetch(`/api/transactions/${requestBody.id}`, requestWithBody(requestBody, 'PUT'))
    .then(res => res.status === 204 ? requestBody : reject(res))
}

const onlineClient = new BackendClient()
const stubClient = new StubClient()
const clients = { get: isOnline => isOnline ? onlineClient : stubClient }

export default clients
