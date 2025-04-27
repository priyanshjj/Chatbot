from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Gemini API configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model - using the correct model name
model = genai.GenerativeModel('gemini-1.5-pro')

# Gardening system prompt
FINANCE_SYSTEM_PROMPT = """
You are FinTrackBot, a finance tracking assistant. Your role is to help users manage their personal finance, track spending, understand budgeting, savings, investment tips, and generate expense summaries.

Rules:
1. ONLY provide financial insights and advice.
2. Redirect or refuse non-finance-related queries politely.
3. Give detailed, actionable budgeting and saving tips.
4. Use clear language for users new to finance.
5. Avoid suggesting specific financial products.
6. Keep a helpful and professional tone.
7. You can also perform basic calculations like EMI (Equated Monthly Installments). 
   If a user gives loan amount, interest rate, and tenure, calculate EMI using:

   EMI = (P × r × (1 + r)^n) / ((1 + r)^n – 1)

   where:
   - P = loan amount
   - r = monthly interest rate (annual / 12 / 100)
   - n = number of months (years × 12)

"""


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        print(f"Received message: {user_message}")
        
        # Create a conversation with the system prompt
        chat = model.start_chat(history=[])
        
        # First, set the context with the system prompt
        chat.send_message(FINANCE_SYSTEM_PROMPT)

        
        # Then send the user's message
        response = chat.send_message(user_message)
        
        # Extract the response text
        bot_response = response.text
        
        print(f"Final bot response: {bot_response}")
        
        return jsonify({
            'response': bot_response,
            'status': 'success'
        })
        
    except Exception as e:
        error_message = str(e)
        print(f"Error: {error_message}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No additional details'}")
        
        # Check for rate limit errors
        if "429" in error_message and "quota" in error_message.lower():
            retry_message = "I'm currently experiencing high demand. Please try again in a minute or two."
            return jsonify({
                'response': retry_message,
                'status': 'rate_limit',
                'error': error_message
            }), 429
        elif "API key" in error_message:
            return jsonify({
                'response': 'There seems to be an issue with the API key. Please check the configuration.',
                'status': 'error',
                'error': error_message
            }), 500
        else:
            return jsonify({
                'response': f'Sorry, I encountered an error: {error_message}',
                'status': 'error',
                'error': error_message
            }), 500

if __name__ == '__main__':
    print(f"Starting Flask server with Gemini API key: {GEMINI_API_KEY[:5]}...")
    app.run(debug=True, port=5000) 