// Endpoint auth: register, login, verifikasi email, lupa/reset password.
import { request } from '../../shared/lib/apiClient'

export const authApi = {
  register: (payload) =>
    request('/register', { method: 'POST', body: payload }),

  login: (email, password) =>
    request('/login', { method: 'POST', body: { email, password } }),

  me: (token) => request('/me', { token }),

  verifyEmail: (token) =>
    request('/verify-email', { method: 'POST', body: { token } }),

  resendVerification: (email) =>
    request('/resend-verification', { method: 'POST', body: { email } }),

  forgotPassword: (email) =>
    request('/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token, newPassword) =>
    request('/reset-password', { method: 'POST', body: { token, new_password: newPassword } }),
}
