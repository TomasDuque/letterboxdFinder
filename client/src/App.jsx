import { useState, useEffect } from "react";import "./App.css";
import tmdbLogo from "./assets/tmdb-logo.svg";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [username, setUsername] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [sortOption, setSortOption] = useState("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [randomPick, setRandomPick] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreOpen, setIsGenreOpen] = useState(false);


  const streamingServices = [
    "Netflix",
    "Hulu",
    "HBO Max",
    "Prime Video",
    "Disney+",
    "Kanopy",
    "Paramount+",
    "Peacock",
    "Tubi",
    // "YouTube Free",
    "Amazon Prime Video Free",
    "Plex",
  ];

  const handleServiceChange = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((item) => item !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSearch = async () => {
    setHasSearched(true);
    setIsLoading(true);
    setMovies([]);
    setProfile(null);
    setLoadedCount(0);
    setTotalCount(0);

    const cleanUsername = username.trim().toLowerCase();

    try {
      const profileResponse = await fetch(
        `${API_URL}/api/letterboxd-profile/${encodeURIComponent(
          cleanUsername
        )}`
      );

      const profileData = await profileResponse.json();
      setProfile(profileData);

      const watchlistResponse = await fetch(
        `${API_URL}/api/letterboxd-watchlist/${encodeURIComponent(
          cleanUsername
        )}`
      );

      const watchlistData = await watchlistResponse.json();
      const watchlist = watchlistData.movies || [];

      setTotalCount(watchlist.length);

      const batchSize = 1;

      for (let i = 0; i < watchlist.length; i += batchSize) {
        const batch = watchlist.slice(i, i + batchSize);

        const providersResponse = await fetch(
          `${API_URL}/api/watchlist/providers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              watchlist: batch,
              country: selectedCountry,
            }),
          }
        );

        const providerData = await providersResponse.json();

        setMovies((prevMovies) => [...prevMovies, ...providerData]);
        setLoadedCount((prevCount) => prevCount + batch.length);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/watch-provider-regions`);
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };
  
    fetchCountries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".genre-wrapper") &&
        !event.target.closest(".sort-wrapper")
      ) {
        setIsGenreOpen(false);
        setIsSortOpen(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const matchingMovies = movies.filter((movie) => {
    const matchesService = movie.providers?.some((provider) =>
      selectedServices.includes(provider)
    );
  
    const matchesGenre =
      selectedGenres.length === 0 ||
      selectedGenres.some((genreId) =>
        movie.genreIds?.includes(Number(genreId))
      );
  
    return matchesService && matchesGenre;
  });
  const sortedMovies = [...matchingMovies].sort((a, b) => {
    if (sortOption === "watchlist-oldest") {
      return movies.indexOf(b) - movies.indexOf(a);
    }
  
    if (sortOption === "letterboxd-desc") {
      return (b.letterboxdAverageRating || 0) - (a.letterboxdAverageRating || 0);
    }
  
    if (sortOption === "letterboxd-asc") {
      return (a.letterboxdAverageRating || 0) - (b.letterboxdAverageRating || 0);
    }
  
    if (sortOption === "tmdb-desc") {
      return (b.rating || 0) - (a.rating || 0);
    }
  
    if (sortOption === "tmdb-asc") {
      return (a.rating || 0) - (b.rating || 0);
    }
  
    if (sortOption === "release-newest") {
      return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
    }
  
    if (sortOption === "release-oldest") {
      return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
    }
  
    if (sortOption === "runtime-asc") {
      return (a.runtime || Infinity) - (b.runtime || Infinity);
    }
  
    if (sortOption === "runtime-desc") {
      return (b.runtime || 0) - (a.runtime || 0);
    }
  
    return 0;
  });

  const selectedCountryName =
  countries.find((country) => country.iso_3166_1 === selectedCountry)
    ?.english_name || "United States";

    const sortOptions = [
      { value: "default", label: "Watchlist Order", sublabel: "Newest Added First" },
      { value: "watchlist-oldest", label: "Watchlist Order", sublabel: "Oldest Added First" },
      { value: "letterboxd-desc", label: "Letterboxd Rating", sublabel: "Highest First" },
      { value: "letterboxd-asc", label: "Letterboxd Rating", sublabel: "Lowest First" },
      { value: "tmdb-desc", label: "TMDB Rating", sublabel: "Highest First" },
      { value: "tmdb-asc", label: "TMDB Rating", sublabel: "Lowest First" },
      { value: "release-newest", label: "Release Date", sublabel: "Newest First" },
      { value: "release-oldest", label: "Release Date", sublabel: "Oldest First" },
      { value: "runtime-asc", label: "Runtime", sublabel: "Shortest First" },
      { value: "runtime-desc", label: "Runtime", sublabel: "Longest First" },
    ];
  
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label || "Default";

    const pickRandomMovie = () => {
      if (sortedMovies.length === 0) return;
    
      const randomIndex = Math.floor(Math.random() * sortedMovies.length);
      setRandomPick(sortedMovies[randomIndex]);
    };

    const genres = [
      { id: "all", name: "All Genres" },
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 27, name: "Horror" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Sci-Fi" },
      { id: 53, name: "Thriller" },
    ];
    const handleGenreChange = (genreId) => {
      if (genreId === "all") {
        setSelectedGenres([]);
        return;
      }
    
      if (selectedGenres.includes(genreId)) {
        setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
      } else {
        setSelectedGenres([...selectedGenres, genreId]);
      }
    };
    return (
      <div className="app">
        <header className="site-header">
          <div className="hero">
            <p className="eyebrow">Streaming Matchmaker</p>
    
            <h1>
              Watchlist <span>Finder</span>
            </h1>
    
            <p className="hero-subtitle">
              Turn your Letterboxd watchlist into a personalized streaming guide.
            </p>
          </div>
        </header>
    
        <section className="dashboard-layout">
          <aside className="filter-sidebar">
            <h2>Refine Results</h2>
    
            <p className="results-count">
              Showing <span>{matchingMovies.length}</span> of{" "}
              <span>{movies.length}</span> movies
            </p>
    
            <div className="genre-wrapper">
              <button
                type="button"
                className="custom-sort-button"
                onClick={() => setIsGenreOpen(!isGenreOpen)}
              >
                Genre{" "}
                <span>
                  {selectedGenres.length === 0
                    ? "All Genres"
                    : `${selectedGenres.length} selected`}
                </span>

                <span className="sort-chevron">⌄</span>
              </button>

              {isGenreOpen && (
                <div className="custom-sort-menu">
                  {genres.map((genre) => {
                    const isSelected =
                      genre.id === "all"
                        ? selectedGenres.length === 0
                        : selectedGenres.includes(genre.id);

                    return (
                      <button
                        key={genre.id}
                        type="button"
                        className={`custom-sort-option ${isSelected ? "active" : ""}`}
                        onClick={() => handleGenreChange(genre.id)}
                      >
                        <span className="sort-check">
                          {isSelected ? "✓" : ""}
                        </span>

                        <span>{genre.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
    
            <div className="sort-wrapper">
              <button
                type="button"
                className="custom-sort-button"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                Sort by <span>{selectedSortLabel}</span>
                <span className="sort-chevron">⌄</span>
              </button>
    
              {isSortOpen && (
                <div className="custom-sort-menu">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`custom-sort-option ${
                        sortOption === option.value ? "active" : ""
                      }`}
                      onClick={() => {
                        setSortOption(option.value);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="sort-check">
                        {sortOption === option.value ? "✓" : ""}
                      </span>
    
                      <span>
                        {option.label}
                        {option.sublabel && (
                          <span className="sort-sublabel">{option.sublabel}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
    
          <main className="main-column">
            <section className="search-section">
              <input
                type="text"
                disabled={isLoading}
                placeholder="Enter Letterboxd username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
    
              <div className="country-select-wrapper">
                <label className="country-label">Country</label>
    
                <button
                  type="button"
                  className="custom-country-button"
                  disabled={isLoading}
                  onClick={() => setIsCountryOpen(!isCountryOpen)}
                >
                  <span>{selectedCountryName}</span>
                  <span className="country-chevron">⌄</span>
                </button>
    
                {isCountryOpen && (
                  <div className="custom-country-menu">
                    {countries.map((country) => (
                      <button
                        key={country.iso_3166_1}
                        type="button"
                        className={`custom-country-option ${
                          selectedCountry === country.iso_3166_1 ? "active" : ""
                        }`}
                        onClick={() => {
                          setSelectedCountry(country.iso_3166_1);
                          setIsCountryOpen(false);
                        }}
                      >
                        <span className="country-check">
                          {selectedCountry === country.iso_3166_1 ? "✓" : ""}
                        </span>
    
                        <span>{country.english_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
    
              <h3>Your Streaming Services</h3>
    
              <div className="services">
                {streamingServices.map((service) => (
                  <label key={service} className="service-option">
                    <input
                      type="checkbox"
                      disabled={isLoading}
                      checked={selectedServices.includes(service)}
                      onChange={() => handleServiceChange(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
    
              <button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Finding Matches..." : "Find Watchlist Matches"}
              </button>
            </section>
    
            <section className="results">
              {hasSearched && (
                <>
                  {profile && (
                    <div className="profile-card">
                      {profile.avatar && (
                        <img
                          src={profile.avatar}
                          alt={`${profile.username} avatar`}
                        />
                      )}
                      <div>
                        <p>@{profile.username}</p>
                      </div>
                    </div>
                  )}
    
                  {isLoading && (
                    <div className="loading-box">
                      <div className="spinner"></div>
                      <p className="loading-message">
                        Loading {loadedCount} of {totalCount} movies...
                      </p>
                    </div>
                  )}
    
                  {selectedServices.length === 0 ? (
                    <p className="empty-message">
                      Select at least one streaming service to see matches.
                    </p>
                  ) : matchingMovies.length === 0 && !isLoading ? (
                    <p className="empty-message">
                      No watchlist movies found on your selected filters.
                    </p>
                  ) : (
                    <div className="movie-grid">
                      {sortedMovies.map((movie) => (
                        <div
                          className="movie-card"
                          key={`${movie.title}-${movie.year}`}
                        >
                          {movie.poster && (
                            <img src={movie.poster} alt={movie.title} />
                          )}
    
                          <h3>{movie.title}</h3>
                          <p>{movie.year}</p>
    
                          <div className="provider-list">
                            <span>Available on: </span>
    
                            {movie.providers.map((provider) => (
                              <span
                                key={provider}
                                className={
                                  selectedServices.includes(provider)
                                    ? "provider-match"
                                    : "provider-other"
                                }
                              >
                                {provider}
                              </span>
                            ))}
                          </div>
    
                          <p>TMDB Rating: {movie.rating.toFixed(1)}</p>
    
                          <p>
                            Letterboxd Avg:{" "}
                            {movie.letterboxdAverageRating
                              ? `★ ${movie.letterboxdAverageRating.toFixed(1)}`
                              : "N/A"}
                          </p>
    
                          <p>
                            Runtime:{" "}
                            {movie.runtime ? `${movie.runtime} min` : "N/A"}
                          </p>
    
                          {movie.watchLink && (
                            <a
                              href={movie.watchLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="watch-button"
                            >
                              Watch Now →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </main>
    
          <aside className="random-sidebar">
            <h2>Shuffle</h2>
    
            <p className="random-sidebar-text">
              Randomly pick one available movie from your results to watch tonight.
            </p>
    
            <button
              type="button"
              className="random-picker-button"
              onClick={pickRandomMovie}
              disabled={sortedMovies.length === 0}
            >
              Pick My Movie
            </button>
    
            {randomPick ? (
              <div className="random-pick-card sidebar-pick">
                {randomPick.poster && (
                  <img
                    src={randomPick.poster}
                    alt={randomPick.title}
                    className="random-pick-poster"
                  />
                )}
    
                <h3>{randomPick.title}</h3>
    
                <p>
                  {randomPick.year}
                  {randomPick.runtime ? ` • ${randomPick.runtime} min` : ""}
                </p>
    
                <p>
                  Letterboxd:{" "}
                  {randomPick.letterboxdAverageRating
                    ? `★ ${randomPick.letterboxdAverageRating.toFixed(1)}`
                    : "N/A"}
                </p>
    
                <p className="random-pick-overview">
                  {randomPick.overview
                    ? randomPick.overview.length > 320
                      ? `${randomPick.overview.slice(0, 320)}...`
                      : randomPick.overview
                    : "No summary available."}
                </p>
    
                <p className="random-pick-providers">
                  Available on: {randomPick.providers.join(", ")}
                </p>
              </div>
            ) : (
              <p className="random-empty">
                Search your watchlist first, then spin the movie wheel.
              </p>
            )}
          </aside>
        </section>
    
        <footer className="footer">
          <div className="footer-content">
            <img src={tmdbLogo} alt="TMDB Logo" className="tmdb-logo" />
    
            <p>
              This product uses the TMDB API but is not endorsed or certified by
              TMDB.
            </p>
    
            <p className="footer-subtext">
              Movie information and posters provided by TMDB.
            </p>
    
            <p className="footer-subtext">
              Watchlist data sourced from Letterboxd user profiles. This project is
              not affiliated with or endorsed by Letterboxd.
            </p>
          </div>
        </footer>
      </div>
    );
}

export default App;