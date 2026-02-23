import { apiClient } from '@/lib/api/client'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  success: boolean
  response: string
}

interface WelcomeResponse {
  success: boolean
  message: string
}

export const chatbotService = {
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<string> {
    const response = await apiClient.post<ChatResponse>('/chatbot/chat', {
      message,
      history,
    })
    return response.response
  },

  async getWelcomeMessage(): Promise<string> {
    const response = await apiClient.get<WelcomeResponse>('/chatbot/welcome')
    return response.message
  },
}
