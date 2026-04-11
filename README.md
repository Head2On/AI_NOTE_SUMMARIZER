# AI Note Summarizer

A Django-based backend for a note-taking application with AI-powered summarization and other features.

## Features

- User registration and authentication (including password change, forgot password, and password reset)
- JWT-based authentication (login, logout, token refresh)
- User profile management
- Note management (create, list, detail, update, delete)
- Note sharing (generate share link, disable share link, share with specific users)
- Public notes
- Note versioning and restoration
- Note summarization, translation, and rewriting using AI
- Note export to TXT and PDF
- Soft delete and trash functionality
- Search notes

## API Endpoints

### Authentication (`/api/auth/`)

- `POST /api/auth/firebase/`: (New) Exchange Firebase ID tokens for Django JWT tokens
- `POST /api/login/`: Obtain JWT token pair.
- `GET /api/auth/profile/`: Get user profile information.
- `POST /api/auth/change-password/`: Change user password.
- `POST /api/auth/forgot-password/`: Request a password reset OTP.
- `POST /api/auth/reset-password/`: Reset password using OTP.
- `POST /api/login/`: Obtain JWT token pair.
- `POST /api/logout/`: Logout user.
- `POST /api/token/refresh/`: Refresh JWT token.

### Notes (`/api/notes/`)

- `POST /api/notes/upload/`: Upload a new note.
- `GET /api/notes/`: List notes (supports pagination and ?sort=newest).
- `GET /api/notes/<uuid:pk>/`: Get a single note by its ID.
- `PATCH /api/notes/<uuid:pk>/update/`: Update a note.
- `DELETE /api/notes/<uuid:pk>/delete/`: Soft delete a note.
- `GET /api/notes/trash/`: Get a list of soft-deleted notes.
- `POST /api/notes/<uuid:pk>/restore/`: Restore a soft-deleted note.
- `DELETE /api/notes/<uuid:pk>/delete/permanent/`: Permanently delete a note.
- `POST /api/notes/<uuid:pk>/share/`: Generate a shareable link for a note.
- `POST /api/notes/<uuid:pk>/share/disable/`: Disable the shareable link for a note.
- `GET /api/notes/public/<uuid:pk>/`: Get a public note.
- `GET /api/notes/search/`: Search for notes.
- `GET /api/notes/<uuid:pk>/versions/`: Get a list of all versions of a note.
- `POST /api/notes/<uuid:pk>/versions/restore/<int:version_id>/`: Restore a specific version of a note.
- `POST /api/notes/<uuid:pk>/rewrite/`: Rewrite a note using AI.
- `GET /api/notes/<uuid:pk>/summary/`: Get a summary of a note.
- `GET /api/notes/<uuid:pk>/translate/`: Translate a note.
- `GET /api/notes/<uuid:pk>/export/txt/`: Export a note to TXT.
- `GET /api/notes/<uuid:pk>/export/pdf/`: Export a note to PDF.
- `POST /api/notes/<uuid:pk>/share-to/`: Share a note with another user.
- `POST /api/notes/<uuid:pk>/unshare/`: Unshare a note from a user.
- `GET /api/notes/share-with-me/`: Get a list of notes shared with the current user.

## Installation

1. **Activate Environment & Install**

    ```pip install -r  backend/main/requirements.txt```

2.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
3.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```
4.  **Activate the virtual environment:**
    - On Windows:
      ```bash
      venv\Scripts\activate
      ```
    - On macOS and Linux:
      ```bash
      source venv/bin/activate
      ```
5.  **Install the dependencies:**
    ```bash
    pip install -r backend/main/requirements.txt
    ```
6.  **Create a `.env` file in `backend/main` and add the following environment variables:**
    ```
    SECRET_KEY=<your-secret-key>
    DEBUG=True
    DB_NAME=<your-db-name>
    DB_USER=<your-db-user>
    DB_PASSWORD=<your-db-password>
    DB_HOST=localhost
    DB_PORT=5432
    EMAIL_HOST_USER=<your-email>
    EMAIL_HOST_PASSWORD=<your-email-password>
    GEMINI_API_KEY=<your-gemini-api-key>
    ``` 
7.  **Run the database migrations:**

    ```bash
    python backend/main/manage.py migrate
    ```
8. **Install dependencies**
    `npm install`

## Running the Application

1.  **Start the development server:**
    ```bash
    python backend/main/manage.py runserver
    ```
2.  The application will be available at `http://127.0.0.1:8000`.

3. **Start frontend server**
    `npm run dev`