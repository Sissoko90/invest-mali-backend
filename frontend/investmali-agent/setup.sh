#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  cat > .env <<EOL
PORT=3001
REACT_APP_API_URL=http://localhost:5002/api
REACT_APP_AGENT_API_URL=http://localhost:5002/api/agent
REACT_APP_CREATE_CLIENT_APP_PATH=/business/applications
REACT_APP_ENVIRONMENT=development
EOL
  echo "Created .env file with default values"
else
  echo ".env file already exists, skipping creation"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete! You can now run the application with 'npm start' or 'npm run dev' to start both frontend and backend."
