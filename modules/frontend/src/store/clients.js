const DEFAULT_REQUEST_PARAMS = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include'
}

const simpleRequest = (token) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return { headers, ...DEFAULT_REQUEST_PARAMS }
}
const requestWithBody = (reqBody, method, token) => ({ ...simpleRequest(token), method, body: JSON.stringify(reqBody) })

const errorWithStatus = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

const notConnectedToTheInternet = () =>
  Promise.reject(errorWithStatus('Unable to complete the action - no internet connection', 500))

export const reject = async res => {
  const text = await res.text()
  try {
    const e = JSON.parse(text)
    return Promise.reject(errorWithStatus(e.message, res.status))
  } catch (err) {
    return Promise.reject(errorWithStatus('Server not available. Try again later', res.status))
  }
}

class StubClient {
  getUser = () => notConnectedToTheInternet()
  login = () => notConnectedToTheInternet()
  createUser = () => notConnectedToTheInternet()
  updateUserSettings = () => notConnectedToTheInternet()
  changeUserPassword = () => notConnectedToTheInternet()
  logout = () => notConnectedToTheInternet()
  createCategory = () => notConnectedToTheInternet()
  hideCategory = () => notConnectedToTheInternet()
  updateCategory = () => notConnectedToTheInternet()
  getTransactions = () => notConnectedToTheInternet()
  createTransaction = () => notConnectedToTheInternet()
  hideTransaction = () => notConnectedToTheInternet()
  updateTransaction = () => notConnectedToTheInternet()
}

class BackendClient {
  getUser = (token) =>
    fetch('/api/auth/user?expanded=true', simpleRequest(token))
      .then(res => res.status === 200 ? res.json() : reject(res))

  login = (requestBody) =>
    fetch('/api/auth/login', requestWithBody(requestBody, 'POST'))
      .then(res => res.status === 200 ? res.json() : reject(res))

  createUser = (requestBody) =>
    fetch('/api/auth/user', requestWithBody(requestBody, 'POST'))
      .then(res => res.status === 201 ? {} : reject(res))

  updateUserSettings = (token, userId, requestBody) =>
    fetch(`/api/auth/user/${userId}/settings`, requestWithBody(requestBody, 'PUT', token))
      .then(res => res.status === 204 ? requestBody : reject(res))

  changeUserPassword = (token, userId, requestBody) =>
    fetch(`/api/auth/user/${userId}/password`, requestWithBody(requestBody, 'POST', token))
      .then(res => res.status === 204 ? {} : reject(res))

  logout = (token) =>
    fetch('/api/auth/logout', requestWithBody({}, 'POST', token))
      .then(res => res.status === 204 ? {} : reject(res))

  createCategory = (token, requestBody) =>
    fetch('/api/categories', requestWithBody(requestBody, 'POST', token))
      .then(res => res.status === 201 ? res.json() : reject(res))

  hideCategory = (token, { id, hidden }) =>
    fetch(`/api/categories/${id}/hidden`, requestWithBody({ hidden }, 'PUT', token))
      .then(res => res.status === 204 ? {} : reject(res))

  updateCategory = (token, requestBody) =>
    fetch(`/api/categories/${requestBody.id}`, requestWithBody(requestBody, 'PUT', token))
      .then(res => res.status === 204 ? requestBody : reject(res))

  getTransactions = (token, from, to) =>
    fetch(`/api/transactions?expanded=true${from && to ? `&from=${from.toISOString()}&to=${to.toISOString()}` : ''}`, simpleRequest(token))
      .then(res => res.status === 200 ? res.json() : reject(res))

  createTransaction = (token, requestBody) =>
    fetch('/api/transactions', requestWithBody(requestBody, 'POST', token))
      .then(res => res.status === 201 ? res.json() : reject(res))

  hideTransaction = (token, { id, hidden }) =>
    fetch(`/api/transactions/${id}/hidden`, requestWithBody({ hidden }, 'PUT', token))
      .then(res => res.status === 204 ? {} : reject(res))

  updateTransaction = (token, requestBody) =>
    fetch(`/api/transactions/${requestBody.id}`, requestWithBody(requestBody, 'PUT', token))
      .then(res => res.status === 204 ? requestBody : reject(res))
}

const onlineClient = new BackendClient()
const stubClient = new StubClient()
const clients = {
  get: isOnline => isOnline ? onlineClient : stubClient
}

export default clients
