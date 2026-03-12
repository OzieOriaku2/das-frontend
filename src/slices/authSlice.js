import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: JSON.parse(localStorage.getItem('das_user') || 'null'),
  token: localStorage.getItem('das_token') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('das_user', JSON.stringify(action.payload.user))
      localStorage.setItem('das_token', action.payload.token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem('das_user')
      localStorage.removeItem('das_token')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => !!state.auth.token

export default authSlice.reducer
