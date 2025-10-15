from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Test API")

@app.get("/")
async def root():
    return {"message": "Test API is working"}

if __name__ == "__main__":
    uvicorn.run("app.main_test:app", host="0.0.0.0", port=8000, reload=True)