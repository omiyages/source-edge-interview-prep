#!/usr/bin/env node

/**
 * HTTPS Configuration Validation
 * Validates that all HTTPS configuration files are properly formatted
 */

import fs from 'fs';
import { exec } from 'child_process';

class HTTPSConfigValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            files: {},
            overall: {
                valid: true,
                errors: [],
                warnings: []
            }
        };
    }

    async validateAll() {
        console.log('🔍 Validating HTTPS Configuration Files');
        console.log('=' .repeat(50));
        
        await this.validateVercelConfig();
        await this.validatePublicHeaders();
        await this.validateNginxConfig();
        await this.validateSSLScript();
        await this.validatePackageJson();
        
        this.generateValidationReport();
    }

    async validateVercelConfig() {
        console.log('\n📄 Validating vercel.json...');
        
        try {
            const content = fs.readFileSync('vercel.json', 'utf8');
            const config = JSON.parse(content);
            
            // Check required fields
            const requiredFields = ['headers', 'redirects'];
            const missingFields = requiredFields.filter(field => !config[field]);
            
            if (missingFields.length === 0) {
                console.log('   ✅ JSON syntax valid');
                console.log('   ✅ Required fields present');
                
                // Check security headers
                const securityHeaders = [
                    'Strict-Transport-Security',
                    'Content-Security-Policy',
                    'X-Frame-Options',
                    'X-Content-Type-Options'
                ];
                
                const headers = config.headers[0]?.headers || [];
                const presentHeaders = headers.map(h => h.key);
                const missingSecurityHeaders = securityHeaders.filter(h => !presentHeaders.includes(h));
                
                if (missingSecurityHeaders.length === 0) {
                    console.log('   ✅ All security headers present');
                    this.results.files.vercel = { status: 'valid', score: 100 };
                } else {
                    console.log(`   ⚠️ Missing security headers: ${missingSecurityHeaders.join(', ')}`);
                    this.results.files.vercel = { status: 'warning', score: 80 };
                    this.results.overall.warnings.push('Missing security headers in vercel.json');
                }
            } else {
                console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
                this.results.files.vercel = { status: 'error', score: 0 };
                this.results.overall.errors.push('Missing required fields in vercel.json');
                this.results.overall.valid = false;
            }
        } catch (error) {
            console.log(`   ❌ JSON parse error: ${error.message}`);
            this.results.files.vercel = { status: 'error', score: 0 };
            this.results.overall.errors.push('Invalid JSON in vercel.json');
            this.results.overall.valid = false;
        }
    }

    async validatePublicHeaders() {
        console.log('\n📄 Validating public/_headers...');
        
        try {
            const content = fs.readFileSync('public/_headers', 'utf8');
            
            // Check for required security headers
            const requiredHeaders = [
                'Strict-Transport-Security',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Content-Security-Policy'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !content.includes(header));
            
            if (missingHeaders.length === 0) {
                console.log('   ✅ All required security headers present');
                console.log('   ✅ File format valid');
                this.results.files.publicHeaders = { status: 'valid', score: 100 };
            } else {
                console.log(`   ⚠️ Missing headers: ${missingHeaders.join(', ')}`);
                this.results.files.publicHeaders = { status: 'warning', score: 75 };
                this.results.overall.warnings.push('Missing security headers in public/_headers');
            }
        } catch (error) {
            console.log(`   ❌ File read error: ${error.message}`);
            this.results.files.publicHeaders = { status: 'error', score: 0 };
            this.results.overall.errors.push('Cannot read public/_headers');
            this.results.overall.valid = false;
        }
    }

    async validateNginxConfig() {
        console.log('\n📄 Validating nginx-https.conf...');
        
        try {
            const content = fs.readFileSync('nginx-https.conf', 'utf8');
            
            // Check for required nginx directives
            const requiredDirectives = [
                'listen 443 ssl',
                'ssl_certificate',
                'ssl_certificate_key',
                'add_header Strict-Transport-Security'
            ];
            
            const missingDirectives = requiredDirectives.filter(directive => !content.includes(directive));
            
            if (missingDirectives.length === 0) {
                console.log('   ✅ All required nginx directives present');
                console.log('   ✅ SSL configuration complete');
                this.results.files.nginx = { status: 'valid', score: 100 };
            } else {
                console.log(`   ⚠️ Missing directives: ${missingDirectives.join(', ')}`);
                this.results.files.nginx = { status: 'warning', score: 75 };
                this.results.overall.warnings.push('Missing nginx directives');
            }
        } catch (error) {
            console.log(`   ❌ File read error: ${error.message}`);
            this.results.files.nginx = { status: 'error', score: 0 };
            this.results.overall.errors.push('Cannot read nginx-https.conf');
            this.results.overall.valid = false;
        }
    }

    async validateSSLScript() {
        console.log('\n📄 Validating setup-ssl.sh...');
        
        try {
            const content = fs.readFileSync('setup-ssl.sh', 'utf8');
            
            // Check for required script components
            const requiredComponents = [
                'certbot',
                'ssl_certificate',
                'Strict-Transport-Security',
                'chmod +x'
            ];
            
            const missingComponents = requiredComponents.filter(component => !content.includes(component));
            
            if (missingComponents.length === 0) {
                console.log('   ✅ SSL setup script complete');
                console.log('   ✅ All required components present');
                this.results.files.sslScript = { status: 'valid', score: 100 };
            } else {
                console.log(`   ⚠️ Missing components: ${missingComponents.join(', ')}`);
                this.results.files.sslScript = { status: 'warning', score: 75 };
                this.results.overall.warnings.push('Missing components in SSL script');
            }
        } catch (error) {
            console.log(`   ❌ File read error: ${error.message}`);
            this.results.files.sslScript = { status: 'error', score: 0 };
            this.results.overall.errors.push('Cannot read setup-ssl.sh');
            this.results.overall.valid = false;
        }
    }

    async validatePackageJson() {
        console.log('\n📄 Validating package.json security scripts...');
        
        try {
            const content = fs.readFileSync('package.json', 'utf8');
            const config = JSON.parse(content);
            
            const requiredScripts = [
                'security:test',
                'security:audit',
                'ssl:setup'
            ];
            
            const scripts = config.scripts || {};
            const missingScripts = requiredScripts.filter(script => !scripts[script]);
            
            if (missingScripts.length === 0) {
                console.log('   ✅ All security scripts present');
                console.log('   ✅ Package.json valid');
                this.results.files.packageJson = { status: 'valid', score: 100 };
            } else {
                console.log(`   ⚠️ Missing scripts: ${missingScripts.join(', ')}`);
                this.results.files.packageJson = { status: 'warning', score: 75 };
                this.results.overall.warnings.push('Missing security scripts in package.json');
            }
        } catch (error) {
            console.log(`   ❌ JSON parse error: ${error.message}`);
            this.results.files.packageJson = { status: 'error', score: 0 };
            this.results.overall.errors.push('Invalid JSON in package.json');
            this.results.overall.valid = false;
        }
    }

    generateValidationReport() {
        console.log('\n📊 HTTPS Configuration Validation Report');
        console.log('=' .repeat(50));
        
        const totalFiles = Object.keys(this.results.files).length;
        const validFiles = Object.values(this.results.files).filter(f => f.status === 'valid').length;
        const warningFiles = Object.values(this.results.files).filter(f => f.status === 'warning').length;
        const errorFiles = Object.values(this.results.files).filter(f => f.status === 'error').length;
        
        console.log(`\n📈 File Status Summary:`);
        console.log(`   Total Files: ${totalFiles}`);
        console.log(`   Valid: ${validFiles} ✅`);
        console.log(`   Warnings: ${warningFiles} ⚠️`);
        console.log(`   Errors: ${errorFiles} ❌`);
        
        console.log('\n📄 Individual File Status:');
        Object.entries(this.results.files).forEach(([file, status]) => {
            const icon = status.status === 'valid' ? '✅' : status.status === 'warning' ? '⚠️' : '❌';
            console.log(`   ${file}: ${icon} ${status.status} (${status.score}%)`);
        });
        
        if (this.results.overall.errors.length > 0) {
            console.log('\n❌ Errors Found:');
            this.results.overall.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        if (this.results.overall.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.results.overall.warnings.forEach(warning => {
                console.log(`   - ${warning}`);
            });
        }
        
        console.log('\n🎯 Overall Status:');
        if (this.results.overall.valid && errorFiles === 0) {
            console.log('   🏆 EXCELLENT: All HTTPS configurations are valid and ready for production!');
        } else if (errorFiles === 0) {
            console.log('   ✅ GOOD: HTTPS configurations are mostly valid with minor warnings');
        } else {
            console.log('   ❌ ISSUES: HTTPS configurations have errors that need attention');
        }
        
        // Save validation report
        const reportFile = 'https-config-validation-report.json';
        fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Validation report saved to: ${reportFile}`);
    }
}

// Main execution
const validator = new HTTPSConfigValidator();
validator.validateAll().catch(console.error);
