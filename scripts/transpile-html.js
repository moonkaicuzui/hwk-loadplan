#!/usr/bin/env node
/**
 * HTML 파일 내의 인라인 JavaScript를 Babel로 트랜스파일
 * Safari 12+ 호환성을 위해 optional chaining(?.)과 nullish coalescing(??)을 변환
 *
 * 문자열 기반 처리로 대용량 HTML 지원
 */

const fs = require('fs');
const babel = require('@babel/core');

const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile;

if (!inputFile) {
    console.error('Usage: node transpile-html.js <input.html> [output.html]');
    process.exit(1);
}

console.log(`📄 Processing: ${inputFile}`);

// HTML 파일 읽기
let html = fs.readFileSync(inputFile, 'utf8');

// Babel 설정
const babelOptions = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                safari: '11',
                chrome: '60',
                firefox: '55',
                edge: '15'
            },
            useBuiltIns: false,
            modules: false
        }]
    ],
    compact: false,
    comments: true
};

let transformedCount = 0;
let errorCount = 0;

// 인라인 스크립트 태그를 찾아서 변환
// 패턴: <script> 또는 <script type="...javascript..."> 또는 <script type="module">
function processScripts(html) {
    // 모든 script 태그를 찾는 정규식 (src 속성이 없는 것만)
    const scriptRegex = /<script(\s+[^>]*)?>([\s\S]*?)<\/script>/gi;

    return html.replace(scriptRegex, (match, attrs, content) => {
        // attrs가 없으면 빈 문자열로
        attrs = attrs || '';

        // src 속성이 있으면 외부 스크립트이므로 건너뛰기
        if (/\ssrc\s*=/i.test(attrs)) {
            return match;
        }

        // 빈 스크립트 건너뛰기
        if (!content.trim()) {
            return match;
        }

        // JSON-LD나 비-JavaScript 타입 건너뛰기
        const typeMatch = attrs.match(/\stype\s*=\s*["']([^"']+)["']/i);
        if (typeMatch) {
            const scriptType = typeMatch[1].toLowerCase();
            if (scriptType !== 'text/javascript' &&
                scriptType !== 'module' &&
                !scriptType.includes('javascript')) {
                return match;
            }
        }

        const contentLength = content.length;
        console.log(`   🔄 Processing script (${contentLength} chars)...`);

        try {
            // 타입에 따라 sourceType 설정
            const isModule = typeMatch && typeMatch[1].toLowerCase() === 'module';
            const options = {
                ...babelOptions,
                sourceType: isModule ? 'module' : 'script'
            };

            const result = babel.transformSync(content, options);

            if (result && result.code) {
                transformedCount++;

                // 변환 전후 비교
                const beforeNullish = (content.match(/\?\?/g) || []).length;
                const afterNullish = (result.code.match(/\?\?/g) || []).length;
                const beforeOptional = (content.match(/\?\./g) || []).length;
                const afterOptional = (result.code.match(/\?\./g) || []).length;

                console.log(`   ✅ Transpiled: ?? ${beforeNullish}→${afterNullish}, ?. ${beforeOptional}→${afterOptional}`);

                return `<script${attrs}>${result.code}</script>`;
            }
        } catch (error) {
            console.error(`   ⚠️  Error: ${error.message.substring(0, 100)}`);
            errorCount++;
        }

        return match;
    });
}

// 스크립트 처리
const result = processScripts(html);

// 결과 저장
fs.writeFileSync(outputFile, result, 'utf8');

// 최종 확인
const finalNullish = (result.match(/\?\?/g) || []).length;
const finalOptional = (result.match(/\?\./g) || []).length;

console.log(`\n📊 Summary:`);
console.log(`   ✅ Transpiled: ${transformedCount} script blocks`);
console.log(`   ⚠️  Errors: ${errorCount}`);
console.log(`   📈 Final counts: ?? = ${finalNullish}, ?. = ${finalOptional}`);
console.log(`📁 Output: ${outputFile}`);
