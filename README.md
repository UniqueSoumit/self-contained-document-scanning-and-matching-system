# Setup instructions

1. Clone the Repository:
Clone the project from the GitHub repository using git clone your-repository-url.
Navigate into the project directory using cd document-scanning-system.
2. Install Dependencies:
For Flask (Python):
Set up a virtual environment (python3 -m venv venv).
Install dependencies with pip install -r requirements.txt.
For Express (Node.js):
Run npm install in the backend directory to install dependencies.
3. Set Up the Database:
SQLite:
Automatically created upon first run.
Or manually create tables for users, documents, and credit requests using the provided Python code.
JSON (Optional):
Modify backend to use JSON for storage if desired.
4. Configure API Endpoints:
Set up routes for user authentication, profile, document upload, credit request, and document matching.
Example routes: /auth/register, /auth/login, /scanUpload, /matches/:docId, /credits/request.
5. Run the Application:
For Flask: Run with python3 app.py (default: http://127.0.0.1:5000).
For Express: Run with npm start (default: http://localhost:3000).
6. Frontend Access:
Open your browser and go to http://127.0.0.1:5000 (Flask) or http://localhost:3000 (Express).
7. Testing:
Test the system by:
Registering and logging in users.
Uploading documents for scanning.
Testing the credit system with daily reset and admin approval for additional credits.
8. Optional Features:
Implement AI-based document matching (using OpenAI, Gemini, or other NLP tools).
Create an admin dashboard to approve credits and track usage.
9. Documentation:
Update README.md with setup instructions, API documentation, and relevant project details
