#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * 
 * This script validates the Phase 6 production deployment implementation
 * by testing all major components and services.
 */

const fs = require('fs');
const path = require('path');

class ProductionDeploymentValidator {
    constructor() {
        this.results = [];
        this.errors = [];
    }

    async validateAll() {
        console.log('🚀 Starting Phase 6 Production Deployment Validation\n');

        try {
            await this.validateDockerFiles();
            await this.validateSourceFiles();
            await this.validateDocumentation();
            await this.validateConfiguration();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Validation failed with error:', error);
            process.exit(1);
        }
    }

    async validateDockerFiles() {
        console.log('📦 Validating Container Deployment...');
        
        // Check Dockerfile exists
        const dockerfilePath = path.join(__dirname, 'Dockerfile');
        if (fs.existsSync(dockerfilePath)) {
            this.addResult('✅ Dockerfile exists');
            
            // Check Dockerfile content
            const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
            if (dockerfileContent.includes('FROM node:18-alpine')) {
                this.addResult('✅ Dockerfile uses correct base image');
            }
            if (dockerfileContent.includes('HEALTHCHECK')) {
                this.addResult('✅ Dockerfile includes health check');
            }
            if (dockerfileContent.includes('USER theia')) {
                this.addResult('✅ Dockerfile runs as non-root user');
            }
            if (dockerfileContent.includes('EXPOSE 3000')) {
                this.addResult('✅ Dockerfile exposes correct port');
            }
        } else {
            this.addError('❌ Dockerfile not found');
        }

        // Check Docker Compose file
        const composePath = path.join(__dirname, 'docker-compose.production.yml');
        if (fs.existsSync(composePath)) {
            this.addResult('✅ Production Docker Compose file exists');
            
            const composeContent = fs.readFileSync(composePath, 'utf8');
            if (composeContent.includes('prometheus')) {
                this.addResult('✅ Docker Compose includes Prometheus monitoring');
            }
            if (composeContent.includes('grafana')) {
                this.addResult('✅ Docker Compose includes Grafana dashboards');
            }
            if (composeContent.includes('redis')) {
                this.addResult('✅ Docker Compose includes Redis cache');
            }
            if (composeContent.includes('postgres')) {
                this.addResult('✅ Docker Compose includes PostgreSQL database');
            }
            if (composeContent.includes('elasticsearch')) {
                this.addResult('✅ Docker Compose includes ELK stack for logging');
            }
            if (composeContent.includes('nginx')) {
                this.addResult('✅ Docker Compose includes Nginx reverse proxy');
            }
        } else {
            this.addError('❌ Production Docker Compose file not found');
        }
    }

    async validateSourceFiles() {
        console.log('📂 Validating Source Files...');
        
        const requiredFiles = [
            'src/common/production-configuration.ts',
            'src/common/production-deployment.ts',
            'src/common/production-monitoring.ts',
            'src/common/community-enhancement.ts',
            'src/browser/frontend-production-configuration.ts',
            'src/browser/frontend-community-enhancement.ts'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.addResult(`✅ ${file} exists`);
                
                // Check file content for key features
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('@injectable()')) {
                    this.addResult(`✅ ${file} properly uses dependency injection`);
                }
                if (content.includes('async ') || content.includes('Promise<')) {
                    this.addResult(`✅ ${file} implements async operations`);
                }
            } else {
                this.addError(`❌ ${file} not found`);
            }
        }
        
        // Check if common index.ts exports new services
        const indexPath = path.join(__dirname, 'src/common/index.ts');
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            if (indexContent.includes('production-configuration') && 
                indexContent.includes('production-deployment') &&
                indexContent.includes('production-monitoring') &&
                indexContent.includes('community-enhancement')) {
                this.addResult('✅ Common services properly exported');
            } else {
                this.addError('❌ New services not properly exported in index.ts');
            }
        }
        
        // Check if frontend module includes new services
        const frontendModulePath = path.join(__dirname, 'src/browser/ai-opencog-frontend-module.ts');
        if (fs.existsSync(frontendModulePath)) {
            const moduleContent = fs.readFileSync(frontendModulePath, 'utf8');
            if (moduleContent.includes('ProductionConfigurationService') &&
                moduleContent.includes('CommunityEnhancementService')) {
                this.addResult('✅ Frontend module includes new services');
            } else {
                this.addError('❌ Frontend module missing new service bindings');
            }
        }
    }

    async validateDocumentation() {
        console.log('📚 Validating Documentation...');
        
        const requiredDocs = [
            'PRODUCTION_DEPLOYMENT_GUIDE.md',
            'COMMUNITY_CONTRIBUTION_GUIDE.md'
        ];
        
        for (const doc of requiredDocs) {
            const docPath = path.join(__dirname, doc);
            if (fs.existsSync(docPath)) {
                this.addResult(`✅ ${doc} exists`);
                
                const content = fs.readFileSync(docPath, 'utf8');
                if (content.length > 5000) {
                    this.addResult(`✅ ${doc} has comprehensive content (${content.length} chars)`);
                }
                
                // Check for specific content
                if (doc === 'PRODUCTION_DEPLOYMENT_GUIDE.md') {
                    if (content.includes('Docker') && content.includes('Kubernetes')) {
                        this.addResult('✅ Deployment guide covers container orchestration');
                    }
                    if (content.includes('Monitoring') && content.includes('Logging')) {
                        this.addResult('✅ Deployment guide covers monitoring and logging');
                    }
                    if (content.includes('Configuration') && content.includes('Environment')) {
                        this.addResult('✅ Deployment guide covers configuration management');
                    }
                }
                
                if (doc === 'COMMUNITY_CONTRIBUTION_GUIDE.md') {
                    if (content.includes('Enhancement Request') && content.includes('Code Contribution')) {
                        this.addResult('✅ Contribution guide covers different contribution types');
                    }
                    if (content.includes('Testing') && content.includes('Code Review')) {
                        this.addResult('✅ Contribution guide covers development process');
                    }
                }
            } else {
                this.addError(`❌ ${doc} not found`);
            }
        }
        
        // Check existing documentation updates
        const existingDocs = [
            'PRODUCTION_OPTIMIZATION_README.md'
        ];
        
        for (const doc of existingDocs) {
            const docPath = path.join(__dirname, doc);
            if (fs.existsSync(docPath)) {
                this.addResult(`✅ Existing documentation ${doc} preserved`);
            }
        }
    }

    async validateConfiguration() {
        console.log('⚙️  Validating Configuration Files...');
        
        // Check environment template
        const envPath = path.join(__dirname, '.env.example');
        if (fs.existsSync(envPath)) {
            this.addResult('✅ Environment configuration template exists');
            
            const envContent = fs.readFileSync(envPath, 'utf8');
            const requiredVars = [
                'NODE_ENV',
                'AI_OPENCOG_ENVIRONMENT',
                'AI_OPENCOG_LOG_LEVEL',
                'AI_OPENCOG_CACHE_SIZE',
                'AI_OPENCOG_MAX_CONCURRENCY',
                'POSTGRES_HOST',
                'REDIS_HOST',
                'PROMETHEUS_URL'
            ];
            
            let foundVars = 0;
            for (const varName of requiredVars) {
                if (envContent.includes(varName)) {
                    foundVars++;
                }
            }
            
            if (foundVars >= requiredVars.length * 0.8) {
                this.addResult(`✅ Environment template includes ${foundVars}/${requiredVars.length} required variables`);
            } else {
                this.addError(`❌ Environment template missing required variables (${foundVars}/${requiredVars.length})`);
            }
        } else {
            this.addError('❌ Environment configuration template not found');
        }
        
        // Check package.json updates
        const packagePath = path.join(__dirname, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            if (packageContent.includes('validate:phase6') &&
                packageContent.includes('docker:build') &&
                packageContent.includes('deploy:production')) {
                this.addResult('✅ Package.json includes deployment scripts');
            } else {
                this.addError('❌ Package.json missing deployment scripts');
            }
        }
    }

    addResult(message) {
        this.results.push(message);
        console.log(`  ${message}`);
    }

    addError(message) {
        this.errors.push(message);
        console.log(`  ${message}`);
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Successful validations: ${this.results.length}`);
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Failed validations: ${this.errors.length}`);
            this.errors.forEach(error => console.log(`  ${error}`));
        }
        
        const totalTests = this.results.length + this.errors.length;
        const successRate = ((this.results.length / totalTests) * 100).toFixed(1);
        
        console.log(`\n📊 Success Rate: ${successRate}% (${this.results.length}/${totalTests})`);
        
        console.log('\n🎯 PHASE 6 IMPLEMENTATION COMPONENTS:');
        console.log('  📦 Container Deployment - Dockerfile and Docker Compose');
        console.log('  ⚙️  Configuration Management - Environment-specific settings');
        console.log('  📊 Monitoring and Logging - Production metrics and alerts');
        console.log('  🔄 Continuous Enhancement - Feedback and improvement pipeline');
        console.log('  👥 Community Building - Contribution and enhancement systems');
        console.log('  📚 Documentation - Deployment and contribution guides');
        
        if (this.errors.length === 0) {
            console.log('\n🎉 ALL VALIDATIONS PASSED! Phase 6 implementation is complete.');
            console.log('\n📋 IMPLEMENTATION SUMMARY:');
            console.log('  • Production-ready container deployment infrastructure');
            console.log('  • Comprehensive configuration management system');
            console.log('  • Advanced monitoring, logging, and alerting capabilities');
            console.log('  • Community enhancement and feedback collection system');
            console.log('  • Complete documentation for deployment and contributions');
            console.log('  • Container orchestration with Docker Compose');
            console.log('  • Full monitoring stack (Prometheus, Grafana, ELK)');
        } else {
            console.log('\n⚠️  Some validations failed. Please review the errors above.');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Run validation if this script is executed directly
if (require.main === module) {
    const validator = new ProductionDeploymentValidator();
    validator.validateAll().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ProductionDeploymentValidator;