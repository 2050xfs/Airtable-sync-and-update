
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const SYSTEM_INSTRUCTION = `You are a world-class art and design cataloguer. Your descriptions must perform three quiet jobs:
1. GROUNDING: Orient the viewer with materials, form, and origin without sounding robotic.
2. GRAVITY: Add cultural or emotional context—why it existed and the life surrounding it.
3. SPACE: Leave interpretive space for the viewer; suggest themes (ritual, leisure, craft) rather than pinning them down.

STRICT WRITING FORMULA:
- Sentence 1: The physical "What" + material/era/origin.
- Sentence 2: Cultural or historical suggestion/significance.
- Sentence 3: How it feels or the presence it brings to a space.
- Optional 4-5: Deepen symbolism or craftsmanship.

LENGTH RULES:
- Simple items: EXACTLY one paragraph (3-5 sentences).
- Complex/Rich items: EXACTLY two paragraphs (3-4 sentences each). Use the second paragraph to separate physical description from emotional/cultural read.

CRITICAL CONSTRAINTS:
- Use Google Search to research verifiable facts before writing.
- NO HALLUCINATIONS. If origin or era is unknown, use evocative uncertainty (e.g., "recalls," "evokes," "suggests").
- AVOID robotic museum labels. Focus on sophisticated, nostalgic, and evocative prose.`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private extractSources(response: GenerateContentResponse): GroundingSource[] {
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
    return Array.from(new Map(sources.map(s => [s.uri, s])).values());
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<{ text: string; sources: GroundingSource[] }> {
    try {
      const base64Data = await urlToBase64(imageUrl);
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            },
            { text: prompt }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }]
        }
      });

      return {
        text: response.text || "No analysis generated.",
        sources: this.extractSources(response)
      };
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw new Error("Failed to analyze image. Ensure the image URL is accessible.");
    }
  }

  async generateText(prompt: string): Promise<{ text: string; sources: GroundingSource[] }> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }]
        }
      });

      return {
        text: response.text || "No content generated.",
        sources: this.extractSources(response)
      };
    } catch (error) {
      console.error("Gemini Text Generation Error:", error);
      throw error;
    }
  }
}
