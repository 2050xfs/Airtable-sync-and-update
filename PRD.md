# Product Requirements Document: AirGen Vision

## 1. Executive Summary
**AirGen Vision** is a sophisticated "Curatorial Studio" that bridges the gap between structured data in Airtable and the generative intelligence of Google Gemini. It is designed for archivists, cataloguers, and content creators who need to enrich their databases with high-quality, AI-generated descriptions, visual analyses, and cultural context.

The application provides a "human-in-the-loop" workflow where AI-generated content is researched, synthesized, and verified before being committed back to the live database.

---

## 2. Core Objectives
- **Seamless Integration**: Provide a direct pipeline between Airtable records and Gemini models.
- **Visual Intelligence**: Leverage Gemini's multimodal capabilities to analyze images stored in Airtable attachments.
- **Curatorial Quality**: Use grounding (Google Search) to ensure generated content is historically and culturally accurate.
- **Batch Efficiency**: Process multiple records in sequence while maintaining a high-fidelity interactive UI.

---

## 3. Functional Requirements

### 3.1. Authentication & Connectivity
- Users must provide an Airtable Personal Access Token (PAT), Base ID, and Table Name.
- Configuration is persisted locally (localStorage) for session continuity.
- The app validates the connection by fetching the first 50 records.

### 3.2. Data Management
- **Record Visualization**: Display Airtable records in a clean, scannable data table.
- **Field Mapping**: Users can select which fields to use as inputs (for prompts) and which field to use for AI output.
- **Image Support**: Ability to select an attachment field for visual analysis.

### 3.3. AI Processing Engine
- **Mode Selection**: Toggle between "Text Generation" (data-to-text) and "Image Analysis" (vision-to-text).
- **Prompt Templating**: Support for dynamic variables using `{FieldName}` syntax.
- **Grounding**: Integration with Google Search to cite sources and verify facts.
- **System Instruction**: A hardcoded "Curatorial Persona" that enforces specific writing styles (Grounding, Gravity, Space).

### 3.4. The "Curatorial Bench" (Processing UI)
- **Real-time Feedback**: A dedicated processing view that visualizes the AI's "thought process" through three stages:
    1. **Scan**: Analyzing record data and images.
    2. **Generate**: Synthesizing the narrative using Gemini.
    3. **Verify**: Fact-checking and contextualizing via search grounding.
- **Live Logs**: A terminal-style log feed tracking every step of the research cycle.

### 3.5. Review & Commit Workflow
- **Pending Drawer**: A staging area for generated content.
- **Granular Control**: Users can review, edit (via commit), or discard individual updates.
- **Batch Commit**: One-click synchronization of all verified narratives back to Airtable.

---

## 4. Technical Architecture

### 4.1. Tech Stack
- **Framework**: React 19 (Functional Components, Hooks).
- **Language**: TypeScript (Strict typing for Airtable and Gemini payloads).
- **Styling**: Tailwind CSS (Utility-first, custom "Editorial" theme).
- **Icons**: Lucide React.
- **AI SDK**: `@google/genai` (Gemini 3 Flash Preview).
- **Build Tool**: Vite.

### 4.2. Service Layer
- **AirtableService**: Handles REST API calls (GET for fetching, PATCH for updates) with robust error handling and URL encoding for table names.
- **GeminiService**: Manages interactions with the Google Generative AI SDK, including image-to-base64 conversion and grounding metadata extraction.

### 4.3. Data Flow
1. **Fetch**: App -> Airtable API -> State.
2. **Process**: State -> Gemini API (with Search Tool) -> Pending State.
3. **Commit**: Pending State -> Airtable API -> State Update.

---

## 5. UI/UX Design Principles
- **Aesthetic**: "Technical Dashboard meets Editorial Magazine."
- **Color Palette**: Slate/Zinc base with Blue-600 primary accents and Emerald-500 for verification states.
- **Typography**: Inter (Sans) for UI, with Monospace accents for data IDs and logs.
- **Motion**: Framer Motion (or CSS transitions) for "slam-in" animations and scanning effects.

---

## 6. End-to-End Recreation Guide

### Step 1: Environment Setup
1. Initialize a Vite project with React and TypeScript.
2. Install dependencies: `npm install @google/genai lucide-react`.
3. Configure `vite.config.ts` to expose `GEMINI_API_KEY` via `process.env`.

### Step 2: Define Types (`types.ts`)
Create interfaces for `AirtableRecord`, `AirtableConfig`, `ProcessingStatus`, and `ProcessMode`.

### Step 3: Implement Services
1. **Airtable Service**: Create a class that takes a config and provides `fetchRecords` and `updateRecord` methods.
2. **Gemini Service**: Create a class that initializes the SDK and provides `analyzeImage` and `generateText` methods. Ensure it handles `googleSearch` tools.

### Step 4: Build UI Components
1. **ConnectForm**: A high-contrast form for API credentials.
2. **DataTable**: A clean grid to view existing records.
3. **ProcessingPanel**: A sidebar for configuring the prompt and output fields.
4. **PendingDrawer**: A slide-out panel for reviewing AI results.

### Step 5: Orchestrate State (`App.tsx`)
1. Implement the `handleConnect` logic to sync with Airtable.
2. Build the `handleProcess` loop that iterates through records, calls Gemini, and updates the `status` state.
3. Add the `handleCommit` logic to push data back to Airtable.

### Step 6: Styling & Polish
1. Add custom scrollbars and animations in `index.css`.
2. Implement the "Scanning" animation using CSS keyframes.
3. Ensure responsive design using Tailwind's grid and flex utilities.

---

## 7. Configuration Requirements
To run this app, the following are required:
- **Airtable PAT**: With `data.records:read` and `data.records:write` scopes.
- **Google Gemini API Key**: Provided via the `GEMINI_API_KEY` environment variable.
- **Airtable Base**: A base containing at least one table with a text field for output and (optionally) an attachment field for images.
