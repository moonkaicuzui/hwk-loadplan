#!/bin/bash
# ========================================
# Rachgia Dashboard Deployment Script
# ========================================

set -e

echo "🚀 Rachgia Dashboard Deployment"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Install with: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check if logged in
firebase projects:list > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  Not logged in. Running firebase login...${NC}"
    firebase login
}

# Default to all deployments
DEPLOY_FUNCTIONS=false
DEPLOY_HOSTING=false
DEPLOY_FIRESTORE=false
DEPLOY_ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --functions|-f)
            DEPLOY_FUNCTIONS=true
            shift
            ;;
        --hosting|-h)
            DEPLOY_HOSTING=true
            shift
            ;;
        --firestore|-s)
            DEPLOY_FIRESTORE=true
            shift
            ;;
        --all|-a)
            DEPLOY_ALL=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--functions|-f] [--hosting|-h] [--firestore|-s] [--all|-a]"
            exit 1
            ;;
    esac
done

# If no specific option, deploy all
if [[ "$DEPLOY_FUNCTIONS" == "false" && "$DEPLOY_HOSTING" == "false" && "$DEPLOY_FIRESTORE" == "false" ]]; then
    DEPLOY_ALL=true
fi

# Navigate to project root
cd "$(dirname "$0")"

# ========================================
# Deploy Firestore Rules & Indexes
# ========================================
if [[ "$DEPLOY_FIRESTORE" == "true" || "$DEPLOY_ALL" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}📋 Deploying Firestore rules and indexes...${NC}"
    firebase deploy --only firestore:rules,firestore:indexes
    echo -e "${GREEN}✅ Firestore rules deployed${NC}"
fi

# ========================================
# Deploy Cloud Functions
# ========================================
if [[ "$DEPLOY_FUNCTIONS" == "true" || "$DEPLOY_ALL" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}⚡ Building and deploying Cloud Functions...${NC}"

    # Install dependencies
    echo "Installing function dependencies..."
    cd react-app/functions
    npm install --silent

    # Check for .env file
    if [[ ! -f ".env" ]]; then
        echo -e "${YELLOW}⚠️  No .env file found. Using .env.example as template.${NC}"
        echo "Please set environment variables in Firebase Console or create .env file."
    fi

    cd ../..

    # Deploy functions
    firebase deploy --only functions
    echo -e "${GREEN}✅ Cloud Functions deployed${NC}"

    # Set environment config (if .env exists)
    if [[ -f "react-app/functions/.env" ]]; then
        echo "Setting function configuration..."
        source react-app/functions/.env
        firebase functions:config:set \
            google.spreadsheet_id="$GOOGLE_SPREADSHEET_ID" \
            google.api_key="$GOOGLE_API_KEY" \
            2>/dev/null || true
    fi
fi

# ========================================
# Deploy Hosting (React App)
# ========================================
if [[ "$DEPLOY_HOSTING" == "true" || "$DEPLOY_ALL" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}🌐 Building and deploying React app...${NC}"

    # Build React app
    cd react-app
    echo "Installing dependencies..."
    npm install --silent

    echo "Building production bundle..."
    npm run build

    cd ..

    # Deploy hosting
    firebase deploy --only hosting
    echo -e "${GREEN}✅ Hosting deployed${NC}"
fi

# ========================================
# Summary
# ========================================
echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""

# Get hosting URL
HOSTING_URL=$(firebase hosting:channel:list 2>/dev/null | grep -oE 'https://[^ ]+' | head -1)
if [[ -z "$HOSTING_URL" ]]; then
    PROJECT_ID=$(firebase use 2>/dev/null | grep -oE '[a-z0-9-]+' | head -1)
    HOSTING_URL="https://${PROJECT_ID}.web.app"
fi

echo "📱 Dashboard URL: $HOSTING_URL"
echo ""
echo "Next steps:"
echo "  1. Verify the deployment at: $HOSTING_URL"
echo "  2. Check Cloud Functions logs: firebase functions:log"
echo "  3. Monitor in Firebase Console: https://console.firebase.google.com"
