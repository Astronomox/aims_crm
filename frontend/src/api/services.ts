import api from './client'

// Auth
export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password }).then(r => r.data)

export const register = (payload: object) =>
  api.post('/api/auth/register', payload).then(r => r.data)

export const getMe = () => api.get('/api/auth/me').then(r => r.data)

// Contacts
export const getContacts = (params?: object) =>
  api.get('/api/contacts/', { params }).then(r => r.data)

export const createContact = (data: object) =>
  api.post('/api/contacts/', data).then(r => r.data)

export const getContact = (id: number) =>
  api.get(`/api/contacts/${id}`).then(r => r.data)

export const updateContact = (id: number, data: object) =>
  api.patch(`/api/contacts/${id}`, data).then(r => r.data)

export const deleteContact = (id: number) =>
  api.delete(`/api/contacts/${id}`)

// Interactions
export const getInteractions = (params?: object) =>
  api.get('/api/interactions/', { params }).then(r => r.data)

export const createInteraction = (data: object) =>
  api.post('/api/interactions/', data).then(r => r.data)

export const getSharedInteraction = (token: string) =>
  api.get(`/api/interactions/share/${token}`).then(r => r.data)

export const completeFollowup = (id: number) =>
  api.patch(`/api/interactions/${id}/complete-followup`).then(r => r.data)

// AI
export const aiChat = (message: string, history: object[]) =>
  api.post('/api/ai/chat', { message, history }).then(r => r.data)

// Chat Sessions (persistent)
export const getChatSessions = () =>
  api.get('/api/ai/sessions').then(r => r.data)

export const createChatSession = () =>
  api.post('/api/ai/sessions').then(r => r.data)

export const getChatSession = (id: number) =>
  api.get(`/api/ai/sessions/${id}`).then(r => r.data)

export const sendChatMessage = (sessionId: number, message: string) =>
  api.post(`/api/ai/sessions/${sessionId}/send`, { session_id: sessionId, message }).then(r => r.data)

export const deleteChatSession = (id: number) =>
  api.delete(`/api/ai/sessions/${id}`)

// Reports
export const getStats = () => api.get('/api/reports/stats').then(r => r.data)

export const getDailyReport = (date?: string) =>
  api.get('/api/reports/daily', { params: date ? { target_date: date } : {} }).then(r => r.data)

// Notifications
export const sendNotifications = (interaction_id: number, channels = ['whatsapp', 'email']) =>
  api.post('/api/notifications/send', { interaction_id, channels }).then(r => r.data)
