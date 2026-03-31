#!/bin/bash

echo "🔧 Applying RPC configuration fixes..."

# Kill any existing development server
pkill -f "react-scripts start" || true
pkill -f "node.*start:dev" || true

echo "✅ Configuration updated:"
echo "   - Fixed Polygon RPC to use authenticated Alchemy endpoint"
echo "   - Removed problematic Ankr RPC without authentication"
echo "   - Updated RPC priority order"

echo ""
echo "🚀 Starting development server with fixed configuration..."
echo "   URL: http://192.168.0.218:3000"
echo ""

cd frontend
yarn start:dev