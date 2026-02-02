#!/usr/bin/env node
/**
 * Accessibility Check Script
 * ==========================
 *
 * Validates HTML accessibility attributes in the dashboard.
 * Run: node scripts/check-accessibility.js
 *
 * @version 19.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFile = path.join(__dirname, '..', 'rachgia_dashboard_v19.html');

console.log('🔍 Accessibility Check for Rachgia Dashboard v19\n');
console.log('='.repeat(50));

// Read HTML file
let html;
try {
    html = fs.readFileSync(htmlFile, 'utf8');
    console.log(`✅ File loaded: ${htmlFile}`);
} catch (err) {
    console.error(`❌ Error reading file: ${err.message}`);
    process.exit(1);
}

const issues = [];
const warnings = [];
const passed = [];

// Check 1: Images have alt attributes
const imgRegex = /<img[^>]*>/gi;
const imgMatches = html.match(imgRegex) || [];
let imgsWithAlt = 0;
let imgsWithoutAlt = 0;

imgMatches.forEach(img => {
    if (/alt\s*=/i.test(img)) {
        imgsWithAlt++;
    } else {
        imgsWithoutAlt++;
        issues.push(`Image missing alt attribute: ${img.substring(0, 80)}...`);
    }
});

if (imgsWithoutAlt === 0) {
    passed.push(`✅ All ${imgsWithAlt} images have alt attributes`);
} else {
    issues.push(`❌ ${imgsWithoutAlt}/${imgMatches.length} images missing alt`);
}

// Check 2: Buttons have accessible names
const buttonRegex = /<button[^>]*>([^<]*)<\/button>/gi;
const buttonMatches = [...html.matchAll(buttonRegex)];
let buttonsWithText = 0;
let buttonsWithoutText = 0;

buttonMatches.forEach(match => {
    const btnTag = match[0];
    const btnText = match[1].trim();

    // Check for text content or aria-label
    if (btnText || /aria-label\s*=/i.test(btnTag) || /title\s*=/i.test(btnTag)) {
        buttonsWithText++;
    } else {
        buttonsWithoutText++;
        warnings.push(`Button may lack accessible name: ${btnTag.substring(0, 80)}`);
    }
});

if (buttonsWithoutText === 0) {
    passed.push(`✅ All ${buttonsWithText} buttons have accessible names`);
} else {
    warnings.push(`⚠️ ${buttonsWithoutText} buttons may lack accessible names`);
}

// Check 3: Form inputs have labels
const inputRegex = /<input[^>]*>/gi;
const inputMatches = html.match(inputRegex) || [];
let inputsWithLabel = 0;
let inputsWithoutLabel = 0;

// Check if input is inside a <label> element
function isInputInsideLabel(inputMatch, fullHtml) {
    const inputPos = fullHtml.indexOf(inputMatch);
    if (inputPos === -1) return false;

    // Look backwards for <label> that hasn't been closed
    const beforeInput = fullHtml.substring(Math.max(0, inputPos - 500), inputPos);
    const lastLabelOpen = beforeInput.lastIndexOf('<label');
    const lastLabelClose = beforeInput.lastIndexOf('</label');

    return lastLabelOpen > lastLabelClose;
}

inputMatches.forEach(input => {
    // Check for id to match label, or aria-label, or aria-labelledby, or inside <label>
    if (/id\s*=/i.test(input) ||
        /aria-label\s*=/i.test(input) ||
        /aria-labelledby\s*=/i.test(input) ||
        /placeholder\s*=/i.test(input) ||
        /sr-only/i.test(input) ||
        isInputInsideLabel(input, html)) {
        inputsWithLabel++;
    } else {
        inputsWithoutLabel++;
        warnings.push(`Input may lack label: ${input.substring(0, 80)}`);
    }
});

if (inputsWithoutLabel === 0) {
    passed.push(`✅ All ${inputsWithLabel} inputs have labels/identifiers`);
}

// Check 4: ARIA roles
const roleCount = (html.match(/role\s*=/gi) || []).length;
passed.push(`✅ Found ${roleCount} ARIA role attributes`);

// Check 5: Language attribute
if (/<html[^>]*lang\s*=/i.test(html)) {
    passed.push('✅ HTML has lang attribute');
} else {
    issues.push('❌ HTML missing lang attribute');
}

// Check 6: Heading hierarchy
const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
const h4Count = (html.match(/<h4[^>]*>/gi) || []).length;

passed.push(`✅ Heading structure: h1(${h1Count}), h2(${h2Count}), h3(${h3Count}), h4(${h4Count})`);

if (h1Count === 0) {
    issues.push('❌ No h1 element found (main heading)');
} else if (h1Count > 1) {
    warnings.push(`⚠️ Multiple h1 elements (${h1Count}) - consider using only one`);
}

// Check 7: Skip links
if (/skip/i.test(html) && /main/i.test(html)) {
    passed.push('✅ Skip link may be present');
} else {
    warnings.push('⚠️ Consider adding skip link for keyboard users');
}

// Check 8: Focus indicators
const focusRules = (html.match(/:focus/gi) || []).length;
if (focusRules > 0) {
    passed.push(`✅ Found ${focusRules} :focus CSS rules`);
} else {
    warnings.push('⚠️ Consider adding visible focus indicators');
}

// Check 9: Color contrast note
warnings.push('⚠️ Manual check needed: Verify color contrast ratios (WCAG 4.5:1 for text)');

// Check 10: Interactive elements
const tabindexCount = (html.match(/tabindex/gi) || []).length;
passed.push(`✅ Found ${tabindexCount} tabindex attributes`);

// Output results
console.log('\n' + '='.repeat(50));
console.log('📊 RESULTS\n');

console.log(`✅ PASSED (${passed.length}):`);
passed.forEach(p => console.log(`   ${p}`));

if (warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`   ${w}`));
}

if (issues.length > 0) {
    console.log(`\n❌ ISSUES (${issues.length}):`);
    issues.forEach(i => console.log(`   ${i}`));
}

console.log('\n' + '='.repeat(50));

// Summary
const total = passed.length + warnings.length + issues.length;
const score = Math.round((passed.length / total) * 100);

console.log(`\n📈 ACCESSIBILITY SCORE: ${score}%`);
console.log(`   Passed: ${passed.length}`);
console.log(`   Warnings: ${warnings.length}`);
console.log(`   Issues: ${issues.length}`);

if (issues.length === 0) {
    console.log('\n✅ No critical accessibility issues found!');
    process.exit(0);
} else {
    console.log('\n⚠️ Please fix the issues above for better accessibility.');
    process.exit(1);
}
