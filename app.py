import gradio as gr
from backend.app import app as fastapi_app

# Create a minimal Gradio UI to satisfy Hugging Face Spaces
with gr.Blocks(title="AgriVision AI") as demo:
    gr.Markdown("# 🌱 AgriVision AI Backend API")
    gr.Markdown("The FastAPI inference backend is running successfully! Send POST requests directly to `/predict`.")

# Mount the Gradio UI onto our existing FastAPI application
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
