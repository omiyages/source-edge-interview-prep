#!/bin/bash
echo "📋 Copying Edge Function code to clipboard..."

# Try different clipboard commands based on OS
if command -v pbcopy &> /dev/null; then
    # macOS
    cat admin-user-management.ts | pbcopy
    echo "✅ Code copied to clipboard (macOS)"
elif command -v xclip &> /dev/null; then
    # Linux
    cat admin-user-management.ts | xclip -selection clipboard
    echo "✅ Code copied to clipboard (Linux)"
elif command -v clip &> /dev/null; then
    # Windows (Git Bash)
    cat admin-user-management.ts | clip
    echo "✅ Code copied to clipboard (Windows)"
else
    echo "❌ No clipboard utility found"
    echo "📋 Please manually copy the content from admin-user-management.ts"
fi
