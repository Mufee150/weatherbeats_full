
WeatherBeats 🎶

WeatherBeats is a cross-platform mobile and web application that connects the local weather to your mood and provides a personalized experience. Instead of just a standard weather forecast, it suggests music, clothing, and tips based on your location and emotional state. The app is built with Flutter for the frontend and Node.js for the backend.

How It Works ⚙️

The app follows a client-server architecture. When a user opens the app:

    Frontend (Flutter): The app first requests the user's current location (latitude and longitude) using the device's geolocation services. It then sends these coordinates, along with the user's selected mood, to the backend server.

    Backend (Node.js/Express): The backend serves as the central processing unit. It performs several key tasks:

        It uses a Weather API (like OpenWeatherMap) to get real-time weather conditions for the provided coordinates.

        It queries a MongoDB database to find a music genre that matches the current weather condition and the user's chosen mood.

        It uses a set of rules to generate clothing, accessory, and tips suggestions based on the temperature and weather.

        Finally, it uses a Spotify API to search for a public playlist corresponding to the suggested music genre.

    Data Transmission: The backend combines all this information—weather data, music details, and clothing suggestions—into a single response and sends it back to the Flutter app.

    Frontend (Flutter): The app receives the data and dynamically updates its UI to display the information. When the user taps the "Open Playlist" button, it uses the URL Launcher API to open the Spotify playlist link in their browser.

This system ensures that the logic for fetching and combining data is handled server-side, keeping the frontend lightweight and efficient.


How to Run Locally 💻

To run this project locally, you will need to set up both the backend and frontend.

Prerequisites

    Node.js and npm installed on your machine.

    Flutter SDK installed and configured.

    A MongoDB Atlas account and connection string.

    OpenWeatherMap API Key.

    Spotify Developer Account for Client ID and Client Secret.

Backend Setup

    Navigate to the backend folder in your terminal.

    Install the required Node.js packages:
    Bash

npm install

Create a .env file or directly add your API keys in server.js:
JavaScript

const MONGODB_URI = "YOUR_MONGODB_ATLAS_CONNECTION_STRING";
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_CLIENT_SECRET = "YOUR_SPOTIFY_CLIENT_SECRET";
const OPENWEATHER_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";

Start the backend server:
Bash

    node server.js

    The server will run on http://localhost:3000.

Frontend Setup

    Navigate to the frontend folder in a new terminal window.

    Ensure your backend server is running.

    Run the Flutter app. For a web browser, use:
    Bash

flutter run -d chrome

For a mobile device or emulator, use:
Bash

    flutter run

The app will now be running and connected to your local backend server.
