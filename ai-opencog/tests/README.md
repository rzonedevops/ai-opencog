# Tests and Validation

This directory contains test files and validation scripts for the AI-OpenCog Theia extension.

## Test Categories

### Validation Scripts
- `validate-advanced-learning.js` - Advanced learning algorithms validation
- `validate-learning.js` - Basic learning functionality validation
- `validate-production-optimization.js` - Production optimization validation
- `validate-resource-requirements.js` - Resource requirements validation
- `validation-script.js` - General validation script

### Phase-Specific Tests
- `phase3-integration-validator.js` - Phase 3 integration validation
- `phase3-summary.js` - Phase 3 completion summary
- `phase3-validation.js` - Phase 3 feature validation
- `phase4-validation.js` - Phase 4 feature validation
- `phase5-integration-test.js` - Phase 5 integration testing
- `phase5-validation.js` - Phase 5 feature validation
- `phase6-validation.js` - Phase 6 feature validation

### Component Tests
- `distributed-reasoning-test.ts` - Distributed reasoning functionality tests
- `reasoning-agents-validation.js` - Reasoning agents validation
- `specialized-agent-test.js` - Specialized agent testing
- `test-learning-standalone.js` - Standalone learning tests

### Verification Scripts
- `verify-advanced-learning.js` - Advanced learning verification

## Running Tests

### NPM Scripts
Use the predefined npm scripts for validation:

```bash
# Run Phase 6 validation
npm run validate:phase6

# Run resource requirements validation
npm run validate:resource-requirements
```

### Individual Test Files
Run specific test files directly:

```bash
# Run advanced learning validation
node tests/validate-advanced-learning.js

# Run general validation
node tests/validation-script.js

# Run phase-specific validation
node tests/phase3-validation.js
```

### TypeScript Tests
Compile and run TypeScript tests:

```bash
# Compile TypeScript test
npx tsc tests/distributed-reasoning-test.ts

# Run compiled test
node tests/distributed-reasoning-test.js
```

## Test Structure

All test files follow these conventions:
- Validation scripts verify feature implementation
- Phase tests ensure phase completion requirements
- Component tests validate individual modules
- Integration tests verify cross-component functionality

## Continuous Integration

Tests are designed to be run in CI/CD environments and provide clear pass/fail results with detailed logging.