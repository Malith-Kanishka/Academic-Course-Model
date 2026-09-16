import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# This securely loads your GROQ_API_KEY from the .env file
load_dotenv()

class SocraticAdversary:
    def __init__(self):
        # We connect to Groq's lightning-fast Llama 3 model
        self.llm = ChatGroq(model_name="llama3-8b-8192", temperature=0.7)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Socratic tutor in a live oral examination. 
            Your goal is to test the student's understanding by challenging their claims.
            
            Rules:
            1. Never just give the student the correct answer.
            2. If they make a broad claim, ask them for a specific analogy.
            3. If they sound confused, play the "Novice" and ask them to explain it simpler.
            4. Keep your responses under 3 sentences so it feels like a natural conversation."""),
            ("user", "Student said: {student_text}")
        ])
        
        self.chain = self.prompt | self.llm | StrOutputParser()

    def generate_response(self, student_text: str) -> str:
        """Takes the student's transcribed audio text and generates an argument."""
        try:
            return self.chain.invoke({"student_text": student_text})
        except Exception as e:
            return f"Error connecting to Groq AI: {str(e)}"

# Quick test block to see if it works when we run this file directly
if __name__ == "__main__":
    agent = SocraticAdversary()
    
    test_input = "I think polymorphism means classes share an interface."
    
    print("\nStudent: ", test_input)
    print("\nThinking (Groq is processing)...")
    
    # This will trigger the fast Groq API!
    response = agent.generate_response(test_input)
    
    print("\nAI Tutor: ", response)
    print("\n")