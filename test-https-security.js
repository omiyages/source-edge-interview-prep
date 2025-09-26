#!/usr/bin/env node

/**
 * HTTPS Security Test Script
 * Tests various HTTPS security configurations and provides recommendations
 */

import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import fs from 'fs';

class HTTPSecurityTester {
    constructor(domain) {
        this.domain = domain;
        this.results = {
            https: false,
            hsts: false,
            securityHeaders: {},
            sslGrade: 'Unknown',
            vulnerabilities: [],
            recommendations: []
        };
    }

    async runTests() {
        console.log(`🔒 Testing HTTPS security for ${this.domain}`);
        
        await this.testHTTPSRedirect();
        await this.testSecurityHeaders();
        await this.testSSLConfiguration();
        await this.testSSLLabs();
        
        this.generateReport();
    }

    async testHTTPSRedirect() {
        return new Promise((resolve) => {
            const options = {
                hostname: this.domain,
                port: 80,
                path: '/',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    const location = res.headers.location;
                    if (location && location.startsWith('https://')) {
                        console.log('✅ HTTP to HTTPS redirect working');
                        this.results.https = true;
                    } else {
                        console.log('❌ HTTP redirect not pointing to HTTPS');
                        this.results.vulnerabilities.push('HTTP redirect not secure');
                    }
                } else {
                    console.log('❌ No HTTP to HTTPS redirect');
                    this.results.vulnerabilities.push('No HTTP to HTTPS redirect');
                }
                resolve();
            });

            req.on('error', (err) => {
                console.log('❌ HTTP connection failed:', err.message);
                this.results.vulnerabilities.push('HTTP connection failed');
                resolve();
            });

            req.on('timeout', () => {
                console.log('❌ HTTP request timeout');
                this.results.vulnerabilities.push('HTTP request timeout');
                resolve();
            });

            req.end();
        });
    }

    async testSecurityHeaders() {
        return new Promise((resolve) => {
            const options = {
                hostname: this.domain,
                port: 443,
                path: '/',
                method: 'GET',
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                const headers = res.headers;
                
                // Test HSTS
                if (headers['strict-transport-security']) {
                    console.log('✅ HSTS header present');
                    this.results.hsts = true;
                } else {
                    console.log('❌ HSTS header missing');
                    this.results.vulnerabilities.push('Missing HSTS header');
                }

                // Test other security headers
                const securityHeaders = {
                    'x-frame-options': 'X-Frame-Options',
                    'x-content-type-options': 'X-Content-Type-Options',
                    'x-xss-protection': 'X-XSS-Protection',
                    'referrer-policy': 'Referrer-Policy',
                    'content-security-policy': 'Content-Security-Policy',
                    'permissions-policy': 'Permissions-Policy'
                };

                Object.entries(securityHeaders).forEach(([header, name]) => {
                    if (headers[header]) {
                        console.log(`✅ ${name} header present`);
                        this.results.securityHeaders[header] = headers[header];
                    } else {
                        console.log(`❌ ${name} header missing`);
                        this.results.vulnerabilities.push(`Missing ${name} header`);
                    }
                });

                resolve();
            });

            req.on('error', (err) => {
                console.log('❌ HTTPS connection failed:', err.message);
                this.results.vulnerabilities.push('HTTPS connection failed');
                resolve();
            });

            req.end();
        });
    }

    async testSSLConfiguration() {
        return new Promise((resolve) => {
            const options = {
                hostname: this.domain,
                port: 443,
                path: '/',
                method: 'GET',
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                const socket = req.socket;
                const tlsVersion = socket.getProtocol();
                const cipher = socket.getCipher();
                
                console.log(`🔐 TLS Version: ${tlsVersion}`);
                console.log(`🔐 Cipher: ${cipher.name}`);
                
                if (tlsVersion === 'TLSv1.3' || tlsVersion === 'TLSv1.2') {
                    console.log('✅ Modern TLS version');
                } else {
                    console.log('❌ Outdated TLS version');
                    this.results.vulnerabilities.push('Outdated TLS version');
                }

                resolve();
            });

            req.on('error', (err) => {
                console.log('❌ SSL test failed:', err.message);
                this.results.vulnerabilities.push('SSL test failed');
                resolve();
            });

            req.end();
        });
    }

    async testSSLLabs() {
        return new Promise((resolve) => {
            // Note: SSL Labs API has rate limits, so this is a placeholder
            console.log('📊 SSL Labs test (requires API key for automated testing)');
            console.log('   Manual test: https://www.ssllabs.com/ssltest/analyze.html?d=' + this.domain);
            resolve();
        });
    }

    generateReport() {
        console.log('\n📊 HTTPS Security Report');
        console.log('========================');
        
        console.log(`\n🔒 HTTPS Status: ${this.results.https ? '✅ Enabled' : '❌ Not Enabled'}`);
        console.log(`🛡️ HSTS Status: ${this.results.hsts ? '✅ Enabled' : '❌ Not Enabled'}`);
        
        console.log('\n🔐 Security Headers:');
        Object.entries(this.results.securityHeaders).forEach(([header, value]) => {
            console.log(`   ${header}: ${value.substring(0, 50)}...`);
        });
        
        if (this.results.vulnerabilities.length > 0) {
            console.log('\n⚠️ Vulnerabilities Found:');
            this.results.vulnerabilities.forEach(vuln => {
                console.log(`   - ${vuln}`);
            });
        }
        
        console.log('\n💡 Recommendations:');
        this.generateRecommendations();
        this.results.recommendations.forEach(rec => {
            console.log(`   - ${rec}`);
        });
        
        // Save report to file
        const report = {
            domain: this.domain,
            timestamp: new Date().toISOString(),
            results: this.results
        };
        
        fs.writeFileSync(`https-security-report-${this.domain}.json`, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: https-security-report-${this.domain}.json`);
    }

    generateRecommendations() {
        if (!this.results.https) {
            this.results.recommendations.push('Implement HTTP to HTTPS redirect');
        }
        
        if (!this.results.hsts) {
            this.results.recommendations.push('Add Strict-Transport-Security header');
        }
        
        if (!this.results.securityHeaders['x-frame-options']) {
            this.results.recommendations.push('Add X-Frame-Options header to prevent clickjacking');
        }
        
        if (!this.results.securityHeaders['content-security-policy']) {
            this.results.recommendations.push('Add Content-Security-Policy header');
        }
        
        if (this.results.vulnerabilities.length > 0) {
            this.results.recommendations.push('Review and fix all identified vulnerabilities');
        }
        
        this.results.recommendations.push('Test SSL configuration with SSL Labs');
        this.results.recommendations.push('Set up SSL certificate monitoring');
        this.results.recommendations.push('Regular security audits and updates');
    }
}

// Main execution
const domain = process.argv[2] || 'localhost';
const tester = new HTTPSecurityTester(domain);
tester.runTests().catch(console.error);
