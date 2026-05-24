#!/bin/bash
# Script pour pousser les pages wiki vers le GitHub Wiki
# Usage: bash scripts/push-wiki.sh
#
# PREREQUIS: Creer la premiere page wiki manuellement sur
# https://github.com/ralphgabriel04/dpm-calendar/wiki
# puis executer ce script.

set -e

WIKI_REPO="https://github.com/ralphgabriel04/dpm-calendar.wiki.git"
WIKI_SRC="wiki"
WIKI_TMP="/c/tmp/dpm-calendar-wiki-push"

echo "=== DPM Calendar Wiki Push ==="

# Clean up any previous attempt
rm -rf "$WIKI_TMP"

# Clone the wiki repo
echo "Cloning wiki repo..."
git clone "$WIKI_REPO" "$WIKI_TMP"

# Copy wiki files
echo "Copying wiki files..."
cp "$WIKI_SRC"/*.md "$WIKI_TMP/"

# Push
cd "$WIKI_TMP"
git add -A
git commit -m "docs: add comprehensive GitHub Wiki (19 pages)"
git push origin master

echo ""
echo "=== Wiki pushed successfully! ==="
echo "View at: https://github.com/ralphgabriel04/dpm-calendar/wiki"
echo ""
echo "Pages pushed:"
ls *.md | wc -l
echo "files"

# Cleanup
cd -
rm -rf "$WIKI_TMP"
