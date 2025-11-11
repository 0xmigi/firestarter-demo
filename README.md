# Firestarter Demo

Interactive demo application showcasing the [firestarter-sdk](https://github.com/0xmigi/firestarter-sdk) for Pipe Network decentralized storage.

## Features

- **Account Management**: Create accounts or login with existing credentials
- **File Upload**: Upload files with real-time progress tracking
- **File Management**: View, download, share, and delete files
- **Multiple Views**: Switch between grid and list view modes
- **Balance Tracking**: Check your PIPE and SOL balances
- **Local Storage**: Files tracked locally in browser (with helpful info modal)

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS 4
- firestarter-sdk ^2.1.3
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 16+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Usage

1. **Create Account or Login**: Enter username (8+ chars) and password (8+ chars)
2. **Upload Files**: Select files to upload to Pipe Network
3. **Manage Files**: Download, share via public links, or delete files
4. **Track Balance**: Monitor your PIPE token balance

## SDK Documentation

For more details on using the firestarter-sdk, check out:
- [SDK Repository](https://github.com/0xmigi/firestarter-sdk)
- [API Reference](https://github.com/0xmigi/firestarter-sdk/blob/main/API_REFERENCE.md)
- [npm Package](https://www.npmjs.com/package/firestarter-sdk)

## License

MIT
