# AI-OpenCog Integration Quick Reference

A quick reference companion to the [comprehensive integration guide](ai-opencog-integration-guide.md).

## Quick Setup Checklist

- [ ] **Prerequisites**: Node.js 16+, Theia 1.64.0, OpenCog dependencies
- [ ] **Install Package**: `npm install @theia/ai-opencog@1.64.0`
- [ ] **Verify Structure**: Check `theiaExtensions` in package.json
- [ ] **Build Extension**: `npm run compile`
- [ ] **Configure**: Set up ai-opencog.json configuration
- [ ] **Test Integration**: Verify agents load correctly

## Essential File Locations

| Component | Path | Purpose |
|-----------|------|---------|
| **Package Config** | `package.json` | Extension metadata & dependencies |
| **Frontend Entry** | `lib/browser/ai-opencog-frontend-module.js` | Browser-side module |
| **Backend Entry** | `lib/node/ai-opencog-backend-module.js` | Node.js-side module |
| **Type Definitions** | `lib/common/` | Shared interfaces & types |
| **Configuration** | `config/ai-opencog.json` | Extension settings |

## Key Extension Configuration

```json
{
  "theiaExtensions": [
    {
      "frontend": "lib/browser/ai-opencog-frontend-module",
      "backend": "lib/node/ai-opencog-backend-module"
    }
  ]
}
```

## Core Dependencies

```json
{
  "@theia/core": "1.64.0",
  "@theia/ai-core": "1.64.0",
  "@theia/ai-chat": "1.64.0",
  "@theia/workspace": "1.64.0",
  "@theia/editor": "1.64.0",
  "@theia/monaco": "1.64.0"
}
```

## Main Cognitive Agents

- **IntelligentAssistanceAgent**: Context-aware development support
- **UserBehaviorLearningAgent**: Adaptive personalization
- **ComprehensiveCodeAnalysisAgent**: Real-time cognitive analysis
- **AdvancedReasoningAgent**: Complex problem-solving

## Common Commands

```bash
# Build extension
npm run compile

# Clean build
npm run clean

# Run tests
npm run test

# Watch mode
npm run watch

# Production deployment
npm run docker:build
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Extension not loading | Check `theiaExtensions` field in package.json |
| Build errors | Run `npm install && npm run clean && npm run compile` |
| OpenCog connection | Verify `OPENCOG_ATOMSPACE_SIZE` environment variable |
| Memory issues | Reduce atomspace size in configuration |

## Useful Environment Variables

```bash
export OPENCOG_ATOMSPACE_SIZE=1000000
export THEIA_AI_OPENCOG_ENABLED=true
export THEIA_AI_OPENCOG_DEBUG=false
```

For complete details, see the [full integration guide](ai-opencog-integration-guide.md).