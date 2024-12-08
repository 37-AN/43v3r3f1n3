import { toast } from "sonner";
import { LM_STUDIO_CONFIG } from "@/config/lmstudio";
import type { LLMStudioConfig, LLMStudioResponse, LLMStudioMessage } from "@/types/lmstudio";

class LMStudioAPI {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config?: LLMStudioConfig) {
    this.baseUrl = config?.baseUrl || LM_STUDIO_CONFIG.baseUrl;
    this.apiKey = config?.apiKey || LM_STUDIO_CONFIG.defaultApiKey;
    this.model = config?.model || LM_STUDIO_CONFIG.defaultModel;
  }

  private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
    console.log(`Making request to LM Studio endpoint: ${endpoint}`, { body });
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('LM Studio API error:', response.statusText);
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from LM Studio:', data);
    return data;
  }

  async getModels() {
    try {
      console.log('Fetching available models from LM Studio');
      const response = await fetch(`${this.baseUrl}${LM_STUDIO_CONFIG.endpoints.models}`);
      const data = await response.json();
      console.log('Available models:', data);
      return data.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async analyze(prompt: string): Promise<string> {
    try {
      console.log('Sending analysis request to LM Studio:', { prompt });
      
      const messages: LLMStudioMessage[] = [
        { 
          role: 'system', 
          content: LM_STUDIO_CONFIG.defaultSystemPrompt
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ];

      const data = await this.makeRequest<LLMStudioResponse>(LM_STUDIO_CONFIG.endpoints.chat, {
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        model: this.model
      });

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing with LM Studio:', error);
      toast.error('Failed to analyze data with LM Studio');
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing LM Studio connection...');
      
      // First check if we can get models
      const models = await this.getModels();
      if (!models || models.length === 0) {
        throw new Error('No models available');
      }

      const data = await this.makeRequest<LLMStudioResponse>(LM_STUDIO_CONFIG.endpoints.chat, {
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Respond with "OK" if you can hear me.' }
        ],
        temperature: 0.1,
        max_tokens: 10,
        model: this.model
      });
      
      if (data?.choices?.[0]?.message?.content) {
        console.log('LM Studio connection test successful');
        toast.success('Successfully connected to LM Studio');
        return true;
      }

      console.error('LM Studio response format unexpected:', data);
      return false;
    } catch (error) {
      console.error('Error testing LM Studio connection:', error);
      toast.error('Failed to connect to LM Studio. Is the server running at http://localhost:3030?');
      return false;
    }
  }
}

// Create a singleton instance with default configuration
export const lmStudio = new LMStudioAPI();

// Export the class for custom configurations
export { LMStudioAPI };