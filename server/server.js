const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const cheerio = require("cheerio");
const letterboxdRatingCache = new Map();

const app = express();

app.use(cors());
app.use(express.json());

const shouldIgnoreProvider = (providerName) => {
  const name = providerName.toLowerCase();

  return (
    name.includes("amazon channel") ||
    name.includes("roku premium channel") ||
    name.includes("apple tv channel") ||
    name.includes("paramount plus premium") ||
    name.includes("paramount+ premium") ||
    name.includes("paramount+ amazon channel") ||
    name.includes("paramount+ roku premium channel") ||
    name.includes("amc+ amazon channel")
  );
};


const normalizeProviderName = (providerName) => {
  const name = providerName.toLowerCase();

  if (name.includes("netflix")) return "Netflix";
  if (name.includes("hulu")) return "Hulu";
  if (name.includes("max") || name.includes("hbo")) return "HBO Max";
  if (name.includes("amazon") || name.includes("prime")) return "Prime Video";
  if (name.includes("disney")) return "Disney+";
  if (name.includes("criterion")) return "Criterion";
  if (name.includes("peacock")) return "Peacock";
  if (name.includes("paramount")) return "Paramount+";
  if (name.includes("tubi")) return "Tubi";

  return providerName;
};


const checkTubiAvailability = async (movieTitle, year) => {
  try {
    const searchQuery = encodeURIComponent(movieTitle);
    const response = await axios.get(`https://tubitv.com/search/${searchQuery}`);

    const html = response.data.toLowerCase();

    const titleMatch = html.includes(movieTitle.toLowerCase());
    const yearMatch = year ? html.includes(year.toString()) : true;

    return titleMatch && yearMatch;
  } catch (error) {
    console.error("Tubi check error:", error.message);
    return false;
  }
};

const getLetterboxdAverageRating = async (letterboxdPath) => {
  if (!letterboxdPath) return null;

  const fullUrl = letterboxdPath.startsWith("http")
    ? letterboxdPath
    : `https://letterboxd.com${letterboxdPath}`;

  if (letterboxdRatingCache.has(fullUrl)) {
    return letterboxdRatingCache.get(fullUrl);
  }

  try {
    const response = await axios.get(fullUrl);
    const html = response.data;

    const ratingMatch = html.match(/"ratingValue":\s*"?([\d.]+)"?/);

    const rating = ratingMatch ? Number(ratingMatch[1]) : null;

    letterboxdRatingCache.set(fullUrl, rating);
    return rating;
  } catch (error) {
    console.error("Letterboxd rating error:", error.message);
    return null;
  }
};


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
  
      const results = [];
  
      for (const movieData of watchlist) {
        const movieTitle =
          typeof movieData === "string" ? movieData : movieData.title;
  
        const letterboxdPath =
          typeof movieData === "string" ? null : movieData.letterboxdPath;
  
        const yearMatch = movieTitle.match(/\((\d{4})\)$/);
        const letterboxdYear = yearMatch ? yearMatch[1] : null;
        const cleanTitle = movieTitle.replace(/\s\(\d{4}\)$/, "");
  
        const searchResponse = await axios.get(
          "https://api.themoviedb.org/3/search/movie",
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              query: cleanTitle,
              year: letterboxdYear,
            },
          }
        );
  
        const movie = searchResponse.data.results[0];
  
        if (!movie) {
          results.push({
            title: movieTitle,
            searchedTitle: cleanTitle,
            found: false,
            providers: [],
          });
  
          continue;
        }
  
        const providersResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
            },
          }
        );
  
        const providers = providersResponse.data.results?.US?.flatrate || [];
  
        const normalizedProviders = [
          ...new Set(
            providers
              .filter((provider) => !shouldIgnoreProvider(provider.provider_name))
              .map((provider) => normalizeProviderName(provider.provider_name))
          ),
        ];
  
        const isOnTubi = await checkTubiAvailability(cleanTitle, letterboxdYear);
  
        if (isOnTubi && !normalizedProviders.includes("Tubi")) {
          normalizedProviders.push("Tubi");
          
        }
  
        const letterboxdAverageRating =
          await getLetterboxdAverageRating(letterboxdPath);
  
        results.push({
          found: true,
          title: movie.title,
          year: movie.release_date?.slice(0, 4),
          rating: movie.vote_average,
          letterboxdAverageRating,
          poster: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          providers: normalizedProviders,
        });
  
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
  
      res.json(results);
    } catch (error) {
      console.error("Watchlist provider error:", error.message);
      res.status(500).json({ error: "Failed to process watchlist" });
    }
  });

app.get("/api/letterboxd-watchlist/:username", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
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

          const letterboxdPath =
          $(element).find("a").attr("href") ||
          $(element).find("[data-target-link]").attr("data-target-link");
        
        if (title) {
          pageMovies.push({
            title,
            letterboxdPath,
          });
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


app.get("/api/letterboxd-profile/:username", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Invalid Letterboxd username" });
    }

    const response = await axios.get(`https://letterboxd.com/${username}/`);
    const html = response.data;
    const $ = cheerio.load(html);

    const displayName =
      $("meta[property='og:title']").attr("content")?.replace("’s profile", "") ||
      username;

    const avatar =
      $("meta[property='og:image']").attr("content") ||
      $(".avatar img").attr("src") ||
      null;

    res.json({
      username,
      displayName,
      avatar,
      profileUrl: `https://letterboxd.com/${username}/`,
    });
  } catch (error) {
    console.error("Letterboxd profile error:", error.message);
    res.status(500).json({ error: "Failed to fetch Letterboxd profile" });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

