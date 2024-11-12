const apiUrl = process.env.EXPO_PUBLIC_API_URL

const DEFAULT_REQUEST_PARAMS = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include'
}

const dispatchReq = (path, request, params = {}) => {
  let fullUrl = `${apiUrl}/${path}`
  const args = Object.entries(params).map(([k, v]) => v ? `${k}=${v}` : '').join('&')
  if (args) {
    fullUrl += `?${args}`
  }
  return fetch(fullUrl, request)
}

const simpleRequest = (token) => {
  const headers = {'Content-Type': 'application/json'}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return {headers, ...DEFAULT_REQUEST_PARAMS}
}
const requestWithBody = (reqBody, method, token) => ({...simpleRequest(token), method, body: JSON.stringify(reqBody)})

const errorWithStatus = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

export const reject = async res => {
  const text = await res.text()
  console.log(`${res.status} error sending request to ${res.url}: ${text}`)
  try {
    const e = JSON.parse(text)
    return Promise.reject(errorWithStatus(e.message, res.status))
  } catch (err) {
    return Promise.reject(errorWithStatus('Server not available. Try again later', res.status))
  }
}

class BackendClient {
  createUser = (requestBody) =>
      dispatchReq('api/auth/user', requestWithBody(requestBody, 'POST'))
          .then(res => res.status === 201 ? {} : reject(res))

  changeUserPassword = (token, userId, requestBody) =>
      dispatchReq(`api/auth/user/${userId}/password`, requestWithBody(requestBody, 'POST', token))
          .then(res => res.status === 204 ? {} : reject(res))

  logout = (token) =>
      dispatchReq('api/auth/logout', requestWithBody({}, 'POST', token))
          .then(res => res.status === 204 ? {} : reject(res))

  login = (requestBody) =>
      dispatchReq('api/auth/login', requestWithBody(requestBody, 'POST'))
          .then(res => res.status === 200 ? res.json() : reject(res))

  pullChanges = (token, lastPulledAt) => {
    return dispatchReq('api/sync/watermelon', simpleRequest(token), {lastPulledAt})
        .then(res => res.status === 200 ? res.json() : reject(res))
  }

  pushChanges = (token, lastPulledAt, changes) => {
    return dispatchReq('api/sync/watermelon', requestWithBody(changes, 'POST', token), {lastPulledAt})
        .then(res => res.status === 204 ? {} : reject(res))
  }
}

export default new BackendClient()