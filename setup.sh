#!/bin/bash
# KAVACH AI Pro - Complete Setup Script
# Run this script to setup everything automatically

echo "🚀 KAVACH AI Pro - Complete Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo "-----------------------------"

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
else
    echo "❌ Docker not found. Please install:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose installed"
else
    echo "❌ Docker Compose not found. Please install:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✅ Git installed"
else
    echo "⚠️  Git not found (optional)"
fi

echo ""
echo "📁 Setting up project..."
echo "------------------------"

# Create directories
mkdir -p uploads
mkdir -p models/pretrained
mkdir -p logs

echo "✅ Directories created"

# Copy environment file
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Environment file created (backend/.env)"
    echo "⚠️  Please edit backend/.env with your settings"
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "🐳 Starting Docker services..."
echo "-------------------------------"

# Start services
docker-compose up -d --build

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo ""
echo "🏥 Health Check..."
echo "------------------"

# Check API
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API is running (http://localhost:8000)"
else
    echo "⚠️  API not responding yet. Waiting..."
    sleep 10
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running (http://localhost:3000)"
else
    echo "⚠️  Frontend not responding yet. Waiting..."
fi

echo ""
echo "📊 Services Status:"
echo "-------------------"
docker-compose ps

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🌐 Access Points:"
echo "   Frontend:    http://localhost:3000"
echo "   API Docs:    http://localhost:8000/docs"
echo "   Health:      http://localhost:8000/health"
echo ""
echo "📁 Project Structure:"
echo "   ./uploads/          - Uploaded files"
echo "   ./models/pretrained/ - AI models (download next)"
echo "   ./logs/             - Application logs"
echo ""
echo "🚀 Next Steps:"
echo "   1. Download AI models: python download_models.py"
echo "   2. Register account: http://localhost:3000/register"
echo "   3. Start detecting!"
echo ""
echo "📖 Documentation:"
echo "   README.md"
echo "   SETUP_GUIDE.md"
echo ""
