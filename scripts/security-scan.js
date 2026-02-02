#!/usr/bin/env node
/**
 * Security Scan Script
 * ====================
 *
 * Scans JavaScript files for potential security issues.
 * Run: node scripts/security-scan.js
 *
 * @version 19.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔒 Security Scan for Rachgia Dashboard v19\n');
console.log('='.repeat(60));

const issues = [];
const warnings = [];
const passed = [];

// Patterns to check
const patterns = {
  // Critical
  evalUsage: /\beval\s*\(/g,
  functionConstructor: /\bnew\s+Function\s*\(/g,
  innerHTML: /\.innerHTML\s*=(?!\s*['"`]<)/g,
  documentWrite: /document\.write\s*\(/g,

  // High
  hardcodedSecrets: /(api[_-]?key|secret|password|token)\s*[=:]\s*['"][^'"]+['"]/gi,
  dangerousProtocol: /javascript:/gi,
  xssVectors: /on(click|load|error|mouseover)\s*=/gi,

  // Medium
  httpUrls: /http:\/\/(?!localhost|127\.0\.0\.1)/g,
  consoleLog: /console\.(log|debug|info)\s*\(/g,
  alertUsage: /\balert\s*\(/g,
};

// Files to scan
const filesToScan = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (['node_modules', 'archive', 'dist', '.git', 'coverage'].includes(file)) {
        continue;
      }
      walkDir(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      filesToScan.push(filePath);
    }
  }
}

walkDir(projectRoot);

console.log(`\n📁 Scanning ${filesToScan.length} files...\n`);

// Scan each file
for (const filePath of filesToScan) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);
  const lines = content.split('\n');

  // Check each pattern
  for (const [name, pattern] of Object.entries(patterns)) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      let charCount = 0;
      let lineNum = 1;
      for (const line of lines) {
        charCount += line.length + 1;
        if (charCount > match.index) break;
        lineNum++;
      }

      const severity = getSeverity(name);
      const issue = {
        file: relativePath,
        line: lineNum,
        pattern: name,
        match: match[0].substring(0, 50),
        severity,
      };

      if (severity === 'critical' || severity === 'high') {
        issues.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }
}

function getSeverity(pattern) {
  const critical = ['evalUsage', 'functionConstructor'];
  const high = ['innerHTML', 'documentWrite', 'hardcodedSecrets', 'dangerousProtocol', 'xssVectors'];

  if (critical.includes(pattern)) return 'critical';
  if (high.includes(pattern)) return 'high';
  return 'medium';
}

// Additional checks
const htmlFiles = filesToScan.filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(projectRoot, file);

  // Check for missing security headers hints
  if (!content.includes('Content-Security-Policy')) {
    warnings.push({
      file: relativePath,
      line: 1,
      pattern: 'missingCSP',
      match: 'No CSP meta tag found',
      severity: 'medium',
    });
  }

  // Check for external scripts without integrity
  const scriptMatches = content.match(/<script[^>]*src=["'][^"']+["'][^>]*>/gi) || [];
  for (const script of scriptMatches) {
    if (script.includes('cdn') && !script.includes('integrity=')) {
      warnings.push({
        file: relativePath,
        line: 1,
        pattern: 'missingIntegrity',
        match: script.substring(0, 50),
        severity: 'medium',
      });
    }
  }
}

// Check for escapeHtml usage
let escapeHtmlFound = false;
for (const file of filesToScan) {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('escapeHtml')) {
      escapeHtmlFound = true;
      break;
    }
  }
}
if (escapeHtmlFound) {
  passed.push('✅ escapeHtml function is used for XSS prevention');
}

// Output results
console.log('='.repeat(60));
console.log('📊 RESULTS\n');

if (issues.length > 0) {
  console.log(`\n🚨 CRITICAL/HIGH ISSUES (${issues.length}):\n`);
  for (const issue of issues) {
    const icon = issue.severity === 'critical' ? '🔴' : '🟠';
    console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
    console.log(`   Pattern: ${issue.pattern}`);
    console.log(`   Match: ${issue.match}...\n`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️ WARNINGS (${warnings.length}):\n`);
  // Group by pattern
  const grouped = {};
  for (const w of warnings) {
    if (!grouped[w.pattern]) grouped[w.pattern] = [];
    grouped[w.pattern].push(w);
  }

  for (const [pattern, items] of Object.entries(grouped)) {
    console.log(`   ${pattern}: ${items.length} occurrences`);
    if (items.length <= 3) {
      for (const item of items) {
        console.log(`      - ${item.file}:${item.line}`);
      }
    }
  }
}

if (passed.length > 0) {
  console.log(`\n✅ PASSED (${passed.length}):`);
  for (const p of passed) {
    console.log(`   ${p}`);
  }
}

console.log('\n' + '='.repeat(60));

// Summary
const total = issues.length + warnings.length + passed.length;
const score = Math.round(((passed.length + warnings.length * 0.5) / Math.max(total, 1)) * 100);

console.log(`\n📈 SECURITY SCORE: ${score}%`);
console.log(`   Critical/High Issues: ${issues.length}`);
console.log(`   Warnings: ${warnings.length}`);
console.log(`   Passed: ${passed.length}`);

if (issues.length > 0) {
  console.log('\n⚠️ Please review and fix critical/high issues before deployment.');
  process.exit(1);
} else {
  console.log('\n✅ No critical security issues found!');
  process.exit(0);
}
