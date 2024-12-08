export const LM_STUDIO_CONFIG = {
  baseUrl: 'http://localhost:3030/v1',
  defaultApiKey: '',
  endpoints: {
    chat: '/chat/completions',
    models: '/models'
  },
  defaultSystemPrompt: 'You are an industrial IoT analysis expert specialized in analyzing PLC and sensor data. You provide clear, concise insights about device performance, anomalies, and optimization opportunities.',
  defaultModel: 'lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf'
};