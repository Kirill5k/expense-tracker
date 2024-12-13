import axios from 'axios'
import axiosRetry from 'axios-retry'

const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000,
  headers: {'Content-Type': 'application/json'}
})

axiosRetry(instance, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000
  },
  retryCondition: (error) => {
    console.log('Error sending request', error)
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error)
  },
  onMaxRetryTimesExceeded: (error) => {
    throw error
  }
})

const dispatch = (config) =>
    instance(config).then(r => r.data).catch(err => {
      const req = err.request
      if (err.response) {
        const res = err.response
        console.log(`${res.status} error sending request to ${req?._url}: ${JSON.stringify(res.data)}`)
        const message = res?.data?.message || 'Server not available. Try again later'
        return Promise.reject(errorWithStatus(message, res.status))
      } else {
        console.log(`Failed to send http request to ${req?._url}: ${err?.message}\n${err}`)
        return Promise.reject(errorWithStatus('Failed to complete the request. Try again later', 500))
      }
    })

const errorWithStatus = (message, status) => {
  const error = new Error(message)
  error.status = status
  return error
}

class BackendClient {
  createUser = (data) =>
      dispatch({
        method: 'post',
        url: '/api/auth/user',
        data
      })

  changeUserPassword = (token, userId, data) =>
      dispatch({
        method: 'post',
        url: `/api/auth/user/${userId}/password`,
        data,
        headers: {Authorization: `Bearer ${token}`}
      })

  deleteUser = (token) =>
      dispatch({
        method: 'delete',
        url: '/api/auth/user',
        headers: {Authorization: `Bearer ${token}`}
      })

  deleteUserData = (token) =>
      dispatch({
        method: 'delete',
        url: '/api/auth/user/data',
        headers: {Authorization: `Bearer ${token}`}
      })

  logout = (token) =>
      dispatch({
        method: 'post',
        url: `/api/auth/logout`,
        headers: {Authorization: `Bearer ${token}`}
      })

  login = (data) =>
      dispatch({
        method: 'post',
        url: `/api/auth/login`,
        data
      })

  pullChanges = (token, lastPulledAt) =>
      dispatch({
        method: 'get',
        url: '/api/sync/watermelon',
        headers: {Authorization: `Bearer ${token}`},
        params: {lastPulledAt}
      })

  pushChanges = (token, lastPulledAt, data) => {
    console.log(`pushing sync changes: ${JSON.stringify(data)}`)
    return dispatch({
      method: 'post',
      data,
      url: '/api/sync/watermelon',
      headers: {Authorization: `Bearer ${token}`},
      params: {lastPulledAt}
    })
  }
}

export default new BackendClient()