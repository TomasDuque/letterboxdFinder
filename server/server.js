const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/search-movie", async (req, res) => {
  try {
    const movieTitle = req.query.title;

    if (!movieTitle) {
      return res.status(400).json({ error: "Movie title is required" });
    }

    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: movieTitle,
        },
      }
    );

    res.json(response.data.results);
  } catch (error) {
    console.error("TMDB error:", error.message);
    res.status(500).json({ error: "Failed to fetch movie data" });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get("/api/movie/:id/providers", async (req, res) => {
    try {
      const movieId = req.params.id;
  
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
          },
        }
      );
  
      //clean the json file so we only get the stuff on streaming services (flatrate)
      // and that is in the US 
        const providers =
        response.data.results.US?.flatrate || [];
        res.json(providers);

    } catch (error) {
      console.error("Provider error:", error.message);
      res.status(500).json({ error: "Failed to fetch provider data" });
    }
  });