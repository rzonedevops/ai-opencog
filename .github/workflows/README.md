# TypeScript Auto-fix GitHub Actions

This repository includes two GitHub Actions workflows designed to automatically detect and fix TypeScript compilation errors.

## Workflows

### 1. Auto-fix TypeScript Errors (`autofix-typescript.yml`)

A comprehensive workflow that automatically fixes common TypeScript errors and creates pull requests with the fixes.

**Triggers:**
- Manual dispatch (workflow_dispatch)
- Weekly schedule (Sundays at 2 AM UTC)  
- Push to main/develop branches with TypeScript file changes

**Features:**
- Analyzes TypeScript compilation errors
- Applies automatic fixes for common patterns:
  - Missing module exports
  - DisposableCollection.push() usage
  - Missing constructor arguments
  - Missing type definitions
- Creates pull requests with fixes
- Provides detailed reports and logs

**Usage:**
```bash
# Manual trigger via GitHub UI or CLI
gh workflow run "Auto-fix TypeScript Errors" \
  --field branch=main \
  --field create_pr=true
```

### 2. TypeScript Lint and Fix (`typescript-lint.yml`)

A focused workflow for linting and fixing TypeScript code with ESLint integration.

**Triggers:**
- Manual dispatch with fix mode selection
- Pull requests with TypeScript changes
- Push to main/develop branches

**Fix Modes:**
- `check`: Only check for errors (default)
- `fix`: Apply fixes without creating PR
- `fix-and-pr`: Apply fixes and create PR

**Features:**
- TypeScript compilation check
- ESLint integration with auto-fix
- Detailed error categorization
- PR comments with results
- Automatic fix application

**Usage:**
```bash
# Check only
gh workflow run "TypeScript Lint and Fix" --field fix_mode=check

# Apply fixes
gh workflow run "TypeScript Lint and Fix" --field fix_mode=fix

# Apply fixes and create PR
gh workflow run "TypeScript Lint and Fix" --field fix_mode=fix-and-pr
```

## Local Development

### Available NPM Scripts

The package.json has been enhanced with TypeScript-related scripts:

```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Create stub dependencies
npm run create-stubs

# Complete auto-fix process
npm run autofix
```

### Manual Fix Process

1. **Create stub dependencies:**
   ```bash
   cd ai-opencog
   npm run create-stubs
   ```

2. **Check TypeScript errors:**
   ```bash
   npm run type-check
   ```

3. **Apply ESLint fixes:**
   ```bash
   npm run lint:fix
   ```

4. **Run complete auto-fix:**
   ```bash
   npm run autofix
   ```

## Common TypeScript Errors Fixed

### 1. Missing Module Exports
```typescript
// Error: has no exported member named 'EditorManager'
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';

// Fixed by enhancing stub files with proper exports
```

### 2. DisposableCollection Usage
```typescript
// Error: Property 'push' does not exist on type 'DisposableCollection'
this.disposables.push(listener1, listener2, listener3);

// Fixed:
this.disposables.push(listener1);
this.disposables.push(listener2);
this.disposables.push(listener3);
```

### 3. Missing Constructor Arguments
```typescript
// Error: Expected 1 arguments, but got 0
@injectable()
export class MyClass {
  constructor() {} // Missing injection decorators
}

// Fixed by updating stub files with proper decorator signatures
```

### 4. Node.js Type Definitions
```typescript
// Error: Cannot find name 'process'
const memory = process.memoryUsage();

// Fixed by adding @types/node dependency
```

## Workflow Outputs

### Auto-fix TypeScript Errors
- **Artifacts:** Error logs, backups, fix reports
- **Pull Request:** Detailed description of fixes applied
- **Summary:** Statistics on errors found and fixed

### TypeScript Lint and Fix  
- **Artifacts:** Lint logs, TypeScript check results
- **PR Comments:** Real-time status on pull requests
- **Exit Codes:** Fails CI if unfixable errors found

## Configuration

### ESLint Configuration
The workflows automatically create a `.eslintrc.js` if none exists:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // ... more rules
  }
};
```

### TypeScript Configuration
Uses existing `tsconfig.build.lenient.json` with enhancements for:
- Skip lib checking
- Lenient type checking
- Node.js type support

## Permissions Required

The workflows require the following GitHub permissions:
- `contents: write` - To read/write repository files
- `pull-requests: write` - To create pull requests
- `checks: write` - To create check status

## Best Practices

1. **Review Auto-fixes:** Always review generated pull requests before merging
2. **Incremental Fixes:** Run workflows on feature branches for testing
3. **Monitor Logs:** Check workflow artifacts for detailed error analysis
4. **Update Dependencies:** Keep TypeScript and ESLint versions current
5. **Custom Rules:** Customize ESLint configuration for project needs

## Troubleshooting

### Common Issues

1. **Stub Dependencies Missing:**
   - Ensure `create-stubs.js` runs successfully
   - Check that stub files are created in `node_modules/@theia/`

2. **Permission Errors:**
   - Verify repository has required workflow permissions
   - Check GitHub token has appropriate scopes

3. **Network Issues:**
   - Some npm installations may fail due to network restrictions
   - Workflows include fallback mechanisms

4. **Large Codebases:**
   - Workflows may timeout on very large codebases
   - Consider running on smaller subsets or increasing timeout

### Support

For issues specific to these workflows:
1. Check workflow run logs in the Actions tab
2. Review artifacts for detailed error information  
3. Test fixes locally using npm scripts
4. Create issues with workflow log excerpts