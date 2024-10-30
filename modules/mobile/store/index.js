import {create} from 'zustand'
import Alerts from './alerts'

const useStore = create((set, get) => ({
  alert: null,
  mode: 'system',
  accessToken: null,
  txToUpdate: null,
  catToUpdate: null,
  setTxToUpdate: (txToUpdate) => set({txToUpdate}),
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