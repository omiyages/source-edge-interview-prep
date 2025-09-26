#!/bin/bash

echo "🔄 Resetting Development Server"
echo "================================"

# Kill any existing Vite processes
echo "🛑 Stopping existing Vite processes..."
pkill -f "vite" 2>/dev/null || echo "No Vite processes found"

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Clear browser cache (optional)
echo "🌐 Clearing browser cache..."
echo "Please clear your browser cache or open in incognito mode"

# Reinstall dependencies (if needed)
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
    echo "Installing/updating dependencies..."
    npm install
fi

echo "✅ Reset complete!"
echo ""
echo "🚀 Starting development server..."
echo "If you still see WebSocket errors:"
echo "1. Clear your browser cache completely"
echo "2. Open in incognito/private mode"
echo "3. Check that no other dev server is running on port 8080"
echo ""

# Start the development server
npm run dev
