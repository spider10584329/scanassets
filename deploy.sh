#!/bin/bash

# ScanAssets Deployment Script for Ubuntu
echo "🚀 Starting ScanAssets deployment..."

# Set proper permissions for public assets
echo "📁 Setting permissions for public assets..."
find public -type f -exec chmod 644 {} \;
find public -type d -exec chmod 755 {} \;

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

# Set permissions for the built application
echo "🔒 Setting permissions for built files..."
find .next -type f -exec chmod 644 {} \; 2>/dev/null || true
find .next -type d -exec chmod 755 {} \; 2>/dev/null || true

echo "✅ Deployment complete!"
echo "💡 To start the application, run: npm start"
echo "💡 Make sure your environment variables are set in .env"
