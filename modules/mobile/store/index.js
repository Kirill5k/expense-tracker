import {create} from 'zustand'

const Alerts = {
  LOGIN_SUCCESS: {
    type: 'success',
    title: 'Success!',
    message: 'Successfully signed in into the account! Loading transactions'
  },
  REGISTRATION_SUCCESS: {
    type: 'success',
    title: 'Success!',
    message: 'Account has been successfully created! Signing you in'
  },
  PASSWORD_CHANGE_SUCCESS: {
    type: 'success',
    title: 'Success!',
    message: 'Your password has been updated'
  },
  SESSION_EXPIRED: {
    type: 'error',
    title: 'Error!',
    message: 'Your session has expired. Please sign in again'
  }
}

const useStore = create((set, get) => ({
  alert: null,
  mode: 'system',
  accessToken: null,
  rtxToUpdate: null,
  txToUpdate: null,
  catToUpdate: null,
  setTxToUpdate: (txToUpdate) => set({txToUpdate}),
  setRtxToUpdate: (rtxToUpdate) => set({rtxToUpdate}),
  setCatToUpdate: (catToUpdate) => set({catToUpdate}),
  setAccessToken: (accessToken) => set({accessToken}),
  clearAccessToken: () => set({accessToken: null}),
  setMode: (mode) => set({mode}),
  setErrorAlert: (message) => set({alert: {type: 'error', title: 'Error!', message}}),
  setUndoAlert: (message, undoAction) => set({alert: {type: 'info', message, undoAction}}),
  clearAlert: () => set({alert: null}),
  setLoginSuccessAlert: () => set({alert: Alerts.LOGIN_SUCCESS}),
  setRegistrationSuccessAlert: () => set({alert: Alerts.REGISTRATION_SUCCESS}),
}));

export default useStore;