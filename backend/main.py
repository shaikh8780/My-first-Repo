"""
Novartis ESG AI-Enabled Sustainability Report Generation — FastAPI Backend

Runs on ECS Fargate behind an Application Load Balancer.
All /api/* routes require Cognito JWT authentication (enforced at router level).
"""
import logging
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Surface app logger output (e.g. ai.py Bedrock errors) in the ECS/CloudWatch
# stream. uvicorn configures its own loggers but not the root, so app loggers
# would otherwise be silent.
logging.basicConfig(level=logging.INFO)

from auth import get_current_user
from routers import api

APP_NAME = os.environ.get('APP_NAME', 'Novartis ESG AI-Enabled Sustainability Report Generation')
APP_HOSTNAME = os.environ.get('APP_HOSTNAME', 'localhost')

app = FastAPI(title=APP_NAME, version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f'https://{APP_HOSTNAME}',
        'http://localhost:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# Health check — unauthenticated (ALB health check)
@app.get('/health')
async def health():
    return {'status': 'healthy', 'service': APP_NAME, 'timestamp': int(time.time())}


# All API routes require auth — enforced by router-level dependency
app.include_router(api.router, prefix='/api', dependencies=[__import__('fastapi').Depends(get_current_user)])
