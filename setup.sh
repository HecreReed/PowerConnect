#!/bin/bash

# PowerConnect Quick Start Script

set -e

echo "🚀 PowerConnect Setup Script"
echo "=============================="
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)

    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    fi

    echo "✅ .env file created with random JWT_SECRET"
    echo ""
    echo "⚠️  IMPORTANT: Please edit backend/.env and update:"
    echo "   - USERNAME (default: admin)"
    echo "   - PASSWORD (default: admin)"
    echo "   - FS_ROOT_DIR (default: your home directory)"
    echo ""
else
    echo "ℹ️  .env file already exists"
    echo ""
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Build frontend for production
echo "🔨 Building frontend..."
npm run build
echo "✅ Frontend built successfully"
echo ""

# Build backend
echo "🔨 Building backend..."
cd ../backend
npm run build
echo "✅ Backend built successfully"
echo ""

echo "=============================="
echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure your settings:"
echo "   nano backend/.env"
echo ""
echo "2. Start the server:"
echo ""
echo "   Development mode:"
echo "   cd backend && npm run dev"
echo ""
echo "   Production mode (with PM2):"
echo "   cd backend"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "3. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "📖 For deployment instructions, see DEPLOYMENT.md"
echo ""
