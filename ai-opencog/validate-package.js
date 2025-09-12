#!/usr/bin/env node

/**
 * Validates the Theia AI-OpenCog package structure and configuration
 */

const fs = require('fs');
const path = require('path');

const packageRoot = process.cwd();
console.log('Validating Theia AI-OpenCog package...');

// Check package.json
const packageJsonPath = path.join(packageRoot, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log('✅ package.json found');

// Validate package.json structure
const requiredFields = ['name', 'version', 'description', 'main', 'theiaExtensions'];
const missingFields = requiredFields.filter(field => !packageJson[field]);

if (missingFields.length > 0) {
  console.error(`❌ Missing required fields in package.json: ${missingFields.join(', ')}`);
  process.exit(1);
}
console.log('✅ package.json has required fields');

// Check Theia extension configuration
const theiaExt = packageJson.theiaExtensions;
if (!Array.isArray(theiaExt) || theiaExt.length === 0) {
  console.error('❌ theiaExtensions must be a non-empty array');
  process.exit(1);
}

const ext = theiaExt[0];
if (!ext.frontend || !ext.backend) {
  console.error('❌ theiaExtensions must specify frontend and backend modules');
  process.exit(1);
}
console.log('✅ Theia extension configuration is valid');

// Check source structure
const srcPath = path.join(packageRoot, 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ src/ directory not found');
  process.exit(1);
}

const requiredDirs = ['browser', 'node', 'common'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(srcPath, dir)));

if (missingDirs.length > 0) {
  console.error(`❌ Missing source directories: ${missingDirs.join(', ')}`);
  process.exit(1);
}
console.log('✅ Source directory structure is valid');

// Check for frontend and backend modules
const frontendModulePath = path.join(srcPath, 'browser', 'ai-opencog-frontend-module.ts');
const backendModulePath = path.join(srcPath, 'node', 'ai-opencog-backend-module.ts');

if (!fs.existsSync(frontendModulePath)) {
  console.error('❌ Frontend module not found: ai-opencog-frontend-module.ts');
  process.exit(1);
}

if (!fs.existsSync(backendModulePath)) {
  console.error('❌ Backend module not found: ai-opencog-backend-module.ts');
  process.exit(1);
}
console.log('✅ Frontend and backend modules found');

// Check TypeScript configuration
const tsconfigPath = path.join(packageRoot, 'tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  console.error('❌ tsconfig.json not found');
  process.exit(1);
}

try {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.outDir) {
    console.error('❌ tsconfig.json missing outDir configuration');
    process.exit(1);
  }
  console.log('✅ TypeScript configuration is valid');
} catch (error) {
  console.error('❌ Invalid tsconfig.json:', error.message);
  process.exit(1);
}

// Check dependencies
const theiaCoreDeps = ['@theia/core', '@theia/ai-core'];
const missingDeps = theiaCoreDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.error(`❌ Missing required Theia dependencies: ${missingDeps.join(', ')}`);
  process.exit(1);
}
console.log('✅ Required Theia dependencies are present');

// Check for essential files
const essentialFiles = ['README.md', 'INSTALL.md'];
const missingFiles = essentialFiles.filter(file => !fs.existsSync(path.join(packageRoot, file)));

if (missingFiles.length > 0) {
  console.warn(`⚠️  Missing recommended files: ${missingFiles.join(', ')}`);
} else {
  console.log('✅ Essential documentation files present');
}

console.log('\n🎉 Package validation completed successfully!');
console.log('\nPackage Summary:');
console.log(`Name: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);
console.log(`Description: ${packageJson.description}`);
console.log(`License: ${packageJson.license}`);
console.log(`Frontend Module: ${ext.frontend}`);
console.log(`Backend Module: ${ext.backend}`);

console.log('\nNext Steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Build the package: npm run build');
console.log('3. Test in a Theia application');
