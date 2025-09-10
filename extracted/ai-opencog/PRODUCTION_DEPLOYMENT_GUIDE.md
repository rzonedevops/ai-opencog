# Phase 6: Production Deployment Guide

This document provides comprehensive instructions for deploying the Theia-OpenCog integration in production environments.

## Overview

The production deployment architecture includes:

- **Container Deployment**: Dockerized application with orchestration
- **Configuration Management**: Environment-specific settings and cognitive service parameters
- **Monitoring and Logging**: Real-time performance metrics, error tracking, and usage analytics
- **Continuous Enhancement**: Feedback collection, enhancement pipeline, and community building

## Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for development builds)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Basic Deployment

1. **Clone and Build**:
   ```bash
   git clone <repository-url>
   cd packages/ai-opencog
   docker build -t theia-opencog:latest .
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   ```

3. **Deploy with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

4. **Verify Deployment**:
   ```bash
   curl http://localhost:3000/health
   ```

## Deployment Options

### 1. Container Deployment

#### Single Container
```bash
docker run -d \
  --name theia-opencog \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e AI_OPENCOG_ENVIRONMENT=production \
  theia-opencog:latest
```

#### Docker Compose (Recommended)
```bash
docker-compose -f docker-compose.production.yml up -d
```

#### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: theia-opencog
spec:
  replicas: 3
  selector:
    matchLabels:
      app: theia-opencog
  template:
    metadata:
      labels:
        app: theia-opencog
    spec:
      containers:
      - name: theia-opencog
        image: theia-opencog:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: AI_OPENCOG_ENVIRONMENT
          value: "production"
```

### 2. Native Deployment

#### System Requirements
- CPU: 4+ cores recommended
- Memory: 8GB+ recommended
- Storage: 50GB+ available space
- OS: Ubuntu 20.04+, CentOS 8+, or similar

#### Installation Steps
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install application
npm install --production
npm run compile

# Configure system service
sudo cp deployment/theia-opencog.service /etc/systemd/system/
sudo systemctl enable theia-opencog
sudo systemctl start theia-opencog
```

## Configuration Management

### Environment Variables

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | Runtime environment | `development` | `production` |
| `AI_OPENCOG_ENVIRONMENT` | Application environment | `development` | `production` |
| `AI_OPENCOG_LOG_LEVEL` | Logging level | `info` | `warn` |
| `AI_OPENCOG_METRICS_ENABLED` | Enable metrics collection | `true` | `true` |
| `AI_OPENCOG_CACHE_SIZE` | Cache size limit | `1000` | `5000` |
| `AI_OPENCOG_MAX_CONCURRENCY` | Max concurrent operations | `10` | `50` |

### Configuration Files

#### Production Config (config/production.json)
```json
{
  "environment": "production",
  "cognitiveServices": {
    "enabled": true,
    "maxConcurrency": 50,
    "timeout": 30000,
    "retryAttempts": 3,
    "cacheSize": 5000
  },
  "performance": {
    "memoryLimit": 8192,
    "cpuThreshold": 80,
    "diskSpaceThreshold": 85,
    "responseTimeThreshold": 5000
  },
  "monitoring": {
    "enabled": true,
    "metricsInterval": 60000,
    "alerting": true,
    "logLevel": "warn"
  },
  "deployment": {
    "containerized": true,
    "autoScaling": true,
    "healthCheckInterval": 30000,
    "gracefulShutdownTimeout": 30000
  }
}
```

#### Cognitive Service Parameters
```json
{
  "reasoningEngine": {
    "maxInferenceTime": 10000,
    "maxInferenceDepth": 100,
    "cacheInferences": true
  },
  "learningSystem": {
    "adaptationRate": 0.1,
    "feedbackWeight": 0.8,
    "explorationRate": 0.2
  },
  "knowledgeBase": {
    "maxSize": 1000000,
    "compressionEnabled": true,
    "persistenceInterval": 300000
  }
}
```

## Monitoring and Logging

### Health Checks

The application provides several health check endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed component status
- `GET /metrics` - Prometheus-compatible metrics

### Metrics Collection

#### Key Metrics
- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Response time, throughput, error rate
- **Cognitive Metrics**: Reasoning operations, learning events, knowledge base size

#### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'theia-opencog'
    static_configs:
      - targets: ['theia-opencog:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Log Management

#### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that may require action
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

#### Log Aggregation with ELK Stack
```yaml
# logstash.conf
input {
  file {
    path => "/app/logs/*.log"
    start_position => "beginning"
  }
}

filter {
  if [path] =~ "error" {
    mutate { add_tag => [ "error" ] }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "theia-opencog-%{+YYYY.MM.dd}"
  }
}
```

### Alerting

#### Alert Rules
```yaml
groups:
- name: theia-opencog
  rules:
  - alert: HighMemoryUsage
    expr: memory_usage_percent > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      
  - alert: HighErrorRate
    expr: error_rate > 5
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
```

## Security Considerations

### Network Security
- Use HTTPS with valid SSL certificates
- Configure firewall rules to restrict access
- Use VPN for administrative access

### Authentication and Authorization
```json
{
  "auth": {
    "enabled": true,
    "provider": "oauth2",
    "clientId": "${AUTH_CLIENT_ID}",
    "clientSecret": "${AUTH_CLIENT_SECRET}",
    "redirectUri": "https://your-domain.com/auth/callback"
  }
}
```

### Data Protection
- Encrypt data at rest using database encryption
- Encrypt data in transit using TLS 1.3
- Regular security audits and vulnerability scans

## Performance Optimization

### Resource Allocation
```json
{
  "resources": {
    "cpu": {
      "limit": "4000m",
      "request": "2000m"
    },
    "memory": {
      "limit": "8Gi",
      "request": "4Gi"
    }
  }
}
```

### Caching Strategy
- Redis for session and application caching
- CDN for static assets
- Database query result caching

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: theia-opencog-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: theia-opencog
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U opencog opencog > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U opencog opencog | gzip > "$BACKUP_DIR/opencog_$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

### Application State Backup
```bash
# Backup knowledge base and cache
tar -czf knowledge_backup_$(date +%Y%m%d).tar.gz /app/data/knowledge
tar -czf cache_backup_$(date +%Y%m%d).tar.gz /app/data/cache
```

### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup frequency**: Every 6 hours
4. **Geographic redundancy**: Required for production

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats theia-opencog

# Increase memory limit
docker update --memory=8g theia-opencog
```

#### Connection Issues
```bash
# Check network connectivity
docker network inspect opencog-network

# Restart services
docker-compose restart theia-opencog
```

#### Performance Issues
```bash
# Check logs
docker logs theia-opencog --tail=100

# Enable debug logging
docker exec theia-opencog npm run configure -- --log-level=debug
```

### Support Channels

- **Documentation**: [Link to docs]
- **Community Forum**: [Link to forum]
- **Issue Tracker**: [Link to GitHub issues]
- **Enterprise Support**: [Contact information]

## Continuous Enhancement

### Feedback Collection
- Automated user feedback collection
- Performance monitoring and analysis
- Feature usage analytics

### Enhancement Pipeline
- Regular feature updates (monthly)
- Performance improvements (bi-weekly)
- Security updates (as needed)

### Community Contributions
- Open source contribution guidelines
- Developer documentation
- Community forums and support

## License and Support

This deployment guide is part of the Theia-OpenCog integration project.

- **License**: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
- **Support**: Community and enterprise support available
- **Contributing**: See CONTRIBUTING.md for guidelines