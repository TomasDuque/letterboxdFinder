import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [movies, setMovies] = useState([]);

  const streamingServices = [
    "Netflix",
    "Hulu",
    "HBO Max",
    "Prime Video",
    "Disney+",
    "Criterion",
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
  
    const fakeWatchlistTitles = [
      "Y Tu Mamá También",
      "No Other Choice",
      "Sinners",
      "The Dark Knight",
    ];
  
    const response = await fetch("http://localhost:5001/api/watchlist/providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        watchlist: fakeWatchlistTitles,
      }),
    });
  
    const data = await response.json();
    setMovies(data);
  };

  const matchingMovies = movies.filter((movie) =>
    movie.providers?.some((provider) => selectedServices.includes(provider))
  );

  return (
    <div className="app">
      <header className="hero">
        <h1>Letterboxd Watchlist Finder</h1>
        <p>
          Enter a Letterboxd username, select your streaming services, and find
          what you can already watch.
        </p>
      </header>

      <section className="search-section">
        <input
          type="text"
          placeholder="Enter Letterboxd username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <h3>Your Streaming Services</h3>

        <div className="services">
          {streamingServices.map((service) => (
            <label key={service} className="service-option">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceChange(service)}
              />
              {service}
            </label>
          ))}
        </div>

        <button onClick={handleSearch}>Find Watchlist Matches</button>
      </section>

      <section className="results">
        {hasSearched && (
          <>
            <h2>
              Results for {username || "Unknown User"}
            </h2>

            {selectedServices.length === 0 ? (
              <p className="empty-message">
                Select at least one streaming service to see matches.
              </p>
            ) : matchingMovies.length === 0 ? (
              <p className="empty-message">
                No watchlist movies found on your selected services.
              </p>
            ) : (
              <div className="movie-grid">
                {matchingMovies.map((movie) => (
                  <div className="movie-card" key={movie.title}>
                    {movie.poster && <img src={movie.poster} alt={movie.title} />}
                    <h3>{movie.title}</h3>
                    <p>{movie.year}</p>
                    <p>Available on: {movie.providers.join(", ")}</p>
                    <p>Rating: {movie.rating}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default App;