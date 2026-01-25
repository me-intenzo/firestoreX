#!/bin/bash

# FirestoreX Pre-commit Setup
echo "🔥 Setting up FirestoreX for first commit..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📁 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "🚀 Initial commit: FirestoreX v1.0.0

✨ Features:
- Modern React 19 + Vite setup
- Supabase authentication & database
- Glass morphism UI with parallax effects
- Real-time dashboard with analytics
- Security monitoring & storage management
- Comprehensive documentation

🏗️ Architecture:
- Modular component structure
- Custom hooks & contexts
- Service layer abstraction
- Utility functions & helpers

📚 Documentation:
- README.md with complete overview
- Development guidelines
- Implementation roadmap
- Project structure guide

🎯 Ready for production deployment!"

echo "✅ FirestoreX is ready for first push!"
echo ""
echo "Next steps:"
echo "1. Create GitHub repository"
echo "2. Add remote: git remote add origin <repository-url>"
echo "3. Push to GitHub: git push -u origin main"
echo ""
echo "🔥 Happy coding with FirestoreX!"