const ALERTS = {
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
