# Syncing StackBlitz with GitHub

This guide explains how to sync code changes between your StackBlitz project and a GitHub repository.

## Prerequisites

1. A StackBlitz project
2. A GitHub account
3. A GitHub repository
4. Proper permissions on the GitHub repository

## Initial Setup

1. Connect StackBlitz to GitHub:
   - Click the "Connect Repository" button in the top navigation bar
   - Select your GitHub repository from the list
   - Authorize StackBlitz if prompted

## Committing Changes

### Method 1: Using the StackBlitz UI

1. Make your changes in the StackBlitz editor
2. Click the "Source Control" icon in the left sidebar (or press Ctrl/Cmd + Shift + G)
3. Review your changes in the "Changes" section
4. Enter a commit message in the text box
5. Click the "Commit" button or press Ctrl/Cmd + Enter

### Method 2: Using the Terminal

1. Open the terminal in StackBlitz
2. Stage your changes:
   ```bash
   git add .  # Stage all changes
   # Or stage specific files:
   git add path/to/file
   ```
3. Create a commit:
   ```bash
   git commit -m "Your commit message"
   ```

## Pushing Changes to GitHub

### Method 1: Using the StackBlitz UI

1. After committing, click the "..." menu in the Source Control panel
2. Select "Push" to send changes to GitHub
3. If prompted, authenticate with GitHub

### Method 2: Using the Terminal

1. Push your changes:
   ```bash
   git push origin main  # Replace 'main' with your branch name
   ```

## Best Practices

1. **Frequent Commits**
   - Make small, focused commits
   - Use clear, descriptive commit messages
   - Follow conventional commit format: `type(scope): message`

2. **Branch Management**
   - Create feature branches for new work
   - Keep the main branch stable
   - Delete branches after merging

3. **Sync Regularly**
   - Pull changes before starting new work
   - Push changes frequently
   - Resolve conflicts promptly

## Troubleshooting

### Common Issues and Solutions

1. **Push Rejected**
   - Pull latest changes first:
     ```bash
     git pull origin main
     ```
   - Resolve any conflicts
   - Try pushing again

2. **Authentication Failed**
   - Check GitHub connection in StackBlitz settings
   - Re-authenticate if necessary
   - Verify repository permissions

3. **Merge Conflicts**
   - Pull latest changes
   - Resolve conflicts in the editor
   - Commit resolved changes
   - Push updates

4. **Connection Issues**
   - Check internet connection
   - Verify GitHub is accessible
   - Try refreshing StackBlitz

## Limitations

1. **Large Files**
   - GitHub has file size limits
   - Avoid committing large binary files
   - Use .gitignore for build artifacts

2. **Branch Switching**
   - Some operations may require page refresh
   - Save all changes before switching branches

3. **Git Operations**
   - Some advanced git operations may not be available
   - Use GitHub's web interface for complex operations

## Automated Sync

StackBlitz provides automatic sync features:

1. **Auto-save**
   - Changes are automatically saved locally
   - Enable in StackBlitz settings

2. **Auto-commit**
   - Optional feature for automatic commits
   - Configure commit message template
   - Set commit frequency

3. **Auto-push**
   - Can be enabled for automatic pushing
   - Use with caution on shared repositories

## Security Considerations

1. **Authentication**
   - Use secure GitHub tokens
   - Never share credentials
   - Regularly review access permissions

2. **Repository Access**
   - Grant minimum required permissions
   - Regularly audit access levels
   - Remove unused integrations

## Additional Tips

1. **Code Review**
   - Use GitHub's pull request features
   - Request reviews before merging
   - Follow team review guidelines

2. **Documentation**
   - Keep README up to date
   - Document significant changes
   - Include setup instructions

3. **Workflow Integration**
   - Consider GitHub Actions for CI/CD
   - Integrate with project management tools
   - Automate repetitive tasks

Remember to always backup important changes and test your sync setup in a safe environment first.