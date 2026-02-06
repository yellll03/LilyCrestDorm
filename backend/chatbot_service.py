import os
import asyncio
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid

load_dotenv()

app = Flask(__name__)
CORS(app)

EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')

# System prompt for the dormitory chatbot
SYSTEM_PROMPT = '''You are Lily, a friendly and helpful AI assistant for LilyCrest Dormitory - a premium co-living space in Makati City, Philippines.

Your role is to help tenants with:
1. **Billing & Payments**: Payment methods (Bank Transfer - BDO/BPI, Online Payment), due dates, late fees (₱50/day), grace period (2 days)
2. **House Rules**: Quiet hours (10PM-7AM), visitor policy, curfew, cleanliness standards
3. **Maintenance**: How to submit requests, expected response times, emergency contacts
4. **Amenities**: WiFi, Air Conditioning, Shared Kitchen, Common Lounge, Laundry Area
5. **Contract & Documents**: Lease terms, move-in/out procedures, deposit requirements

Key Information:
- Address: #7 Gil Puyat Ave. cor Marconi St. Brgy Palanan, Makati City
- Contact: +63 912 345 6789
- Email: support@lilycrest.ph
- Room types: Standard (₱5,400/month), Deluxe (₱7,200/month), Premium (₱9,000/month)
- Payment due: 5th of each month

Be warm, professional, and concise. Use Filipino expressions occasionally (like "po") to be friendly.
If a tenant has a complex issue, suggest they contact the admin office or submit a support ticket.
Always end with asking if there's anything else you can help with.'''

# Store chat sessions in memory (in production, use Redis or database)
chat_sessions = {}

def get_or_create_chat(session_id):
    if session_id not in chat_sessions:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
        chat_sessions[session_id] = chat
    return chat_sessions[session_id]

@app.route('/api/chatbot/message', methods=['POST'])
def chat_message():
    try:
        data = request.get_json()
        message = data.get('message', '')
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        chat = get_or_create_chat(session_id)
        user_message = UserMessage(text=message)
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(chat.send_message(user_message))
        loop.close()
        
        return jsonify({
            'response': response,
            'session_id': session_id
        })
    except Exception as e:
        print(f'Chatbot error: {e}')
        return jsonify({
            'response': "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact the admin office directly at +63 912 345 6789.",
            'error': str(e)
        }), 500

@app.route('/api/chatbot/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'gemini-2.5-flash'})

@app.route('/api/chatbot/reset', methods=['POST'])
def reset_session():
    data = request.get_json()
    session_id = data.get('session_id')
    if session_id and session_id in chat_sessions:
        del chat_sessions[session_id]
    return jsonify({'message': 'Session reset successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002, debug=False)
