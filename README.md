# Quilliyo 📝

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8d2b207a-b1d7-4644-a927-af11fdbf25f5.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8d2b207a-b1d7-4644-a927-af11fdbf25f5)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/ilmtest)](https://ilmtest.vercel.app)
[![codecov](https://codecov.io/gh/ragaeeb/ilmtest/graph/badge.svg?token=ZD0WHFWUF5)](https://codecov.io/gh/ragaeeb/ilmtest)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/ilmtest/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/ilmtest/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/ilmtest)

A secure, modern web application for managing poetry and creative writing with built-in encryption, tagging, and annotation features.

## Features

### 🔐 **Security & Privacy**
- Client-side encryption/decryption of your poetry collection
- MongoDB backend storage with encrypted data option
- Clerk authentication for secure user access

### ✍️ **Poetry Management**
- Create, edit, and organize poems in a digital notebook
- Rich metadata support (tags, categories, chapters)
- Date tracking for creation and updates
- URL references for inspiration sources

### 💭 **Thought Annotations**
- Add contextual thoughts/notes to specific text selections within poems
- Support for multiple thoughts on the same text
- Visual highlighting of annotated passages
- Edit and manage thoughts over time

### 🎨 **User Experience**
- Dark/light theme support
- Adjustable font sizes for comfortable reading
- Real-time search across all poems
- Responsive design for desktop and mobile
- Auto-save functionality

## Tech Stack

- **Frontend**: Next.js 15.5 with React 19
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **Database**: MongoDB
- **UI Components**: Radix UI primitives with custom styling
- **Development**: TypeScript, Biome (linting/formatting)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- MongoDB database (local or cloud)
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quilliyo.git
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
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
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
│   │   └── notebook/      # Notebook CRUD operations
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── PoemEditModal.tsx # Poem editor with metadata
│   ├── ContentEditor.tsx # Rich text editor with annotations
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useNotebook.ts   # Notebook state management
│   ├── useSearch.ts     # Search functionality
│   └── useMetadata.ts   # Metadata extraction
├── lib/                  # Utility functions
│   ├── mongodb.ts       # Database connection
│   ├── security.ts      # Encryption utilities
│   └── models/          # Data models
└── types/               # TypeScript type definitions
```

## Usage

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

The application uses a single MongoDB collection for notebooks:

```typescript
{
  userId: string;           // Clerk user ID
  notebookId: string;      // Notebook identifier
  encrypted?: boolean;     // Encryption status
  data?: string;          // Encrypted notebook data
  poems?: Array<{         // Unencrypted poems array
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
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Future Enhancements

- Multiple notebook support (foundation already in place)
- Export options (PDF, Markdown, JSON)
- Collaborative notebooks with sharing
- Version history for poems
- AI-powered writing suggestions
- Mobile app companion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private. All rights reserved.

## Acknowledgments

- Built with love for poets and creative writers
- Inspired by the need for a secure, modern poetry management tool
- Special thanks to all open-source contributors whose libraries made this possible