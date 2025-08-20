# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend stage  
FROM python:3.9-slim
WORKDIR /app

# Install backend dependencies
COPY formanova-api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY formanova-api/ ./

# Copy frontend build
COPY --from=frontend-build /app/dist ./static

# Expose port
EXPOSE 8000

# Run backend with static file serving
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]