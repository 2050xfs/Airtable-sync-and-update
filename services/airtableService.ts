import { AirtableRecord, AirtableConfig } from '../types';

const BASE_URL = 'https://api.airtable.com/v0';

export class AirtableService {
  private config: AirtableConfig;

  constructor(config: AirtableConfig) {
    this.config = config;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.config.apiKey.trim()}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchRecords(maxRecords = 100): Promise<AirtableRecord[]> {
    try {
      // URL encode components to handle spaces and special characters in table names
      const baseId = encodeURIComponent(this.config.baseId.trim());
      const tableName = encodeURIComponent(this.config.tableName.trim());
      const url = `${BASE_URL}/${baseId}/${tableName}?maxRecords=${maxRecords}`;
      
      const response = await fetch(url, {
        headers: this.headers
      });

      if (!response.ok) {
        let errorMessage = `Airtable Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try getting text
          const text = await response.text();
          if (text) errorMessage += ` (${text.slice(0, 100)})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.records;
    } catch (error: any) {
      console.error('Airtable Fetch Error:', error);
      // Re-throw with more context if it's a network error (CORS or offline)
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error or CORS block. Ensure your browser allows requests to api.airtable.com and your API key is valid.');
      }
      throw error;
    }
  }

  async updateRecord(recordId: string, fields: Record<string, any>): Promise<void> {
    try {
      const baseId = encodeURIComponent(this.config.baseId.trim());
      const tableName = encodeURIComponent(this.config.tableName.trim());
      const url = `${BASE_URL}/${baseId}/${tableName}`;
      
      const body = {
        records: [
          {
            id: recordId,
            fields: fields
          }
        ]
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMessage = `Airtable Update Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          const text = await response.text();
          if (text) errorMessage += `: ${text.slice(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Airtable Update Error:', error);
      throw error;
    }
  }
}
