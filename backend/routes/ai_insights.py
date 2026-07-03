from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models, auth
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI"])

# ✅ Check if API key exists
api_key = os.getenv("GROQ_API_KEY")
client = None
if api_key:
    client = Groq(api_key=api_key)
else:
    print("WARNING: GROQ_API_KEY not found in .env. AI features will not work.")

class ChatMessage(BaseModel):
    message: str


def generate_mock_insights(user, db):
    txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id
    ).all()

    if not txs:
        return (
            "- Welcome to FinAI, {}! Get started by adding your first transactions.\n"
            "- Tip: Use the CSV import option on the Transactions tab to import your transactions in bulk.\n"
            "- Notice: Configure your GROQ_API_KEY in the `backend/.env` file to enable advanced Llama 3.3 insights!"
        ).format(user.name)

    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")
    balance = total_income - total_expense

    by_category = {}
    for t in txs:
        if t.type == "expense":
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

    top_category = None
    top_amount = 0.0
    if by_category:
        top_category = max(by_category, key=by_category.get)
        top_amount = by_category[top_category]

    insights = []
    
    if total_income > 0:
        savings_rate = (balance / total_income) * 100
        if savings_rate >= 20:
            insights.append(f"- Savings status: Excellent! You have saved Rs.{balance:.2f} this period (savings rate: {savings_rate:.1f}%).")
        elif savings_rate > 0:
            insights.append(f"- Savings status: Good, but you can save more. You saved Rs.{balance:.2f} (savings rate: {savings_rate:.1f}%). Target a 20% savings rate.")
        else:
            insights.append(f"- Budget alert: Your expenses (Rs.{total_expense:.2f}) exceed your income (Rs.{total_income:.2f}) by Rs.{abs(balance):.2f}. Consider reducing discretionary spending.")
    else:
        if total_expense > 0:
            insights.append(f"- Budget alert: You have recorded Rs.{total_expense:.2f} in expenses but no income yet. Try adding some income streams to balance your sheet.")
        else:
            insights.append(f"- Transaction summary: Your balance is Rs.0.00. Start logging transactions to view analytics.")

    if top_category:
        insights.append(f"- Spending highlight: Your highest spending category is {top_category} at Rs.{top_amount:.2f}. Try setting a budget cap here next month.")
    else:
        insights.append("- Saving tip: Allocate your income using the 50/30/20 budget rule (50% needs, 30% wants, 20% savings).")

    insights.append("- Demo Mode: Set `GROQ_API_KEY` in `backend/.env` to activate advanced AI Llama 3.3 analysis.")

    return "\n".join(insights)


def generate_mock_chat_reply(user, db, message):
    message_lower = message.lower()
    
    txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id
    ).all()

    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")
    balance = total_income - total_expense

    by_category = {}
    for t in txs:
        if t.type == "expense":
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

    if "food" in message_lower or "eat" in message_lower or "restaurant" in message_lower:
        food_spend = by_category.get("Food", 0.0)
        if food_spend > 0:
            reply = f"Hi {user.name}! You've spent Rs.{food_spend:.2f} on Food so far. Eating out and ordering deliveries can add up quickly. Try meal-prepping or cooking at home to keep this under control."
        else:
            reply = f"Hi {user.name}! You haven't recorded any expenses in the 'Food' category yet. If you have spent on groceries or dining, make sure to add it under the 'Food' category."
            
    elif "save" in message_lower or "saving" in message_lower or "budget" in message_lower:
        if total_income > 0:
            savings_rate = (balance / total_income) * 100
            reply = f"Your current savings rate is {savings_rate:.1f}%. I recommend adopting the 50/30/20 budget rule:\n- 50% for Needs (Housing, Bills)\n- 30% for Wants (Entertainment, Shopping)\n- 20% for Savings or Debt repayment."
        else:
            reply = "To give you custom savings advice, I need some income details. Please log your income transactions first! A good general target is to save 20% of your earnings."

    elif "spend" in message_lower or "expense" in message_lower or "outflow" in message_lower:
        cat_breakdown = ", ".join([f"{k}: Rs.{v:.2f}" for k, v in by_category.items()]) if by_category else "none yet"
        reply = f"You have spent a total of Rs.{total_expense:.2f} this period. Your breakdown by category is: {cat_breakdown}."
        
    elif "income" in message_lower or "salary" in message_lower or "earn" in message_lower:
        reply = f"Your total recorded income is Rs.{total_income:.2f}."

    elif "hello" in message_lower or "hi" in message_lower or "hey" in message_lower:
        reply = f"Hello {user.name}! I'm FinBot. Ask me about your spending, how to save more, or a category breakdown. I'm here to help!"

    else:
        reply = (
            f"Here is a summary of your financial dashboard, {user.name}:\n"
            f"- Total Income: Rs.{total_income:.2f}\n"
            f"- Total Expenses: Rs.{total_expense:.2f}\n"
            f"- Net Balance: Rs.{balance:.2f}\n\n"
            "Ask me questions like 'How much did I spend on food?' or 'How can I save more?' for custom tips!"
        )

    reply += "\n\n*(FinBot running in Offline Demo Mode. Configure `GROQ_API_KEY` in `backend/.env` for real-time Llama 3.3 assistant)*"
    return reply


def build_context(user, db):
    txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id
    ).limit(50).all()

    if not txs:
        return "No transactions yet."

    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")

    by_category = {}
    for t in txs:
        if t.type == "expense":
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

    cat_str = "\n".join(
        f"- {k}: Rs.{v:.2f}" for k, v in by_category.items()
    )

    return (
        f"User: {user.name}\n"
        f"Income: Rs.{total_income}\n"
        f"Expenses: Rs.{total_expense}\n"
        f"Balance: Rs.{total_income - total_expense}\n\n"
        f"By category:\n{cat_str}"
    )


# ===================== CHAT =====================
@router.post("/chat")
def ai_chat(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not client:
        reply = generate_mock_chat_reply(current_user, db, payload.message)
        return {"reply": reply}
    try:
        print("✅ AI endpoint hit")

        context = build_context(current_user, db)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # ✅ CONFIRMED WORKING MODEL
            messages=[
                {
                    "role": "system",
                    "content": "You are FinBot, a helpful personal finance AI. Give clear and useful advice."
                },
                {
                    "role": "user",
                    "content": f"User financial data:\n{context}\n\nQuestion: {payload.message}"
                }
            ]
        )

        reply = response.choices[0].message.content

        print("✅ AI Response:", reply)

        return {"reply": reply}

    except Exception as e:
        print("❌ ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auto-insights")
def auto_insights(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not client:
        insights = generate_mock_insights(current_user, db)
        return {"insights": insights}
    try:
        context = build_context(current_user, db)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # ✅ SAME MODEL
            messages=[
                {
                    "role": "system",
                    "content": "You are a financial analyst. Give short, practical insights."
                },
                {
                    "role": "user",
                    "content": f"Give 3 bullet-point financial insights based on:\n{context}"
                }
            ]
        )

        insights = response.choices[0].message.content

        print("✅ Insights:", insights)

        return {"insights": insights}

    except Exception as e:
        print("❌ ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))