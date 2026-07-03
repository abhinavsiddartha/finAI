from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db
import models, auth
import csv, io

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

VALID_CATEGORIES = [
    "Food", "Housing", "Transport", "Entertainment",
    "Health", "Shopping", "Education", "Salary", "Investment", "Other"
]

class TransactionCreate(BaseModel):
    title: str
    amount: float
    type: models.TransactionType
    category: str
    note: Optional[str] = None
    date: Optional[datetime] = None

class TransactionOut(BaseModel):
    id: int
    title: str
    amount: float
    type: str
    category: str
    note: Optional[str]
    date: datetime
    user_id: int
    class Config:
        from_attributes = True

@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    txs = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")
    by_category = {}
    for t in txs:
        if t.type == "expense":
            by_category[t.category] = by_category.get(t.category, 0) + t.amount
    monthly = {}
    for t in txs:
        key = t.date.strftime("%Y-%m")
        if key not in monthly:
            monthly[key] = {"income": 0, "expense": 0}
        monthly[key][t.type] += t.amount
    return {"total_income": total_income, "total_expense": total_expense, "balance": total_income - total_expense, "by_category": by_category, "monthly": monthly}

@router.get("/", response_model=List[TransactionOut])
def get_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.date.desc()).all()

@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    tx = models.Transaction(**payload.model_dump(exclude_none=True), user_id=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id, models.Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()

@router.post("/upload-csv", status_code=201)
def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    for row in reader:
        try:
            tx = models.Transaction(title=row["title"], amount=float(row["amount"]), type=row["type"], category=row.get("category", "Other"), note=row.get("note", ""), user_id=current_user.id)
            db.add(tx)
            created += 1
        except Exception:
            continue
    db.commit()
    return {"message": f"{created} transactions imported"}