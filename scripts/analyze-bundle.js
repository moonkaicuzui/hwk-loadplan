#!/usr/bin/env node
/**
 * Bundle Size Analyzer
 * ====================
 *
 * Analyzes file sizes for the Rachgia Dashboard project.
 * Helps identify opportunities for optimization.
 *
 * Run: node scripts/analyze-bundle.js
 *
 * @version 19.0.0
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');

console.log('📦 Bundle Size Analysis for Rachgia Dashboard v19\n');
console.log('='.repeat(60));

// Files to analyze
const filesToAnalyze = [
    'rachgia_dashboard_v19.html',
    'rachgia_data_v8.js',
    'rachgia_v18_improvements.js',
    'src/i18n.js',
    'src/keyboard-shortcuts.js',
    'src/notifications.js',
    'src/models/OrderModel.js',
    'src/models/FilterModel.js',
    'locales/ko.json',
    'locales/en.json',
    'locales/vi.json',
    'manifest.json',
    'sw.js'
];

const results = [];
let totalSize = 0;
let totalGzipSize = 0;

console.log('\n📊 File Analysis:\n');
console.log('File'.padEnd(45) + 'Size'.padStart(12) + 'Gzip'.padStart(12) + 'Ratio'.padStart(10));
console.log('-'.repeat(79));

filesToAnalyze.forEach(file => {
    const filePath = path.join(projectRoot, file);

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const size = Buffer.byteLength(content, 'utf8');
        const gzipSize = zlib.gzipSync(content).length;
        const ratio = ((1 - gzipSize / size) * 100).toFixed(1);

        results.push({
            file,
            size,
            gzipSize,
            ratio: parseFloat(ratio)
        });

        totalSize += size;
        totalGzipSize += gzipSize;

        const sizeStr = formatBytes(size);
        const gzipStr = formatBytes(gzipSize);

        console.log(
            file.padEnd(45) +
            sizeStr.padStart(12) +
            gzipStr.padStart(12) +
            `${ratio}%`.padStart(10)
        );
    } else {
        console.log(file.padEnd(45) + '(not found)'.padStart(12));
    }
});

console.log('-'.repeat(79));
console.log(
    'TOTAL'.padEnd(45) +
    formatBytes(totalSize).padStart(12) +
    formatBytes(totalGzipSize).padStart(12) +
    `${((1 - totalGzipSize / totalSize) * 100).toFixed(1)}%`.padStart(10)
);

// Sort by size for recommendations
const sortedBySize = [...results].sort((a, b) => b.size - a.size);

console.log('\n📈 Largest Files (by raw size):\n');
sortedBySize.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.file}: ${formatBytes(item.size)}`);
});

// Analyze HTML inline scripts
const htmlPath = path.join(projectRoot, 'rachgia_dashboard_v19.html');
if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Count inline script size
    const scriptRegex = /<script[^>]*>([^<]*)<\/script>/gi;
    let inlineScriptSize = 0;
    let scriptCount = 0;

    let match;
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        if (!/<script[^>]*src/i.test(match[0])) {
            inlineScriptSize += match[1].length;
            scriptCount++;
        }
    }

    // Count inline style size
    const styleRegex = /<style[^>]*>([^<]*)<\/style>/gi;
    let inlineStyleSize = 0;
    let styleCount = 0;

    while ((match = styleRegex.exec(htmlContent)) !== null) {
        inlineStyleSize += match[1].length;
        styleCount++;
    }

    console.log('\n📊 HTML Internal Analysis:\n');
    console.log(`Inline Scripts: ${scriptCount} blocks, ${formatBytes(inlineScriptSize)}`);
    console.log(`Inline Styles: ${styleCount} blocks, ${formatBytes(inlineStyleSize)}`);
    console.log(`Total Lines: ${htmlContent.split('\n').length}`);
}

// Performance recommendations
console.log('\n💡 Optimization Recommendations:\n');

const recommendations = [];

if (totalSize > 5 * 1024 * 1024) {
    recommendations.push('⚠️ Total bundle size exceeds 5MB. Consider code splitting.');
}

sortedBySize.forEach(item => {
    if (item.size > 1 * 1024 * 1024) {
        recommendations.push(`⚠️ ${item.file} is over 1MB. Consider splitting or lazy loading.`);
    }

    if (item.ratio < 50 && item.size > 10000) {
        recommendations.push(`💡 ${item.file} has low compression ratio (${item.ratio}%). May be already minified.`);
    }

    if (item.file.endsWith('.js') && item.ratio > 70) {
        recommendations.push(`✅ ${item.file} compresses well (${item.ratio}% reduction with gzip).`);
    }
});

if (recommendations.length === 0) {
    recommendations.push('✅ Bundle sizes look good! No immediate optimizations needed.');
}

recommendations.forEach(r => console.log(`   ${r}`));

// Gzip benefit summary
console.log('\n📊 Gzip Benefit Summary:\n');
console.log(`   Raw Total: ${formatBytes(totalSize)}`);
console.log(`   Gzipped Total: ${formatBytes(totalGzipSize)}`);
console.log(`   Savings: ${formatBytes(totalSize - totalGzipSize)} (${((1 - totalGzipSize / totalSize) * 100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(60));
console.log('Analysis complete!\n');

// Helper function
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
