

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
