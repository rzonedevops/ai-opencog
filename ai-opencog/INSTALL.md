# Theia AI-OpenCog Extension Package

## Installation & Setup

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- A Theia application or workspace

### Installing the Package

#### Option 1: From npm (when published)
```bash
npm install @theia/ai-opencog
```

#### Option 2: From source
```bash
git clone https://github.com/rzonedevops/ai-opencog.git
cd ai-opencog/ai-opencog
npm install
npm run build
```

### Using in a Theia Application

Add the extension to your Theia application's package.json:

```json
{
  "dependencies": {
    "@theia/ai-opencog": "^1.64.1"
  }
}
```

The extension will be automatically discovered and loaded by Theia.

### Building from Source

```bash
# Install dependencies (requires network access)
npm install

# Build the extension
npm run build

# Watch for changes during development
npm run watch

# Run tests (when properly configured)
npm run test:all
```

### Development Setup

For development, ensure you have the following Theia dependencies installed in your workspace:

- `@theia/core`
- `@theia/ai-core` 
- `@theia/ai-chat`
- `@theia/workspace`
- `@theia/editor`
- `@theia/filesystem`
- `@theia/monaco`
- `@theia/variable-resolver`

### Docker Deployment

The package includes Docker configuration for production deployment:

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Production deployment
npm run deploy:production
```

## Package Structure

This is a complete Theia extension package that provides:

- **Frontend Module**: `lib/browser/ai-opencog-frontend-module`
- **Backend Module**: `lib/node/ai-opencog-backend-module`
- **Common Interface**: `lib/common`

## Features

- OpenCog AI integration
- Cognitive reasoning engines
- Pattern recognition
- Learning and adaptation
- Knowledge management
- Multi-modal processing
- Production monitoring and optimization

## Troubleshooting

### Installation Issues

If you encounter network connectivity issues during installation:

1. Set environment variables to skip binary downloads:
   ```bash
   export PUPPETEER_SKIP_DOWNLOAD=true
   npm install
   ```

2. For corporate networks, configure npm proxy settings:
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

### TypeScript Compilation

If TypeScript compilation fails:

1. Ensure all Theia dependencies are properly installed
2. Check that TypeScript version is compatible (~5.0.4)
3. Verify tsconfig.json configuration

### Extension Not Loading

If the extension doesn't load in Theia:

1. Check that the package is listed in your application's dependencies
2. Verify the `theiaExtensions` configuration in package.json
3. Ensure both frontend and backend modules are properly built
4. Check browser console for error messages

## License

Eclipse Public License 2.0 OR GPL-2.0-only WITH Classpath-exception-2.0