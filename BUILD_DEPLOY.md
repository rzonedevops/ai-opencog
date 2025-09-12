# Build & Deployment Guide

This guide explains how to build and deploy the Theia OpenCog package as a release.

## Overview

The Theia OpenCog package can be deployed in multiple ways:

1. **NPM Package**: For integration into Theia applications
2. **Docker Container**: For containerized deployment
3. **GitHub Releases**: For distribution of built artifacts

## Automated Release Process

### GitHub Actions Workflow

The repository includes a comprehensive GitHub Actions workflow that automatically:

- ✅ Builds the TypeScript package with dependency resolution
- ✅ Creates Docker images for multiple platforms (linux/amd64, linux/arm64)
- ✅ Publishes to GitHub Container Registry
- ✅ Creates GitHub releases with artifacts
- ✅ Optional NPM publishing
- ✅ Multi-platform testing (Ubuntu, Windows, macOS)

### Triggering Releases

#### Automatic Releases
- **Tag Push**: Push a version tag (e.g., `v1.64.1`) to trigger a full release
- **Branch Push**: Push to `main` or `develop` branches triggers build and Docker image creation

#### Manual Releases
Use the GitHub Actions workflow dispatch:

```bash
# Via GitHub web interface: Actions > Build and Release Theia Package > Run workflow
# Or via GitHub CLI:
gh workflow run build-and-release.yml \
  -f release_type=patch \
  -f create_github_release=true \
  -f publish_npm=false \
  -f publish_docker=true
```

## Manual Build Process

### Prerequisites

- Node.js 16+ 
- NPM 8+
- Docker (for containerized builds)

### Local Development Build

```bash
cd ai-opencog

# Install dependencies and build
npm install --legacy-peer-deps
npm run build

# Or use Docker for consistent builds
docker-compose up --build theia-opencog-dev
```

### Production Build

```bash
cd ai-opencog

# Clean and build
npm run clean
npm run build

# Create package
npm pack

# Build Docker image
npm run docker:build
```

## Deployment Targets

### 1. NPM Package Distribution

**Package Details:**
- Name: `@theia/ai-opencog`
- Version: `1.64.1`
- Registry: NPM public registry

**Installation:**
```bash
npm install @theia/ai-opencog
```

**Usage in Theia Application:**
```typescript
import { ContainerModule } from '@theia/core/shared/inversify';
import { AiOpenCogModule } from '@theia/ai-opencog';

export default new ContainerModule(bind => {
    // Configure OpenCog integration
});
```

### 2. Docker Container Deployment

**Image Registry:** `ghcr.io/rzonedevops/ai-opencog`

**Available Tags:**
- `latest` - Latest stable release
- `main` - Latest from main branch
- `v1.64.1` - Specific version tags

**Deployment Options:**

#### Simple Docker Run
```bash
docker pull ghcr.io/rzonedevops/ai-opencog:latest
docker run -d \
  --name theia-opencog \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/rzonedevops/ai-opencog:latest
```

#### Docker Compose (Development)
```bash
cd ai-opencog
docker-compose up -d
```

#### Docker Compose (Production)
```bash
cd ai-opencog
docker-compose -f docker-compose.production.yml up -d
```

### 3. GitHub Releases

Each release includes:
- ✅ Source code (tar.gz, zip)
- ✅ Built package tarball (`.tgz`)
- ✅ Release notes with installation instructions
- ✅ Docker image references

**Access Releases:**
- Web: https://github.com/rzonedevops/ai-opencog/releases
- CLI: `gh release list` and `gh release download`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `AI_OPENCOG_ENVIRONMENT` | OpenCog environment | `production` |
| `AI_OPENCOG_LOG_LEVEL` | Logging level | `warn` |
| `AI_OPENCOG_METRICS_ENABLED` | Enable metrics | `true` |
| `AI_OPENCOG_CACHE_SIZE` | Cache size limit | `5000` |
| `AI_OPENCOG_MAX_CONCURRENCY` | Max concurrent operations | `50` |

### Volume Mounts

- `/app/data` - Persistent data storage
- `/app/logs` - Application logs
- `/app/config` - Configuration files (optional)

## Monitoring & Health Checks

### Health Check Endpoint
- **URL**: `http://localhost:3000/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 40 seconds

### Production Monitoring Stack

The production deployment includes:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization (port 3001)
- **ElasticSearch + Logstash + Kibana**: Log aggregation
- **Nginx**: Reverse proxy and load balancing

Access monitoring:
- Grafana: http://localhost:3001 (admin/admin123)
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090

## Troubleshooting

### Build Issues

**Missing Dependencies:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**TypeScript Compilation Errors:**
The build process includes dependency stubs to handle missing Theia packages. If issues persist:
```bash
# Use lenient TypeScript settings
npx tsc --skipLibCheck --noImplicitAny false
```

### Docker Issues

**Build Failures:**
```bash
# Rebuild without cache
docker build --no-cache -t theia-opencog .

# Check build logs
docker build -t theia-opencog . 2>&1 | tee build.log
```

**Runtime Issues:**
```bash
# Check container logs
docker logs theia-opencog

# Interactive debugging
docker run -it --entrypoint /bin/bash theia-opencog
```

### Deployment Issues

**Health Check Failures:**
- Verify port 3000 is accessible
- Check application logs for startup errors
- Ensure required environment variables are set

**Performance Issues:**
- Monitor resource usage with `docker stats`
- Adjust `AI_OPENCOG_CACHE_SIZE` and `AI_OPENCOG_MAX_CONCURRENCY`
- Check Grafana dashboards for metrics

## Version Management

### Semantic Versioning

The package follows semantic versioning (semver):
- **PATCH** (1.64.1 → 1.64.2): Bug fixes
- **MINOR** (1.64.1 → 1.65.0): New features, backward compatible
- **MAJOR** (1.64.1 → 2.0.0): Breaking changes

### Release Process

1. **Update Version**: `npm version [patch|minor|major]`
2. **Push Tags**: `git push --follow-tags`
3. **GitHub Actions**: Automatically triggers release workflow
4. **Verify**: Check GitHub releases and Docker images

## Security Considerations

### Container Security
- ✅ Non-root user (`theia:nodejs`)
- ✅ Minimal Alpine base image
- ✅ Multi-stage build reduces attack surface
- ✅ Health checks for reliability

### Package Security
- ✅ No secrets in package
- ✅ Scoped package name
- ✅ Public access with controlled publishing

### Network Security
- Configure firewalls for port 3000
- Use HTTPS in production (configure Nginx)
- Restrict access to monitoring ports

## Support

For issues related to:
- **Building**: Check GitHub Actions logs
- **Deployment**: Review Docker logs and health checks
- **Usage**: See package documentation and examples
- **Contributing**: Follow the contribution guidelines

**Resources:**
- [GitHub Repository](https://github.com/rzonedevops/ai-opencog)
- [Issues](https://github.com/rzonedevops/ai-opencog/issues)
- [Releases](https://github.com/rzonedevops/ai-opencog/releases)
- [Container Registry](https://github.com/rzonedevops/ai-opencog/pkgs/container/ai-opencog)