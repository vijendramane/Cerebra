# import os
# from typing import Dict, Any
# import google.generativeai as genai
# from dotenv import load_dotenv

# load_dotenv()

# class SimpleAI:
#     def __init__(self):
#         self.api_key = os.getenv("GOOGLE_API_KEY")
#         if self.api_key:
#             genai.configure(api_key=self.api_key)
#             self.model = genai.GenerativeModel('gemini-pro')
#         else:
#             self.model = None
    
#     def generate_text(self, prompt: str) -> str:
#         if not self.model:
#             return "Please configure your Google API key in .env file"
        
#         try:
#             response = self.model.generate_content(prompt)
#             return response.text
#         except Exception as e:
#             return f"Error generating response: {str(e)}"

# # Test function
# if __name__ == "__main__":
#     ai = SimpleAI()
#     result = ai.generate_text("Write a haiku about Python programming")
#     print(result)



from huggingface_hub import InferenceClient

# Your API Key
HF_API_KEY = "api_key_here"

# Initialize client
client = InferenceClient(token=HF_API_KEY)

def get_ai_response(prompt, model_name):
    """
    Get response from Hugging Face model
    """
    try:
        messages = [{"role": "user", "content": prompt}]
        
        response = client.chat_completion(
            model=model_name,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        return f"Error: {str(e)}"

# Test it
if __name__ == "__main__":
    prompt = "What is artificial intelligence?"
    model = "meta-llama/Meta-Llama-3.1-8B-Instruct"
    
    print(f"Testing: {model}")
    print(f"Prompt: {prompt}")
    print(f"Response: {get_ai_response(prompt, model)}")