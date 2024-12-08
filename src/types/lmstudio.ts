export interface LLMStudioResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
}

export interface LLMStudioConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface LLMStudioMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStudioModel {
  id: string;
  object: string;
  owned_by: string;
  permission: Array<Record<string, unknown>>;
}