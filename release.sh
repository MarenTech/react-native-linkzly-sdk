#!/bin/bash

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VERSION="1.0.7"
TAG_NAME="v${VERSION}"
REPO_URL="https://github.com/MarenTech/react-native-linkzly-sdk.git"

# Release notes
RELEASE_NOTES=$(cat <<EOF
## Features

- **Event lifecycle enhancements**: enhanced Event Life cycle with session start and end.

## Upgrade Notes
No breaking changes. Direct upgrade from 1.0.6 recommended.

## Installation

\`\`\`bash
# Using npm
npm install https://github.com/MarenTech/react-native-linkzly-sdk.git#${TAG_NAME}

# Using yarn
yarn add https://github.com/MarenTech/react-native-linkzly-sdk.git#${TAG_NAME}

# Or in package.json
"@linkzly/react-native-sdk": "https://github.com/MarenTech/react-native-linkzly-sdk.git#${TAG_NAME}"
\`\`\`
EOF
)

echo -e "${GREEN}🚀 Starting release process for ${TAG_NAME}${NC}\n"

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}📝 Staging all changes...${NC}"
    git add -A
    
    echo -e "${YELLOW}💾 Committing changes...${NC}"
    git commit -m "chore: release ${TAG_NAME}

- Enhanced Event Life cycle with session start and end."
else
    echo -e "${YELLOW}⚠️  No uncommitted changes found${NC}"
fi

# Update version in package.json
echo -e "${YELLOW}📦 Updating version in package.json...${NC}"
if command -v node &> /dev/null; then
    # Use node to update version (preserves JSON formatting)
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '${VERSION}';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    git add package.json
    git commit -m "chore: bump version to ${VERSION}" || echo "Version already updated or no changes"
else
    echo -e "${RED}⚠️  Node.js not found. Please manually update version in package.json to ${VERSION}${NC}"
fi

# Check if tag already exists
if git rev-parse "${TAG_NAME}" >/dev/null 2>&1; then
    echo -e "${RED}❌ Tag ${TAG_NAME} already exists${NC}"
    read -p "Delete existing tag? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "${TAG_NAME}"
        git push origin ":refs/tags/${TAG_NAME}" || true
    else
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# Create and push tag
echo -e "${YELLOW}🏷️  Creating tag ${TAG_NAME}...${NC}"
git tag -a "${TAG_NAME}" -m "Release ${TAG_NAME}

${RELEASE_NOTES}"

# Push changes
echo -e "${YELLOW}📤 Pushing commits...${NC}"
git push origin main

echo -e "${YELLOW}📤 Pushing tag ${TAG_NAME}...${NC}"
git push origin "${TAG_NAME}"

echo -e "${GREEN}✅ Successfully pushed ${TAG_NAME} to remote${NC}\n"

# Create GitHub release if gh CLI is available
if command -v gh &> /dev/null; then
    echo -e "${YELLOW}📋 Creating GitHub release...${NC}"
    echo "${RELEASE_NOTES}" | gh release create "${TAG_NAME}" \
        --title "Release ${TAG_NAME}" \
        --notes-file - \
        --target main
    echo -e "${GREEN}✅ GitHub release created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found${NC}"
    echo -e "${YELLOW}📋 To create a release manually, visit:${NC}"
    echo -e "   ${REPO_URL}/releases/new?tag=${TAG_NAME}"
    echo -e "\n${YELLOW}Release notes:${NC}"
    echo -e "${RELEASE_NOTES}"
fi

echo -e "\n${GREEN}🎉 Release ${TAG_NAME} completed successfully!${NC}"

