#!/bin/bash

echo "🚀 Setting up Energy Project - Python + React + Visx..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create React project with Vite
echo "⚛️ Creating React + Visx energy flowchart project..."
cd /workspace

# Only create if doesn't exist
if [ ! -d "energy-flowchart" ]; then
    npm create vite@latest energy-flowchart -- --template react
fi

cd energy-flowchart

# Install React + Visx dependencies
echo "📦 Installing React and Visx dependencies..."
npm install

# Install Visx packages
npm install @visx/visx @visx/shape @visx/curve @visx/event @visx/network @visx/drag
npm install @visx/responsive @visx/tooltip @visx/scale @visx/group

# Install additional dependencies
npm install tailwindcss postcss autoprefixer
npm install @types/d3

# Initialize Tailwind CSS
npx tailwindcss init -p

echo "✅ Setup complete!"
echo ""
echo "🌐 Available services:"
echo "  - Flask API: http://localhost:5000"
echo "  - React Dev Server: http://localhost:5173"
echo ""
echo "🎯 Next steps:"
echo "  1. Run 'cd energy-flowchart && npm run dev' to start React dev server"
echo "  2. Run 'cd python-app && python app.py' to start Flask API"
echo "  3. Open http://localhost:5173 in your browser"