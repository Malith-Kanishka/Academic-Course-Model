from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.agents.socratic_adversary_agent import SocraticAdversary

# Initialize the FastAPI app
app = FastAPI(title="ACM AI Microservice", version="1.0")

# Initialize your AI Agent
socratic_agent = SocraticAdversary()

# Define the JSON structure we expect from the C# API
class DialogueRequest(BaseModel):
    session_id: str
    student_text: str

# Define the JSON structure we will send back to the C# API
class AIResponse(BaseModel):
    ai_text: str

@app.post("/api/ai/process", response_model=AIResponse)
async def process_dialogue(request: DialogueRequest):
    try:
        # Pass the text to your LangChain agent
        response_text = socratic_agent.generate_response(request.student_text)
        
        return AIResponse(ai_text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# A simple health check endpoint so we know the server is running
@app.get("/health")
async def health_check():
    return {"status": "AI Service is online and ready!"}