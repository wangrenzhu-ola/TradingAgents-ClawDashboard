from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, results, config

app = FastAPI(
    title="TradingAgents Dashboard API",
    description="API for managing TradingAgents tasks and visualization",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Production build (potentially)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(results.router)
app.include_router(config.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
