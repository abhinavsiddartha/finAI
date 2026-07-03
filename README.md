# FinAI - AI Personal Finance Dashboard

Full-stack AI-powered finance tracker built with FastAPI, React, PostgreSQL and Groq AI.

## Features
- JWT Authentication
- Track Income and Expenses
- Visual Charts and Analytics
- AI Finance Assistant (Groq AI)
- CSV Import Support

## Tech Stack
- Frontend: React 18, Recharts
- Backend: Python FastAPI
- Database: PostgreSQL
- AI: Groq AI (Llama 3.3 70B)
- Auth: JWT Tokens

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```



