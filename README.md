# FreshFood Backend

The backend is an Express API using PostgreSQL and Sequelize. It provides the application API under `/api` and serves uploaded files under `/static`.

## Requirements

- Node.js and npm
- PostgreSQL

## Setup

From the repository root, install all workspace dependencies:

```bash
npm install
```

Start PostgreSQL and create a database (the default name is `freshfood`). Create `backend/.env` with the database connection and a JWT secret:

```dotenv
PORT=5000
DB_NAME=freshfood
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=replace_with_a_long_random_secret
```

The server authenticates with PostgreSQL and synchronizes the Sequelize models when it starts. Keep `.env` private and do not commit real credentials.

Create the local directory used for uploaded images. Run from the repository root:

```bash
mkdir -p backend/static
```

The directory is ignored by Git; the server exposes its contents at `/static`.

## Run

Start both the frontend and backend from the repository root:

```bash
npm run dev
```

The frontend is available at `http://localhost:3000`; the API listens at `http://localhost:5000` by default. To run them separately, use two terminals at the repository root:

```bash
npm run dev:backend
npm run dev:frontend
```

To start only the backend from this directory, run:

```bash
npm run dev
```

## Optional integrations

For Google sign-in, add OAuth credentials to `backend/.env`:

```dotenv
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Email delivery uses Mailtrap Sandbox. Configure `EMAIL_USER` and `EMAIL_PASS` with the SMTP credentials from your Mailtrap inbox. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for setup details. Without these values, email-dependent features will not be able to send messages.
