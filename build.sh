#!/bin/bash

# Rachgia Dashboard v19 Production Build Script
# Created: 2026-01-03
# Purpose: Build production-ready deployment package

set -e  # Exit on error

VERSION="v19"
BUILD_DIR="dist"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Building Rachgia Dashboard $VERSION..."
echo "================================================"

# Create build directory
echo "📁 Creating build directory..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
mkdir -p $BUILD_DIR/locales

# Transpile and copy main files (Safari compatibility)
echo "🔄 Transpiling JavaScript for Safari compatibility..."
if [ -f rachgia_dashboard_v19.html ]; then
    # HTML 내의 인라인 JavaScript를 Babel로 트랜스파일
    node scripts/transpile-html.js rachgia_dashboard_v19.html $BUILD_DIR/index.html
    echo "   ✅ rachgia_dashboard_v19.html → dist/index.html (transpiled)"
else
    echo "   ❌ ERROR: rachgia_dashboard_v19.html not found!"
    exit 1
fi

# Transpile external JS files in src/
echo "🔄 Transpiling external JavaScript files..."
if [ -d src ]; then
    mkdir -p $BUILD_DIR/src
    for jsfile in src/*.js; do
        if [ -f "$jsfile" ]; then
            filename=$(basename "$jsfile")
            npx babel "$jsfile" --out-file "$BUILD_DIR/src/$filename"
            echo "   ✅ $jsfile → dist/src/$filename (transpiled)"
        fi
    done
fi

# Transpile root JS files
echo "🔄 Transpiling root JavaScript files..."
for jsfile in rachgia_data_v8.js rachgia_v18_improvements.js; do
    if [ -f "$jsfile" ]; then
        npx babel "$jsfile" --out-file "$BUILD_DIR/$jsfile"
        echo "   ✅ $jsfile → dist/$jsfile (transpiled)"
    else
        echo "   ⚠️  WARNING: $jsfile not found"
    fi
done

# Copy locales
echo "🌐 Copying i18n translation files..."
for locale in ko en vi; do
    if [ -f "locales/${locale}.json" ]; then
        cp "locales/${locale}.json" "$BUILD_DIR/locales/"
        echo "   ✅ locales/${locale}.json copied"
    else
        echo "   ⚠️  WARNING: locales/${locale}.json not found"
    fi
done

# Copy service worker if exists
if [ -f service-worker.js ]; then
    cp service-worker.js $BUILD_DIR/
    echo "   ✅ service-worker.js copied (PWA support)"
fi

# Copy manifest if exists
if [ -f manifest.json ]; then
    cp manifest.json $BUILD_DIR/
    echo "   ✅ manifest.json copied (PWA support)"
fi

# Copy documentation
echo "📚 Copying documentation files..."
for doc in README.md USER_GUIDE.md DEVELOPER_GUIDE.md; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BUILD_DIR/"
        echo "   ✅ $doc copied"
    fi
done

# Create VERSION file
echo "📝 Creating VERSION file..."
cat > "$BUILD_DIR/VERSION" <<EOF
Version: $VERSION
Build Date: $DATE
Build Time: $TIMESTAMP
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
EOF
echo "   ✅ VERSION file created"

# Create deployment guide
echo "📖 Creating DEPLOYMENT.txt..."
cat > "$BUILD_DIR/DEPLOYMENT.txt" <<EOF
Rachgia Dashboard v19 Deployment Guide
======================================

📦 Package Contents:
- index.html (main dashboard)
- locales/ (ko.json, en.json, vi.json)
- README.md, USER_GUIDE.md, DEVELOPER_GUIDE.md
- VERSION (build information)

🚀 Quick Deploy:

1. Static Web Server (Nginx/Apache):
   - Copy all files to web root directory
   - Ensure MIME types configured for .json files
   - Enable gzip compression

2. Python HTTP Server (Development):
   cd dist
   python3 -m http.server 8000

3. Docker:
   docker run -d -p 80:80 -v \$(pwd)/dist:/usr/share/nginx/html nginx:alpine

📋 Pre-deployment Checklist:
✅ All locales files present (ko.json, en.json, vi.json)
✅ index.html opens without errors
✅ i18n translations working (test all 3 languages)
✅ Dark mode toggle functional
✅ AI Analytics button displays insights
✅ Charts render correctly
✅ All filters operational
✅ Export features working (Excel, CSV, PDF)
✅ PWA installable (if service-worker.js present)
✅ Mobile responsive (test at 375px, 768px, 1024px)
✅ Lighthouse score ≥ 90

⚠️  Important Notes:
- Ensure web server serves .json files with correct MIME type (application/json)
- Enable CORS if dashboard accesses external APIs
- Configure CSP headers for security
- Use HTTPS in production
- Test in Chrome, Firefox, Safari

🔗 URLs to verify:
http://localhost:8000/                  (main dashboard)
http://localhost:8000/locales/ko.json  (Korean translations)
http://localhost:8000/locales/en.json  (English translations)
http://localhost:8000/locales/vi.json  (Vietnamese translations)

📞 Support:
- Documentation: README.md, USER_GUIDE.md, DEVELOPER_GUIDE.md
- Issues: Check DEVELOPER_GUIDE.md troubleshooting section
EOF
echo "   ✅ DEPLOYMENT.txt created"

# Generate file list
echo "📊 Generating file manifest..."
cat > "$BUILD_DIR/MANIFEST.txt" <<EOF
Rachgia Dashboard v19 - File Manifest
Generated: $DATE $TIMESTAMP
======================================

EOF
find "$BUILD_DIR" -type f -exec ls -lh {} \; | awk '{print $9, "(" $5 ")"}' >> "$BUILD_DIR/MANIFEST.txt"
echo "   ✅ MANIFEST.txt created"

# Calculate total size
TOTAL_SIZE=$(du -sh $BUILD_DIR | awk '{print $1}')
echo ""
echo "📊 Build Statistics:"
echo "   Total size: $TOTAL_SIZE"
echo "   Files: $(find $BUILD_DIR -type f | wc -l)"
echo ""

# Create compressed archive
ARCHIVE_NAME="rachgia-dashboard-${VERSION}-${DATE}.tar.gz"
echo "🗜️  Creating compressed archive..."
tar -czf "$ARCHIVE_NAME" -C $BUILD_DIR .
ARCHIVE_SIZE=$(du -sh "$ARCHIVE_NAME" | awk '{print $1}')
echo "   ✅ $ARCHIVE_NAME created ($ARCHIVE_SIZE)"
echo ""

# Success summary
echo "================================================"
echo "✅ Build complete!"
echo ""
echo "📦 Deployment Package:"
echo "   Directory: $BUILD_DIR/"
echo "   Archive:   $ARCHIVE_NAME"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test locally:"
echo "      cd $BUILD_DIR && python3 -m http.server 8000"
echo ""
echo "   2. Deploy to production:"
echo "      - Extract: tar -xzf $ARCHIVE_NAME"
echo "      - Upload to web server"
echo "      - See DEPLOYMENT.txt for detailed instructions"
echo ""
echo "   3. Verify deployment:"
echo "      - Open in browser"
echo "      - Test all 3 languages (ko/en/vi)"
echo "      - Check Lighthouse score"
echo "      - Verify AI Analytics"
echo ""
echo "================================================"
