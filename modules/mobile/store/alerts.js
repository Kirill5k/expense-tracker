const ALERTS = {
  LOGIN_SUCCESS: {
    type: 'success',
    message: 'Successfully signed in into the account! Loading transactions'
  },
  REGISTRATION_SUCCESS: {
    type: 'success',
    message: 'Account has been successfully created! Redirecting to the sign in page'
  },
  PASSWORD_CHANGE_SUCCESS: {
    type: 'success',
    message: 'Your password has been updated'
  },
  SESSION_EXPIRED: {
    type: 'error',
    message: 'Your session has expired. Please sign in again'
  }
}

export default ALERTS
