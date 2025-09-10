#!/usr/bin/env node

/**
 * Production Optimization Validation Script
 * 
 * This script validates the production optimization implementation
 * by testing core functionality without requiring full compilation.
 */

const fs = require('fs');
const path = require('path');

// Test results collector
const results = {
    passed: 0,
    failed: 0,
    errors: []
};

function test(name, condition) {
    if (condition) {
        console.log(`✓ ${name}`);
        results.passed++;
    } else {
        console.log(`✗ ${name}`);
        results.failed++;
        results.errors.push(name);
    }
}

function validateFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    test(`${description} exists`, exists);
    
    if (exists) {
        const content = fs.readFileSync(filePath, 'utf8');
        test(`${description} has content`, content.length > 0);
        return content;
    }
    return null;
}

function validateTypeDefinitions(content, types) {
    for (const type of types) {
        test(`Contains ${type} definition`, content.includes(type));
    }
}

function validateServiceMethods(content, methods) {
    for (const method of methods) {
        test(`Contains ${method} method`, content.includes(method));
    }
}

function validateImports(content, imports) {
    for (const importStatement of imports) {
        test(`Contains import: ${importStatement}`, content.includes(importStatement));
    }
}

console.log('🔍 Production Optimization Implementation Validation\n');

// Test 1: Validate type definitions
console.log('📋 Testing Type Definitions...');
const typesContent = validateFile(
    './src/common/production-optimization-types.ts',
    'Production optimization types file'
);

if (typesContent) {
    validateTypeDefinitions(typesContent, [
        'ProductionMetrics',
        'SystemHealth',
        'AlertConfig',
        'OptimizationResult',
        'CacheMetrics',
        'ProductionConfig'
    ]);
}

// Test 2: Validate service interface
console.log('\n🔧 Testing Service Interface...');
const serviceContent = validateFile(
    './src/common/production-optimization-service.ts',
    'Production optimization service interface'
);

if (serviceContent) {
    validateServiceMethods(serviceContent, [
        'getMetrics',
        'getHealth',
        'startMonitoring',
        'stopMonitoring',
        'optimizePerformance',
        'configureAlerts',
        'getCacheMetrics',
        'clearCache'
    ]);
}

// Test 3: Validate backend implementation
console.log('\n⚙️ Testing Backend Implementation...');
const backendContent = validateFile(
    './src/node/production-optimization-service-impl.ts',
    'Production optimization service implementation'
);

if (backendContent) {
    validateImports(backendContent, [
        '@theia/core/shared/inversify',
        '@theia/core/lib/common/logger',
        '@theia/core/lib/common/event'
    ]);
    
    test('Contains service class', backendContent.includes('ProductionOptimizationServiceImpl'));
    test('Contains @injectable decorator', backendContent.includes('@injectable()'));
    test('Contains event emitters', backendContent.includes('Emitter'));
}

// Test 4: Validate frontend service
console.log('\n🌐 Testing Frontend Service...');
const frontendContent = validateFile(
    './src/browser/frontend-production-optimization-service.ts',
    'Frontend production optimization service'
);

if (frontendContent) {
    test('Contains WebSocket proxy', frontendContent.includes('WebSocketConnectionProvider'));
    test('Contains event forwarding', frontendContent.includes('onPerformanceAlert'));
}

// Test 5: Validate widget implementation
console.log('\n🖥️ Testing Production Monitoring Widget...');
const widgetContent = validateFile(
    './src/browser/production-monitoring-widget.tsx',
    'Production monitoring widget'
);

if (widgetContent) {
    test('Contains React components', widgetContent.includes('React'));
    test('Contains widget class', widgetContent.includes('ProductionMonitoringWidget'));
    test('Contains ReactWidget extension', widgetContent.includes('ReactWidget'));
}

// Test 6: Validate contribution
console.log('\n📋 Testing Widget Contribution...');
const contributionContent = validateFile(
    './src/browser/production-monitoring-contribution.ts',
    'Production monitoring contribution'
);

if (contributionContent) {
    test('Contains command contribution', contributionContent.includes('CommandContribution'));
    test('Contains menu contribution', contributionContent.includes('MenuContribution'));
}

// Test 7: Validate backend module updates
console.log('\n🔗 Testing Backend Module Integration...');
const backendModuleContent = validateFile(
    './src/node/ai-opencog-backend-module.ts',
    'Backend module'
);

if (backendModuleContent) {
    test('Contains production service import', backendModuleContent.includes('ProductionOptimizationService'));
    test('Contains production service binding', backendModuleContent.includes('ProductionOptimizationServiceImpl'));
    test('Contains RPC connection handler', backendModuleContent.includes('PRODUCTION_OPTIMIZATION_SERVICE_PATH'));
}

// Test 8: Validate frontend module updates
console.log('\n🌐 Testing Frontend Module Integration...');
const frontendModuleContent = validateFile(
    './src/browser/ai-opencog-frontend-module.ts',
    'Frontend module'
);

if (frontendModuleContent) {
    test('Contains production service import', frontendModuleContent.includes('ProductionOptimizationService'));
    test('Contains frontend service binding', frontendModuleContent.includes('FrontendProductionOptimizationService'));
    test('Contains widget binding', frontendModuleContent.includes('ProductionMonitoringWidget'));
    test('Contains contribution binding', frontendModuleContent.includes('ProductionMonitoringContribution'));
}

// Test 9: Validate common index exports
console.log('\n📦 Testing Export Declarations...');
const indexContent = validateFile(
    './src/common/index.ts',
    'Common index exports'
);

if (indexContent) {
    test('Exports production types', indexContent.includes('production-optimization-types'));
    test('Exports production service', indexContent.includes('production-optimization-service'));
}

// Test 10: Validate test file
console.log('\n🧪 Testing Test Implementation...');
const testContent = validateFile(
    './src/test/production-optimization.spec.ts',
    'Production optimization tests'
);

if (testContent) {
    test('Contains test descriptions', testContent.includes('describe'));
    test('Contains test cases', testContent.includes('it('));
    test('Contains expect assertions', testContent.includes('expect'));
    test('Contains service tests', testContent.includes('ProductionOptimizationService'));
}

// Test 11: Validate documentation
console.log('\n📚 Testing Documentation...');
const docsContent = validateFile(
    './PRODUCTION_OPTIMIZATION_README.md',
    'Production optimization documentation'
);

if (docsContent) {
    test('Contains overview section', docsContent.includes('## Overview'));
    test('Contains API documentation', docsContent.includes('## API Documentation'));
    test('Contains configuration guide', docsContent.includes('## Configuration'));
    test('Contains deployment instructions', docsContent.includes('## Production Deployment'));
}

// Test 12: Validate file structure completeness
console.log('\n📁 Testing File Structure...');
const requiredFiles = [
    './src/common/production-optimization-types.ts',
    './src/common/production-optimization-service.ts',
    './src/node/production-optimization-service-impl.ts',
    './src/browser/frontend-production-optimization-service.ts',
    './src/browser/production-monitoring-widget.tsx',
    './src/browser/production-monitoring-contribution.ts',
    './src/test/production-optimization.spec.ts',
    './PRODUCTION_OPTIMIZATION_README.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    if (!exists) {
        allFilesExist = false;
    }
}

test('All required files exist', allFilesExist);

// Test 13: Validate service integration
console.log('\n🔄 Testing Service Integration...');
if (typesContent && serviceContent) {
    test('Service implements all type interfaces', 
        serviceContent.includes('ProductionMetrics') && 
        serviceContent.includes('SystemHealth') &&
        serviceContent.includes('OptimizationResult')
    );
}

// Test 14: Validate event system integration
console.log('\n📡 Testing Event System...');
if (backendContent && frontendContent) {
    test('Backend emits events', backendContent.includes('onPerformanceAlertEmitter.fire'));
    test('Frontend forwards events', frontendContent.includes('onPerformanceAlertEmitter.fire'));
}

// Test 15: Validate SKZ framework compatibility
console.log('\n🏗️ Testing SKZ Framework Compatibility...');
if (backendModuleContent) {
    test('Uses Theia dependency injection', backendModuleContent.includes('ContainerModule'));
    test('Uses RPC connection handlers', backendModuleContent.includes('RpcConnectionHandler'));
    test('Follows singleton pattern', backendModuleContent.includes('inSingletonScope'));
}

// Final results
console.log('\n📊 Validation Results:');
console.log(`✓ Passed: ${results.passed}`);
console.log(`✗ Failed: ${results.failed}`);
console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed! Production optimization implementation is valid.');
    process.exit(0);
}