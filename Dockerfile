# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (required for OpenCV/PIL if needed)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the backend requirements file
COPY backend/requirements.txt .

# Install PyTorch CPU explicitly (Saves RAM/Disk space and avoids GPU requirement)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install the remaining backend dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ /app/backend/

# Copy the trained model weights (These must be uploaded to HF via LFS or manually)
COPY ml_pipeline/agrivision_output/ /app/ml_pipeline/agrivision_output/

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Command to run the FastAPI application
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
