# Author / Contact Information

Author: Tomas Duque
Contact: email - duquet1014@gmail.com
         linkedin - www.linkedin.com/in/tomas-duque-


# Letterboxd Watchlist Finder

A full-stack web application that allows Letterboxd users to import their public watchlists and discover which movies are available across streaming services in their country.


---

# Known Issues

Slight inconsitancies across TMDB streaming results and actual streaming results

## Features

- Import any public Letterboxd watchlist by username
- View movie posters, ratings, release dates, runtimes, and genres
- Filter movies by streaming service
- Search streaming availability by country
- Sort by:
  - Letterboxd Rating
  - TMDB Rating
  - Runtime
  - Release Date
  - Watchlist Order
- Random Movie Picker
- Server-side caching for improved performance

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express

### APIs & Libraries
- TMDB API
- Axios
- Cheerio
- Node Cache


---

## How It Works

1. User enters a public Letterboxd username.
2. The backend scrapes the user's watchlist.
3. Movie titles are matched with TMDB.
4. Streaming provider information is retrieved based on the selected country.
5. Results are cached to reduce duplicate API requests.
6. The frontend displays sortable and filterable results.

---

## Running Locally

Clone the repository

```bash
git clone https://github.com/yourusername/letterboxd-watchlist-finder.git
```

Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

Start the backend

```bash
cd server
npm run dev
```

Start the frontend

```bash
cd client
npm run dev
```

---

## Future Improvements

- AWS deployment
- Docker deployment
- Performance improvements for very large watchlists

---

## Credits

- Movie metadata provided by TMDB
- Watchlist data sourced from Letterboxd public pages
