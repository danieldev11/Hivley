# Hivley Developer Guide

This guide provides comprehensive instructions for setting up and running the Hivley project locally.

## Prerequisites

### Required Software
- **Node.js**: v20.x or later
- **npm**: v10.x or later (included with Node.js)
- **Git**: v2.x or later
- **Docker**: v24.x or later (optional, for containerized deployment)
- **Docker Compose**: v2.x or later (optional, for containerized deployment)

### Hardware Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space minimum

### Supported Operating Systems
- macOS 10.15 (Catalina) or later
- Windows 10/11 with WSL2
- Ubuntu 20.04 LTS or later
- Other Linux distributions with equivalent specifications

## Initial Environment Setup

1. **Install Node.js and npm**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20

   # Verify installations
   node --version  # Should show v20.x.x
   npm --version   # Should show v10.x.x
   ```

2. **Install Git**
   ```bash
   # macOS (using Homebrew)
   brew install git

   # Ubuntu/Debian
   sudo apt update
   sudo apt install git

   # Verify installation
   git --version  # Should show v2.x.x
   ```

3. **Install Docker (Optional)**
   ```bash
   # macOS
   brew install --cask docker

   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Verify installations
   docker --version
   docker-compose --version
   ```

## Project Configuration

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd hivley
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the project root:
   ```bash
   # Required Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Optional Configuration
   PORT=3000  # Default port for production server
   ```

   Required Environment Variables:
   | Variable | Description | Example |
   |----------|-------------|---------|
   | VITE_SUPABASE_URL | Your Supabase project URL | https://example.supabase.co |
   | VITE_SUPABASE_ANON_KEY | Your Supabase anonymous key | eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1... |

4. **Supabase Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Click "Connect to Supabase" in the StackBlitz UI
   - Follow the prompts to connect your project
   - The migrations will run automatically

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

2. **Build for Production**
   ```bash
   npm run build
   ```
   This creates optimized files in the `dist` directory.

3. **Start Production Server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`

4. **Run Linting**
   ```bash
   npm run lint
   ```

## Docker Deployment

1. **Build the Docker Image**
   ```bash
   docker build -t hivley-app .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Run with Docker**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --name hivley-app \
     -e VITE_SUPABASE_URL=your-supabase-url \
     -e VITE_SUPABASE_ANON_KEY=your-supabase-key \
     hivley-app
   ```

## Troubleshooting Guide

### Common Issues

1. **Node Version Mismatch**
   ```
   Error: The engine "node" is incompatible with this module
   ```
   Solution: Use nvm to install and use Node.js v20
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **Missing Environment Variables**
   ```
   Error: Missing Supabase configuration
   ```
   Solution: Ensure `.env` file exists with required variables

3. **Build Failures**
   ```
   Error: Failed to compile
   ```
   Solutions:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npx tsc --noEmit`

4. **Supabase Connection Issues**
   ```
   Error: Failed to connect to Supabase
   ```
   Solutions:
   - Verify environment variables are correct
   - Check Supabase project status
   - Ensure IP is allowed in Supabase dashboard

### Debugging Tips

1. **Development Server**
   - Check Vite dev server logs
   - Use browser developer tools console
   - Enable React DevTools
   - Check Network tab for API calls

2. **Database Issues**
   - Check Supabase dashboard
   - Verify RLS policies
   - Monitor real-time logs
   - Test queries in Supabase SQL editor

3. **Production Build**
   - Check production server logs
   - Monitor Docker container logs
   - Use health check endpoint
   - Verify environment variables

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)

## Project Structure

```
hivley/
├── docs/                 # Documentation
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── lib/            # Utility functions
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # Database migrations
├── .env                # Environment variables
├── docker-compose.yml  # Docker configuration
├── Dockerfile         # Docker build instructions
└── package.json       # Project dependencies
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## Support

For additional help:
1. Check existing documentation
2. Search GitHub issues
3. Contact the development team