# Quilliyo 📝

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8d2b207a-b1d7-4644-a927-af11fdbf25f5.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8d2b207a-b1d7-4644-a927-af11fdbf25f5)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/quilliyo)](https://quilliyo.vercel.app)
[![codecov](https://codecov.io/gh/ragaeeb/quilliyo/graph/badge.svg?token=A2E06C7QXO)](https://codecov.io/gh/ragaeeb/quilliyo)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/quilliyo/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/quilliyo/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/quilliyo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A secure, modern web application for managing poetry and creative writing with built-in encryption, tagging, annotation, and AI-powered podcast generation features.

## Features

### 🔐 **Security & Privacy**
- Client-side encryption/decryption of your poetry collection
- Supabase (Postgres) backend storage with encrypted data option
- Supabase Authentication for secure user access

### ✍️ **Poetry Management**
- Create, edit, and organize poems in a digital notebook
- Rich metadata support (tags, categories, chapters)
- Date tracking for creation and updates
- URL references for inspiration sources
- Multi-selection for batch operations

### 💭 **Thought Annotations**
- Add contextual thoughts/notes to specific text selections within poems
- Support for multiple thoughts on the same text
- Visual highlighting of annotated passages
- Edit and manage thoughts over time

### 🎙️ **AI-Powered Podcast Generation**
- Generate engaging podcast episodes from your poems
- Two podcast styles:
  - **Expert Analysis**: Single narrator providing deep literary analysis
  - **Debate Discussion**: Two AI hosts (Alex & Jordan) debating interpretations
- Powered by Google Gemini 2.5 Flash for transcript generation
- Text-to-Speech via Azure Speech Services
- Customizable voices for different speakers
- Select multiple poems to create comprehensive episodes
- Natural conversational flow with pauses and emphasis
- Download generated podcast episodes as MP3 files

### 🎨 **User Experience**
- Dark/light theme support
- Adjustable font sizes for comfortable reading
- Real-time search across all poems
- Responsive design for desktop and mobile
- Auto-save functionality

## Tech Stack

- **Frontend**: Next.js 15.5 with React 19
- **Styling**: Tailwind CSS v4
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Google Gemini 2.5 Flash (transcript generation)
- **TTS**: Azure Speech Services
- **UI Components**: Radix UI primitives with custom styling
- **Development**: TypeScript, Biome (linting/formatting)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Supabase project (free tier available at https://supabase.com)
- Google AI API key (for podcast transcript generation)
- Azure Speech Services subscription (for text-to-speech)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ragaeeb/quilliyo.git
cd quilliyo
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (for podcast transcript generation)
GOOGLE_API_KEY=your_google_ai_api_key

# Azure Speech Services (for text-to-speech)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus  # or your preferred region
```

4. Run the development server:
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
quilliyo/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── notebook/      # Notebook CRUD operations
│   │   └── podcast/       # Podcast generation endpoints
│   │       ├── transcript/ # AI transcript generation
│   │       └── generate/  # TTS audio generation
│   ├── auth/              # Authentication pages
│   │   └── login/         # Login/signup page
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── PoemEditModal.tsx # Poem editor with metadata
│   ├── ContentEditor.tsx # Rich text editor with annotations
│   ├── PodcastModal.tsx  # Podcast generation interface
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useNotebook.ts   # Notebook state management
│   ├── useSearch.ts     # Search functionality
│   └── useMetadata.ts   # Metadata extraction
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client utilities
│   │   ├── client.ts    # Browser client
│   │   └── server.ts    # Server client with SSR
│   ├── security.ts      # Encryption utilities
│   └── models/          # Data models
│       └── notebook.ts  # Notebook database operations
├── middleware.ts         # Supabase SSR middleware
└── types/               # TypeScript type definitions
    ├── notebook.ts      # Notebook and poem types
    └── podcast.ts       # Podcast generation types
```

## Usage

### Authentication

1. Navigate to `/auth/login`
2. Sign up with email and password or sign in if you already have an account
3. Check your email for confirmation (if signing up)
4. You'll be redirected to the main application

### Creating a Poem

1. Click the "New Poem" button
2. Enter title and content
3. Add optional metadata (tags, category, chapter)
4. Save your poem

### Adding Thoughts/Annotations

1. Open a poem for editing
2. Select the text you want to annotate
3. Click "Add Thought"
4. Enter your thought/note
5. The text will be highlighted in the editor

### Generating Podcasts

1. Select one or more poems using the checkboxes
2. Click the "Podcast" button in the toolbar
3. Choose your podcast style:
   - **Expert Analysis**: Single narrator providing literary analysis
   - **Debate Discussion**: Two hosts debating the poem's meaning
4. (Optional) Customize the voices for narrators/speakers
5. Click "Generate Transcript" to create the script
6. Review and edit the transcript if needed
7. Click "Generate Audio" to create the podcast
8. Download the generated MP3 file

### Encryption

1. Click the encryption status button in the header
2. Set an encryption key (keep this safe!)
3. Your notebook will be encrypted before saving to the database
4. You'll need the key to decrypt and view your poems

### Search

Use the search bar to find poems by:
- Title
- Content
- Tags
- Category
- Chapter

## Development

### Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Code linting
npm run lint

# Format code
npm run format
```

### Database Schema

The application uses a Supabase (PostgreSQL) table for notebooks:

```sql
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  notebook_id TEXT NOT NULL,
  data TEXT,              -- Encrypted notebook data (when encrypted)
  poems JSONB,            -- Unencrypted poems array (when not encrypted)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notebook_id)
);
```

**Poems structure (when unencrypted):**
```typescript
{
  id: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  chapter?: string;
  createdOn?: string;
  lastUpdatedOn?: string;
  metadata?: {
    urls?: string;
    thoughts?: string;  // JSON stringified thoughts
  };
}
```

## Deployment

### Vercel Deployment Notes

**⚠️ Important**: The current podcast generation implementation saves MP3 files to the `/public` folder, which **will not work** on Vercel's serverless environment. Vercel's filesystem is read-only and ephemeral.

**Recommended Solutions for Production:**

1. **Use a Cloud Storage Service** (Recommended):
   - Store generated MP3 files in AWS S3, Google Cloud Storage, or Vercel Blob Storage
   - Return signed URLs for downloads
   - Automatically clean up old files

2. **Stream Audio Directly**:
   - Return the audio as a base64-encoded response
   - Let the client handle the file download
   - No server-side storage needed

3. **Use Vercel Blob Storage**:
   ```typescript
   import { put } from '@vercel/blob';
   const blob = await put(`podcast-${timestamp}.mp3`, audioBuffer, {
     access: 'public',
   });
   return blob.url;
   ```

### Environment Variables for Vercel

Set the following environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

## API Endpoints

### Podcast Generation

**POST** `/api/podcast/transcript`
- Generates a podcast transcript using Google Gemini
- Body: `{ poems: Poem[], style: 'expert-analysis' | 'debate' }`
- Returns: `{ transcript: string, duration: string }`

**POST** `/api/podcast/generate`
- Converts transcript to audio using Azure Speech Services
- Body: `{ transcript: string, platform: 'azure-speech', voiceConfig?: {...} }`
- Returns: `{ audioBase64: string, audioUrl: string }`

## Future Enhancements

- Cloud storage integration for podcast files (AWS S3, Vercel Blob)
- Multiple notebook support (foundation already in place)
- Export options (PDF, Markdown, JSON)
- Collaborative notebooks with sharing
- Version history for poems
- AI-powered writing suggestions
- Mobile app companion
- Podcast episode management and history
- Custom voice training for personalized narration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Ragaeeb Haq

## Acknowledgments

- Built with love for poets and creative writers
- Inspired by the need for a secure, modern poetry management tool
- Powered by Google Gemini and Azure Speech Services
- Special thanks to all open-source contributors whose libraries made this possible