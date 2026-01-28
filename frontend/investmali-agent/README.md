# InvestMali Agent Portal

This is the agent portal for InvestMali, a platform for managing investment applications and approvals in Mali.

## Features

- Agent authentication and authorization
- Role-based access control
- Dashboard with key metrics
- Application management
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js 16+ and npm 8+
- Backend server running on `http://localhost:5002`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/investmali.git
   cd investmali/investmali-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   PORT=3001
   REACT_APP_API_URL=http://localhost:5002/api
   REACT_APP_AGENT_API_URL=http://localhost:5002/api/agent
   REACT_APP_ENVIRONMENT=development
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

### `npm run dev`

Runs both the frontend and backend servers concurrently.

### `npm run server`

Runs only the backend server.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run lint`

Runs ESLint on the source files.

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── contexts/      # React contexts
  ├── pages/         # Page components
  ├── services/      # API services
  └── App.tsx        # Main application component
```

## Technologies Used

- React 19
- TypeScript
- React Router v7
- Axios for API requests
- Tailwind CSS for styling
- Heroicons for icons

## Environment Variables

- `PORT`: The port on which the frontend will run (default: 3001)
- `REACT_APP_API_URL`: Base URL for the API
- `REACT_APP_AGENT_API_URL`: URL for agent-specific API endpoints
- `REACT_APP_ENVIRONMENT`: Application environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
