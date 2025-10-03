#!/bin/bash

# Automated Edge Function Deployment Script
echo "🚀 Automated Edge Function Deployment"
echo "======================================"

# Check if the updated function file exists
if [ ! -f "supabase/functions/admin-user-management/index.ts" ]; then
    echo "❌ Edge Function file not found!"
    echo "📁 Expected: supabase/functions/admin-user-management/index.ts"
    exit 1
fi

echo "✅ Edge Function file found"
echo "📄 File size: $(wc -l < supabase/functions/admin-user-management/index.ts) lines"

# Create a deployment package
echo ""
echo "📦 Creating deployment package..."

# Create a deployment directory
mkdir -p deployment

# Copy the function code
cp supabase/functions/admin-user-management/index.ts deployment/admin-user-management.ts

# Create a deployment guide
cat > deployment/DEPLOYMENT_GUIDE.md << 'EOF'
# Automated Edge Function Deployment

## Quick Deployment Steps

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to "Edge Functions"

2. **Find the Function**
   - Look for `admin-user-management`
   - Click on it to open

3. **Edit the Function**
   - Click "Edit" button
   - Select all existing code (Ctrl+A / Cmd+A)
   - Delete it

4. **Paste New Code**
   - Copy the entire content from `admin-user-management.ts`
   - Paste it into the editor
   - Click "Deploy"

5. **Verify Deployment**
   - Check that deployment was successful
   - Test by creating a user in the admin dashboard

## What This Fix Does

- ✅ Handles both direct and nested request data structures
- ✅ Adds comprehensive logging for debugging
- ✅ Improves error handling and validation
- ✅ Resolves the 400 error when creating users

## Testing

After deployment, try creating a user through the admin dashboard.
The 400 error should be resolved and users should be created successfully.
EOF

# Create a copy script for easy deployment
cat > deployment/copy_function_code.sh << 'EOF'
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
EOF

chmod +x deployment/copy_function_code.sh

echo "✅ Deployment package created in 'deployment/' directory"
echo ""

# Show the deployment steps
echo "🎯 Next Steps:"
echo "1. Go to Supabase Dashboard > Edge Functions"
echo "2. Find 'admin-user-management' function"
echo "3. Click 'Edit'"
echo "4. Run: ./deployment/copy_function_code.sh"
echo "5. Paste the code (Ctrl+V / Cmd+V)"
echo "6. Click 'Deploy'"
echo ""

# Ask if user wants to copy to clipboard
echo "🤔 Would you like to copy the function code to clipboard now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "📋 Copying function code to clipboard..."
    if command -v pbcopy &> /dev/null; then
        cat supabase/functions/admin-user-management/index.ts | pbcopy
        echo "✅ Code copied to clipboard! You can now paste it in Supabase Dashboard."
    elif command -v xclip &> /dev/null; then
        cat supabase/functions/admin-user-management/index.ts | xclip -selection clipboard
        echo "✅ Code copied to clipboard! You can now paste it in Supabase Dashboard."
    else
        echo "❌ No clipboard utility found. Please manually copy from:"
        echo "📁 supabase/functions/admin-user-management/index.ts"
    fi
else
    echo "📁 Function code is available in:"
    echo "   supabase/functions/admin-user-management/index.ts"
    echo "   deployment/admin-user-management.ts"
fi

echo ""
echo "🎉 Ready for deployment!"
echo "📖 See deployment/DEPLOYMENT_GUIDE.md for detailed instructions"
