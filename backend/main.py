from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routes import users, transactions, ai_insights

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Personal Finance Dashboard API",
    description="Track expenses, get AI-powered insights.",
    version="1.0.0"
)

# ✅ FIXED CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",      # ✅ ADD THIS
        "http://127.0.0.1:5174",      # ✅ ADD THIS
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(ai_insights.router)

@app.get("/")
def root():
    return {"message": "AI Finance Dashboard API is running 🚀"}