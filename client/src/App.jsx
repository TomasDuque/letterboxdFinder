import { useState } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);

  const streamingServices = [
    "Netflix",
    "Hulu",
    "Max",
    "Prime Video",
    "Disney+",
    "Criterion",
  ];

  const movies = [
    {
      title: "Parasite",
      year: 2019,
      service: "Hulu",
      rating: 4.6,
      runtime: "2h 12m",
    },
    {
      title: "The Social Network",
      year: 2010,
      service: "Netflix",
      rating: 4.1,
      runtime: "2h 0m",
    },
    {
      title: "Mad Max: Fury Road",
      year: 2015,
      service: "Max",
      rating: 4.2,
      runtime: "2h 0m",
    },
  ];

  const handleServiceChange = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((item) => item !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const filteredMovies =
    selectedServices.length === 0
      ? movies
      : movies.filter((movie) => selectedServices.includes(movie.service));

  return (
    <div className="app">
      <header className="hero">
        <h1>Letterboxd Stream Finder</h1>
        <p>Find which movies from your watchlist are available to stream.</p>
      </header>

      <section className="search-section">
        <input
          type="text"
          placeholder="Enter your Letterboxd username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button onClick={() => console.log(username, selectedServices)}>
          Find Movies
        </button>
      </section>

      <section className="results">
        <h2>Available Movies</h2>

        <div className="movie-grid">
          {filteredMovies.map((movie) => (
            <div className="movie-card" key={movie.title}>
              <h3>{movie.title}</h3>
              <p>{movie.year}</p>
              <p>Streaming on: {movie.service}</p>
              <p>Rating: {movie.rating}</p>
              <p>Runtime: {movie.runtime}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;