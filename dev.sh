#!/bin/bash

# 🚀 ApeChain NFT Raffle - Development Helper Script

echo "🚀 ApeChain NFT Raffle - Development Helper"
echo "=========================================="

# Function to start development session
start_dev() {
    echo "🌅 Starting development session..."
    
    # Switch to staging and sync
    git checkout staging
    echo "📥 Syncing with remote..."
    git pull origin staging
    
    # Show current status
    echo "📊 Current status:"
    git status --short
    
    # Start development server
    echo "🖥️  Starting development server..."
    cd frontend
    npm run start:staging
}

# Function to commit and push work
save_work() {
    echo "💾 Saving your work..."
    
    # Show what's changed
    echo "📋 Changes to commit:"
    git status --short
    
    # Ask for commit message
    echo "📝 Enter commit message (or press Enter for default):"
    read commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="feat: development progress checkpoint"
    fi
    
    # Add all changes and commit
    git add .
    git commit -m "$commit_message"
    
    # Push to remote
    echo "📤 Pushing to remote..."
    git push origin staging
    
    echo "✅ Work saved successfully!"
}

# Function to show development status
show_status() {
    echo "📊 Development Status:"
    echo "Current branch: $(git branch --show-current)"
    echo "Last commit: $(git log --oneline -1)"
    echo "Uncommitted changes:"
    git status --short
}

# Main menu
case "$1" in
    "start")
        start_dev
        ;;
    "save")
        save_work
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {start|save|status}"
        echo ""
        echo "Commands:"
        echo "  start  - Start development session (sync + run server)"
        echo "  save   - Commit and push current work"
        echo "  status - Show current development status"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh start   # Start working"
        echo "  ./dev.sh save    # Save your progress"
        echo "  ./dev.sh status  # Check status"
        ;;
esac