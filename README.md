# Dashboard - Data Transformation API

A **fully Dockerized** monorepo containing a **Django REST API backend** with data transformation capabilities and a **React frontend** for interactive data processing.

## Project Structure

```
├── backend/             # Django REST API with data transformation pipeline
│   ├── Dockerfile       # Docker configuration for Django app
│   ├── docker-compose.yml # Complete development environment
│   └── docker-dev.sh    # Docker management helper script
├── frontend/            # React 18 + TypeScript interactive dashboard
├── docker-dev.sh        # Root-level Docker helper (works from anywhere)
└── README.md            # This file
```

## Features

### Backend API Features
- **4 Data Transformation Types**: Aggregate, Filter, Normalize, Pivot
- **Functional Programming Patterns** using pandas and numpy
- **Isolated PostgreSQL Database** in Docker container
- **Comprehensive Error Handling** with meaningful HTTP status codes
- **Input Validation** with DRF serializers
- **Interactive API Documentation** (Swagger UI)
- **31 Comprehensive Tests** with 100% pass rate
- **High Performance** (processes 1000+ records in <4ms)

### Frontend Dashboard Features
- **React 18** with TypeScript for type safety
- **Interactive Data Visualization** with sortable/filterable tables
- **Real-time Transformation Preview** with live API integration
- **Modern UI/UX** with Tailwind CSS responsive design
- **Error Handling** with toast notifications
- **Sample Data** for immediate testing (sales, users, products)
- **Client-side Filtering** and sorting capabilities

## Tech Stack

### Backend Technologies
- **Python 3.11** + **Django 4.2** + **Django REST Framework 3.14**
- **PostgreSQL 15** (containerized)
- **pandas 2.3+** for data transformations
- **numpy 1.26+** for numerical operations
- **pytest 7.0+** for comprehensive testing
- **Docker & Docker Compose** for complete isolation

### Frontend Technologies
- **React 18** + **TypeScript 5.8** for type-safe development
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Axios** for API communication
- **React Hot Toast** for user notifications

## Quick Start - Full Stack

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Node.js 18+** and **npm** for frontend development
- **Git** for cloning the repository

### Complete Setup (Backend + Frontend)

```bash
# 1. Clone the repository
git clone https://github.com/hanselcarter/dashboard.git
cd dashboard

# 2. Start the backend (Docker)
./docker-dev.sh start

# 3. In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

**That's it!** You now have:
- **Backend API**: `http://localhost:8000` (Django in Docker)
- **Frontend Dashboard**: `http://localhost:3000` (React with Vite)
- **Database**: PostgreSQL in Docker (auto-configured)
- **API Proxy**: Frontend automatically connects to backend

**The backend Docker setup will automatically:**
- **Download Python 3.11** base image
- **Install all Python dependencies** from requirements.txt
- **Set up PostgreSQL 15** database container (isolated on port 5433)
- **Run all database migrations** automatically
- **Start Django development server** at **http://localhost:8000**
- **Configure container networking** between Django and PostgreSQL

**The frontend setup will:**
- **Install all Node.js dependencies** via npm
- **Start Vite development server** at **http://localhost:3000**
- **Enable hot module replacement** for instant updates
- **Proxy API calls** to the backend automatically

### Environment Configuration

The Docker setup includes default environment variables that work out of the box. For custom configurations:

1. Copy the example environment file: `cp backend/.env.example backend/.env`
2. Edit `backend/.env` with your preferred settings
3. Restart the containers: `./docker-dev.sh stop && ./docker-dev.sh start`

**Note**: The `.env` file is gitignored for security. Never commit sensitive credentials.

### Docker Management Commands

```bash
# Start development environment
./docker-dev.sh start

# Stop development environment  
./docker-dev.sh stop

# View live application logs
./docker-dev.sh logs

# Run the complete test suite
./docker-dev.sh test

# Open shell inside the Django container
./docker-dev.sh shell

# Complete cleanup (removes all containers and data)
./docker-dev.sh clean
```

**Note**: These commands work from **any directory** in the project!

### Development Workflow

#### Backend Development (Docker)
1. **Start backend**: `./docker-dev.sh start`
2. **Make Python changes** in `backend/`
3. **Changes auto-reload** (Django development server)
4. **Run tests**: `./docker-dev.sh test`
5. **View logs**: `./docker-dev.sh logs`
6. **Stop when done**: `./docker-dev.sh stop`

#### Frontend Development (Local)
1. **Start frontend**: `cd frontend && npm run dev`
2. **Make React/TypeScript changes** in `frontend/src/`
3. **Changes show instantly** (Vite hot reload)
4. **Access dashboard**: `http://localhost:3000`
5. **API calls proxy** to backend automatically

#### Full Stack Development
1. **Terminal 1**: `./docker-dev.sh start` (backend)
2. **Terminal 2**: `cd frontend && npm run dev` (frontend)
3. **Develop with both running** - they connect automatically!
4. **Backend changes**: Auto-reload in Docker
5. **Frontend changes**: Instant hot reload
6. **API testing**: Use dashboard or curl commands

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health/` | Health check |
| `GET` | `/api/v1/types/` | Available transformation types |
| `POST` | `/api/v1/transform/` | Apply single transformation |
| `POST` | `/api/v1/batch-transform/` | Apply multiple transformations |
| `GET` | `/api/docs/` | Interactive Swagger UI documentation |
| `GET` | `/api/redoc/` | ReDoc API documentation |

## Testing the API

### 1. Health Check
```bash
curl -X GET http://localhost:8000/api/v1/health/
```

**Expected Response:**
```json
{
    "status": "healthy",
    "message": "Data transformation API is running",
    "timestamp": 1751315921.035094
}
```

### 2. Get Available Transformations
```bash
curl -X GET http://localhost:8000/api/v1/types/
```

### 3. Sample Data Transformations

#### **Aggregate Example** - Group sales by region
```bash
curl -X POST http://localhost:8000/api/v1/transform/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"region": "North", "sales": 100, "product": "A"},
      {"region": "North", "sales": 150, "product": "B"},
      {"region": "South", "sales": 200, "product": "A"},
      {"region": "South", "sales": 120, "product": "B"}
    ],
    "transformation_type": "aggregate",
    "parameters": {
      "group_by": ["region"],
      "aggregations": {"sales": "sum"}
    }
  }'
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Successfully applied aggregate transformation",
    "data": [
        {"region": "North", "sales": 250},
        {"region": "South", "sales": 320}
    ],
    "metadata": {
        "original_rows": 4,
        "transformed_rows": 2
    },
    "processing_time_ms": 7.82
}
```

#### **Filter Example** - Filter people by age
```bash
curl -X POST http://localhost:8000/api/v1/transform/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"name": "Alice", "age": 30, "city": "New York"},
      {"name": "Bob", "age": 25, "city": "Los Angeles"}, 
      {"name": "Charlie", "age": 35, "city": "New York"}
    ],
    "transformation_type": "filter",
    "parameters": {
      "conditions": {"field": "age", "operator": "gte", "value": 30}
    }
  }'
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {"name": "Alice", "age": 30, "city": "New York"},
        {"name": "Charlie", "age": 35, "city": "New York"}
    ],
    "metadata": {
        "original_rows": 3,
        "filtered_rows": 2
    }
}
```

## Data Transformation Types

### 1. **Aggregate** - Group and summarize data
- **Group by**: One or more columns
- **Functions**: `sum`, `mean`, `count`, `min`, `max`, `std`

### 2. **Filter** - Filter rows based on conditions  
- **Operators**: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`
- **Multiple conditions**: Supported with AND logic

### 3. **Normalize** - Scale numerical data
- **Methods**: `min_max`, `z_score`, `robust`
- **Multiple columns**: Batch normalization supported

### 4. **Pivot** - Reshape data for cross-tabulation
- **Flexible aggregation**: Custom aggregation functions
- **Multi-dimensional**: Complex pivot operations

## Testing

### Run Complete Test Suite
```bash
./docker-dev.sh test
```

**Test Coverage:**
- **31 comprehensive tests**
- **Unit tests** for all transformation functions
- **Integration tests** for API endpoints  
- **Performance tests** with 1000+ record datasets
- **Error handling tests** for edge cases

### Expected Test Results
```
Found 31 test(s).
Ran 31 tests in 0.069s

OK
```

## Docker Architecture

### Container Overview
- **`backend-web-1`**: Django application server
- **`backend-db-1`**: PostgreSQL 15 database
- **Network**: Isolated Docker network
- **Volumes**: Persistent database storage

### Port Mapping
- **Django API**: `localhost:8000` → `container:8000`
- **PostgreSQL**: `localhost:5433` → `container:5432`

**Database Isolation**: Uses port 5433 to avoid conflicts with existing PostgreSQL installations.

### Traditional Setup vs Docker

| Traditional Setup | Docker Setup |
|-------------------|--------------|
| Install Python 3.11 locally | Handled by container |
| Create virtual environment | Handled by container |
| `pip install -r requirements.txt` | Handled by container |
| Install PostgreSQL locally | Handled by container |
| Configure database connection | Handled by container |
| Run `python manage.py migrate` | Handled automatically |
| Manage dependencies conflicts | No conflicts possible |
| Cross-platform compatibility | Works anywhere Docker runs |

**Result**: `./docker-dev.sh start` vs 15+ manual steps!

## Troubleshooting

### Common Issues

**Q: Container won't start**
```bash
# Check Docker status
docker-compose ps

# View error logs
./docker-dev.sh logs
```

**Q: Port already in use**
```bash
# Stop any existing containers
./docker-dev.sh stop

# Or use complete cleanup
./docker-dev.sh clean
```

**Q: Database connection issues**
```bash
# Restart with fresh database
./docker-dev.sh clean
./docker-dev.sh start
```

### Performance Notes
- **First startup**: Initial setup downloads Docker images and installs dependencies
- **Subsequent starts**: ~10-15 seconds (images cached locally)
- **Processing speed**: 1000+ records in <4ms
- **Container overhead**: Minimal impact on performance

## Access Your Application

### **Frontend Dashboard** (Main Interface)
**URL**: `http://localhost:3000`
- Interactive data transformation dashboard
- Load sample data (sales, users, products)
- Real-time transformation preview
- Modern, responsive UI

### **Backend API** (Development/Testing)
**URL**: `http://localhost:8000`
- `GET /api/v1/health/` - Health check
- `GET /api/v1/types/` - Available transformations
- `POST /api/v1/transform/` - Transform data
- `GET /api/docs/` - Interactive Swagger documentation

### **How They Connect**
- Frontend makes API calls to `/api/v1/...`
- Vite proxy automatically forwards to `localhost:8000`
- No CORS issues - seamless integration
- Real-time updates from backend to frontend

## Usage Examples

### Using the Dashboard (Recommended)
1. **Open**: `http://localhost:3000`
2. **Load Sample Data**: Click "Load Sales Data"
3. **Select Transformation**: Choose "Aggregate"
4. **Configure**: Group by "region", Sum "sales"
5. **Execute**: See results instantly in the table

### Using API Directly (curl)
```bash
# Transform sales data by region
curl -X POST http://localhost:8000/api/v1/transform/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"region": "North", "sales": 100},
      {"region": "South", "sales": 200}
    ],
    "transformation_type": "aggregate",
    "parameters": {
      "group_by": ["region"],
      "aggregations": {"sales": "sum"}
    }
  }'
```

## Next Steps

1. **Backend Complete** - Full data transformation pipeline
2. **Frontend Complete** - Interactive React dashboard  
3. **Ready for Production** - Docker deployment configuration available

## Tips

### Backend (Docker)
- **Auto-reload**: Django code changes automatically restart the server
- **Database persistence**: Data survives container restarts
- **Easy cleanup**: `./docker-dev.sh clean` removes everything
- **Cross-platform**: Backend works on macOS, Linux, and Windows
- **No Python dependencies**: Django and PostgreSQL run in containers

### Frontend (Local)
- **Hot reload**: React changes show instantly with Vite
- **Node.js required**: Need Node.js 18+ installed locally
- **Fast development**: No Docker build overhead for frontend changes
- **Proxy configured**: API calls automatically route to backend
- **TypeScript support**: Full type checking and IntelliSense

## Design Decisions and Assumptions

### **Architecture Decisions**

**Backend Technology Choices:**
- **Django ORM over SQLAlchemy**: Chosen for rapid development and seamless integration with Django REST Framework. Django ORM provides built-in admin interface, migrations, and model management that accelerates project delivery compared to standalone SQLAlchemy setup.
- **Functional Programming Approach**: Transformation functions use pure functions with pandas/numpy for predictable, testable data operations.
- **Docker Containerization**: Backend runs in containers to handle complex Python/PostgreSQL dependencies and ensure consistent environments across development and production.

**Frontend Technology Choices:**
- **React 18 + TypeScript**: Type safety and modern React features for robust user interface development.
- **Local Development**: Frontend runs locally for fast hot reload and debugging, while API calls proxy to containerized backend.
- **Component Architecture**: Modular, reusable components following React best practices.

### **Implementation Assumptions**

**Data Processing Assumptions:**
- Input data is provided as JSON arrays of objects with consistent schemas
- Numerical columns are properly typed for normalization operations
- Data size typically ranges from 10-10,000 records for UI responsiveness
- Users understand basic data transformation concepts (group by, filtering, etc.)

**Performance Assumptions:**
- Client-side filtering/sorting is acceptable for datasets under 1,000 records
- Backend processing time should be under 100ms for typical operations
- Real-time transformation preview is more valuable than batch processing

**User Experience Assumptions:**
- Users prefer interactive dashboard over API-only interface
- Sample data helps with immediate onboarding and testing
- Error messages should be user-friendly rather than technical
- Mobile responsiveness is important for modern web applications

**Development Assumptions:**
- Docker is available in all development environments
- Node.js 18+ is acceptable requirement for frontend development
- PostgreSQL is preferred over SQLite for production readiness
- Git workflow supports feature branch development

## Production Deployment Options

### **Ready for Immediate Deployment**

> **Note**: This project was developed as a time-limited assessment and was not actually deployed to production. However, the codebase is production-ready and deployment-ready. Below are the exact steps we would take for deployment if this were a real project.

**Quick Deploy Options:**
- **Frontend**: Netlify, Vercel, or AWS Amplify (connect GitHub repo)
- **Backend**: Railway, Render, or Heroku (Docker-based deployment)
- **Database**: Use managed PostgreSQL from hosting provider

**Current Status:**
- ✅ Docker backend container ready
- ✅ Frontend build process configured 
- ✅ Environment variables documented
- ✅ Database migrations included
- ✅ All API endpoints tested
- ✅ Production-ready codebase with comprehensive testing

### **Future AWS Architecture (Additional Development Required)**

**Backend Deployment:**
- **ECS Fargate**: Containerized Django API with auto-scaling
- **Application Load Balancer**: High availability and health checks
- **RDS PostgreSQL**: Managed database with Multi-AZ setup
- **ElastiCache Redis**: Session storage and caching

**Frontend Deployment:**
- **S3 + CloudFront**: Static hosting with global CDN
- **Route 53**: DNS management and SSL certificates
- **Build Pipeline**: Automated deployment from GitHub

### **Infrastructure Components**

**Backend Infrastructure:**
- **ECS Fargate**: Serverless container orchestration for Django API
- **Application Load Balancer**: High availability with health checks
- **RDS PostgreSQL**: Managed database with automated backups and Multi-AZ
- **ElastiCache Redis**: Session storage and caching layer
- **VPC**: Private subnets for database, public for load balancer
- **CloudWatch**: Logging, monitoring, and alerting
- **Secrets Manager**: Environment variables and database credentials

**Frontend Infrastructure:**
- **S3 Static Hosting**: React build output with versioning
- **CloudFront**: Global CDN with caching and compression
- **Route 53**: DNS management with health checks
- **Certificate Manager**: SSL/TLS certificates
- **CloudFormation**: Infrastructure as Code

### **Deployment Pipeline**

**CI/CD with GitHub Actions:**
- **Backend Pipeline**: Test → Build Docker Image → Push to ECR → Deploy to ECS
- **Frontend Pipeline**: Test → Build React App → Deploy to S3 → Invalidate CloudFront

**Environment Strategy:**
- **Development**: Local Docker + frontend dev server
- **Staging**: AWS ECS + S3 with staging database
- **Production**: AWS ECS + S3 with production database + monitoring

### **Cost Optimization**

**Backend Costs:**
- **ECS Fargate**: Pay-per-use, scales to zero during low traffic
- **RDS**: Right-sized instances with Reserved Instances for predictable workloads
- **ALB**: Shared across multiple services

**Frontend Costs:**
- **S3**: Minimal storage costs for static files
- **CloudFront**: Pay-per-request with free tier coverage
- **Route 53**: Low cost for DNS queries

**Next Steps for Production Deployment:**
- **Immediate Deploy**: Connect to Railway/Netlify for quick deployment
- **AWS ECS Setup**: Create task definitions and networking configuration
- **CI/CD Pipeline**: Implement GitHub Actions workflow for automated deployments
- **Production Configuration**: Set up environment secrets and monitoring
- **Full AWS Architecture**: Complete enterprise-grade infrastructure setup

> **Assessment Context**: Given time constraints, we focused on building a robust, testable application rather than actual deployment. The architecture and deployment plan above represents exactly how we would proceed in a real project scenario.

**Estimated Monthly Costs (Low Traffic):**
- **Simple Deployment**: $0-25 (Railway/Netlify free tiers)
- **AWS Production**: $50-100 (Fargate + RDS + CloudFront)
- **Enterprise AWS**: $200+ (Multi-AZ, monitoring, redundancy)

### **Alternative Deployment Options**

**Budget-Friendly Alternatives:**
- **Frontend**: Netlify (free tier) or Vercel with GitHub integration
- **Backend**: Railway, Render, or DigitalOcean App Platform
- **Database**: Managed PostgreSQL from cloud provider

**Enterprise Alternatives:**
- **Kubernetes**: EKS for complex microservices architecture  
- **Serverless**: Lambda + API Gateway for variable workloads
- **Multi-Region**: Cross-region deployment for global availability



