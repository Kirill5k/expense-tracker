
const DEFAULT_REQUEST_PARAMS = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}

const reject = (res) => res.json().then(e => {
  // eslint-disable-next-line
  return Promise.reject({ message: e.message, status: res.status })
})

class BackendClient {
  updateUserSettings (userId, requestBody) {
    return fetch(`/api/auth/user/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 204 ? requestBody : reject(res))
  }

  changeUserPassword (userId, requestBody) {
    return fetch(`/api/auth/user/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 204 ? {} : reject(res))
  }

  logout () {
    return fetch('/api/auth/logout', {
      method: 'POST',
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 204 ? {} : reject(res))
  }

  getCategories () {
    return fetch('/api/categories', DEFAULT_REQUEST_PARAMS)
      .then(res => res.status === 200 ? res.json() : reject(res))
  }

  createCategory (requestBody) {
    return fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 201 ? res.json() : reject(res))
      .then(res => this.getCategory(res.id))
  }

  getCategory (id) {
    return fetch(`/api/categories/${id}`, DEFAULT_REQUEST_PARAMS)
      .then(res => res.status === 200 ? res.json() : reject(res))
  }

  hideCategory ({ id, hidden }) {
    return fetch(`/api/categories/${id}/hidden`, {
      ...DEFAULT_REQUEST_PARAMS,
      method: 'PUT',
      body: JSON.stringify({ hidden })
    })
      .then(res => res.status === 204 ? {} : reject(res))
  }

  updateCategory (requestBody) {
    return fetch(`/api/categories/${requestBody.id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 204 ? requestBody : reject(res))
  }

  getTransactions () {
    return fetch('/api/transactions', DEFAULT_REQUEST_PARAMS)
      .then(res => res.status === 200 ? res.json() : reject(res))
  }

  createTransaction (requestBody) {
    return fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 201 ? res.json() : reject(res))
      .then(res => this.getTransaction(res.id))
  }

  getTransaction (id) {
    return fetch(`/api/transactions/${id}`, DEFAULT_REQUEST_PARAMS)
      .then(res => res.status === 200 ? res.json() : reject(res))
  }

  hideTransaction ({ id, hidden }) {
    return fetch(`/api/transactions/${id}/hidden`, {
      ...DEFAULT_REQUEST_PARAMS,
      method: 'PUT',
      body: JSON.stringify({ hidden })
    })
      .then(res => res.status === 204 ? {} : reject(res))
  }

  updateTransaction (requestBody) {
    return fetch(`/api/transactions/${requestBody.id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      ...DEFAULT_REQUEST_PARAMS
    })
      .then(res => res.status === 204 ? requestBody : reject(res))
  }
}

const clients = { online: new BackendClient() }

export default clients
