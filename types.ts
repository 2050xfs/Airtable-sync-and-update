
export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, any>;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
}

export enum ProcessMode {
  ANALYZE_IMAGE = 'ANALYZE_IMAGE',
  GENERATE_CONTENT = 'GENERATE_CONTENT'
}

export interface ProcessingConfig {
  mode: ProcessMode;
  imageField: string;
  textFields: string[];
  outputField: string;
  promptTemplate: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  mode: ProcessMode;
  icon: string;
  prompt: string;
  description: string;
}

export interface GroundingSource {
  title?: string;
  uri: string;
}

export interface ProcessingStatus {
  total: number;
  current: number;
  completed: number;
  failed: number;
  isProcessing: boolean;
  logs: Array<{id: string, message: string, status: 'success' | 'error' | 'info'}>;
  currentResult: string;
  pendingUpdates: Record<string, { text: string; sources: GroundingSource[] }>; 
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'product-desc',
    name: 'Artistic Cataloguer',
    mode: ProcessMode.ANALYZE_IMAGE,
    icon: 'Package',
    description: 'Evocative, research-backed art descriptions.',
    prompt: 'Research the item in the image and cross-reference with "{Description}". Write an enriched description that grounds the object, adds cultural gravity, and leaves interpretive space. Follow the S1-S2-S3 formula. Use two paragraphs if the object warrants a separate emotional reading, otherwise use one paragraph of 3-5 sentences.'
  },
  {
    id: 'visual-audit',
    name: 'Curatorial Auditor',
    mode: ProcessMode.ANALYZE_IMAGE,
    icon: 'ShieldAlert',
    description: 'Fact-checked visual status report.',
    prompt: 'Research the historical standards for this object. Evaluate the provided image against existing notes: "{Description}". Describe the condition and presence of the piece in 3-5 sentences. If significant wear or unique patina is found, use a second paragraph to suggest the life story of the object revealed through its wear.'
  },
  {
    id: 'data-enrichment',
    name: 'Context Enricher',
    mode: ProcessMode.GENERATE_CONTENT,
    icon: 'Search',
    description: 'Deep context and heritage synthesis.',
    prompt: 'Conduct factual research on "{Title}" and its era. Combine your findings with "{Description}". Craft a summary that recalls a specific cultural moment. Ensure a sophisticated tone that avoids clichés. One paragraph for simple provenance, two paragraphs if the history of ownership and style both require focus.'
  }
];
