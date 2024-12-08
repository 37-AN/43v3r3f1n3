import { toast } from "sonner";

interface LLMStudioResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
}

interface LLMStudioConfig {
  baseUrl?: string;
  apiKey?: string;
}

class LMStudioAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config?: LLMStudioConfig) {
    this.baseUrl = config?.baseUrl || 'http://localhost:1234/v1';
    this.apiKey = config?.apiKey || '';
  }

  async analyze(prompt: string): Promise<string> {
    try {
      console.log('Sending analysis request to LM Studio:', { prompt });
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'You are an industrial IoT analysis expert specialized in analyzing PLC and sensor data.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        console.error('LM Studio API error:', response.statusText);
        throw new Error(`LM Studio API error: ${response.statusText}`);
      }

      const data: LLMStudioResponse = await response.json();
      console.log('Received response from LM Studio:', data);

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
      
      // Use the chat completions endpoint directly for the health check
      // as the root endpoint doesn't support OPTIONS requests properly
      const testResponse = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a test assistant.' },
            { role: 'user', content: 'Respond with "OK" if you can hear me.' }
          ],
          temperature: 0.1,
          max_tokens: 10,
        }),
      });

      if (!testResponse.ok) {
        console.error('LM Studio API test failed:', testResponse.statusText);
        toast.error('LM Studio API is not functioning correctly');
        return false;
      }

      const data = await testResponse.json();
      console.log('LM Studio connection test response:', data);
      
      if (data && data.choices && data.choices[0]?.message?.content) {
        console.log('LM Studio connection test successful');
        toast.success('Successfully connected to LM Studio');
        return true;
      }

      console.error('LM Studio response format unexpected:', data);
      return false;
    } catch (error) {
      console.error('Error testing LM Studio connection:', error);
      toast.error('Failed to connect to LM Studio. Is the server running at http://localhost:1234?');
      return false;
    }
  }
}

// Create a singleton instance with default configuration
export const lmStudio = new LMStudioAPI();

// Export the class for custom configurations
export { LMStudioAPI };