import config from '@/config'

const DEFAULT_REQUEST_PARAMS = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include'
}

const dispatchReq = (path, request, params = {}) => {
  let fullUrl = `${config.apiUrl}/${path}`
  const args = Object.entries(params).map(([k, v]) => v ? `${k}=${v}` : '').join('&')
  if (args) {
    fullUrl += `?${args}`
  }
  return fetch(fullUrl, request)
}

const simpleRequest = (token) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return { headers, ...DEFAULT_REQUEST_PARAMS }
}
const requestWithBody = (reqBody, method, token) => ({ ...simpleRequest(token), method, body: JSON.stringify(reqBody) })

/* eslint-disable */
const notConnectedToTheInternet = () => Promise.reject({
  message: 'Unable to complete the action - no internet connection',
  status: 500
})

export const reject = async res => {
  const text = await res.text()
  try {
    const e = JSON.parse(text)
    return Promise.reject({ message: e.message, status: res.status })
  } catch (err) {
    return Promise.reject({ message: 'Server not available. Try again later', status: res.status })
  }
}
/* eslint-enable */

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
      dispatchReq('api/auth/user', simpleRequest(token), {expanded: true})
          .then(res => res.status === 200 ? res.json() : reject(res))

  login = (requestBody) =>
      dispatchReq('api/auth/login', requestWithBody(requestBody, 'POST'))
          .then(res => res.status === 200 ? res.json() : reject(res))

  createUser = (requestBody) =>
      dispatchReq('api/auth/user', requestWithBody(requestBody, 'POST'))
          .then(res => res.status === 201 ? {} : reject(res))

  updateUserSettings = (token, userId, requestBody) =>
      dispatchReq(`api/auth/user/${userId}/settings`, requestWithBody(requestBody, 'PUT', token))
          .then(res => res.status === 204 ? requestBody : reject(res))

  changeUserPassword = (token, userId, requestBody) =>
      dispatchReq(`api/auth/user/${userId}/password`, requestWithBody(requestBody, 'POST', token))
          .then(res => res.status === 204 ? {} : reject(res))

  logout = (token) =>
      dispatchReq('api/auth/logout', requestWithBody({}, 'POST', token))
          .then(res => res.status === 204 ? {} : reject(res))

  createCategory = (token, requestBody) =>
      dispatchReq('api/categories', requestWithBody(requestBody, 'POST', token))
          .then(res => res.status === 201 ? res.json() : reject(res))

  hideCategory = (token, { id, hidden }) =>
      dispatchReq(`api/categories/${id}/hidden`, requestWithBody({ hidden }, 'PUT', token))
          .then(res => res.status === 204 ? {} : reject(res))

  updateCategory = (token, requestBody) =>
      dispatchReq(`api/categories/${requestBody.id}`, requestWithBody(requestBody, 'PUT', token))
          .then(res => res.status === 204 ? requestBody : reject(res))

  getTransactions = (token, from, to) =>
      dispatchReq('api/transactions', simpleRequest(token), {expanded: true, from: from || '', to: to || ''})
          .then(res => res.status === 200 ? res.json() : reject(res))

  createTransaction = (token, requestBody) =>
      dispatchReq('api/transactions', requestWithBody(requestBody, 'POST', token))
          .then(res => res.status === 201 ? res.json() : reject(res))

  hideTransaction = (token, { id, hidden }) =>
      dispatchReq(`api/transactions/${id}/hidden`, requestWithBody({ hidden }, 'PUT', token))
          .then(res => res.status === 204 ? {} : reject(res))

  updateTransaction = (token, requestBody) =>
      dispatchReq(`api/transactions/${requestBody.id}`, requestWithBody(requestBody, 'PUT', token))
          .then(res => res.status === 204 ? requestBody : reject(res))
}

const onlineClient = new BackendClient()
const stubClient = new StubClient()
const clients = {
  get: isOnline => isOnline ? onlineClient : stubClient
}

export default clients