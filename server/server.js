const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const cheerio = require("cheerio");

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


app.post("/api/watchlist/providers", async (req, res) => {
  try {
    const { watchlist } = req.body;

    if (!watchlist || !Array.isArray(watchlist)) {
      return res.status(400).json({ error: "Watchlist array is required" });
    }

    const results = await Promise.all(
      watchlist.map(async (movieTitle) => {
        const searchResponse = await axios.get(
          "https://api.themoviedb.org/3/search/movie",
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              query: movieTitle,
            },
          }
        );

        const movie = searchResponse.data.results[0];

        if (!movie) {
          return {
            title: movieTitle,
            found: false,
            providers: [],
          };
        }

        const providersResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
            },
          }
        );

        const providers =
          providersResponse.data.results?.US?.flatrate || [];

        return {
          found: true,
          title: movie.title,
          year: movie.release_date?.slice(0, 4),
          rating: movie.vote_average,
          poster: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          providers: providers.map((provider) => provider.provider_name),
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Watchlist provider error:", error.message);
    res.status(500).json({ error: "Failed to process watchlist" });
  }
});

app.get("/api/test-watchlist", async (req, res) => {
  try {
    const fakeWatchlist = [
      "Y Tu Mama Tambien",
      "Sinners",
      "No Other Choice",
    ];

    const response = await axios.post(
      "http://localhost:5001/api/watchlist/providers",
      {
        watchlist: fakeWatchlist,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Test failed" });
  }
});

app.get("/api/letterboxd-watchlist/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const allMovies = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const url =
        page === 1
          ? `https://letterboxd.com/${username}/watchlist/`
          : `https://letterboxd.com/${username}/watchlist/page/${page}/`;

      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const pageMovies = [];

      $(".poster-grid .griditem").each((index, element) => {
        const title = $(element)
          .find("[data-item-name]")
          .attr("data-item-name");

        if (title) {
          pageMovies.push(title);
        }
      });

      if (pageMovies.length === 0) {
        hasMorePages = false;
      } else {
        allMovies.push(...pageMovies);
        page++;
      }
    }

    res.json({
      username,
      count: allMovies.length,
      movies: allMovies,
    });
  } catch (error) {
    console.error("Letterboxd scrape error:", error.message);
    res.status(500).json({ error: "Failed to fetch Letterboxd watchlist" });
  }
});