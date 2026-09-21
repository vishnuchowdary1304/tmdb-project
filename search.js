#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * TMDB API configuration
 * Get your free API key at: https://www.themoviedb.org/settings/api
 */
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Search for a movie by name
 * @param {string} movieName - The name of the movie to search for
 * @returns {Promise<Object>} Movie details or error
 */
async function searchByMovieName(movieName) {
  if (!movieName || !movieName.trim()) {
    return { error: 'Movie name is required' };
  }

  if (!TMDB_API_KEY) {
    return { error: 'TMDB_API_KEY environment variable not set. Get your key at https://www.themoviedb.org/settings/api' };
  }

  try {
    // Step 1: Search for the movie
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=en-US&page=1&include_adult=false`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return { error: `No movies found for "${movieName}"` };
    }

    // Get the first (most relevant) result
    const movie = searchData.results[0];

    // Step 2: Get detailed movie information
    const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`;
    const detailsResponse = await fetch(detailsUrl);
    const details = await detailsResponse.json();

    // Step 3: Get credits (cast/crew) - optional, for more details
    const creditsUrl = `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`;
    const creditsResponse = await fetch(creditsUrl);
    const credits = await creditsResponse.json();

    // Format the result
    return formatMovieResult(movie, details, credits);
  } catch (error) {
    return { error: `Search failed: ${error.message}` };
  }
}

/**
 * Format movie data into a clean, readable object
 */
function formatMovieResult(searchResult, details, credits) {
  const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
  const cast = credits.cast?.slice(0, 10).map(c => c.name).join(', ') || 'N/A';
  const director = credits.crew?.find(c => c.job === 'Director')?.name || 'N/A';

  return {
    title: details.title || searchResult.title,
    originalTitle: details.original_title,
    year: details.release_date ? new Date(details.release_date).getFullYear() : searchResult.release_date?.split('-')[0],
    runtime: details.runtime ? `${details.runtime} min` : 'N/A',
    genres,
    overview: details.overview || searchResult.overview || 'No overview available',
    rating: details.vote_average ? `${details.vote_average}/10` : 'N/A',
    voteCount: details.vote_count || 0,
    posterUrl: searchResult.poster_path ? `${TMDB_IMAGE_BASE_URL}${searchResult.poster_path}` : null,
    backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${details.backdrop_path}` : null,
    director,
    cast,
    status: details.status,
    tagline: details.tagline,
    budget: details.budget ? `$${details.budget.toLocaleString()}` : 'N/A',
    revenue: details.revenue ? `$${details.revenue.toLocaleString()}` : 'N/A',
    homepage: details.homepage,
    imdbId: details.imdb_id ? `https://www.imdb.com/title/${details.imdb_id}/` : null,
    tmdbId: details.id,
    tmdbUrl: `https://www.themoviedb.org/movie/${details.id}`
  };
}

/**
 * Display movie info in a nice format
 */
function displayMovie(movie) {
  if (movie.error) {
    console.error(`��� Error: ${movie.error}`);
    return;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`����  ${movie.title} (${movie.year})`);
  console.log('='.repeat(50));
  console.log(`����  ${movie.overview}`);
  console.log(`\n����  Rating: ${movie.rating} (${movie.voteCount.toLocaleString()} votes)`);
  console.log(`������  Runtime: ${movie.runtime}`);
  console.log(`����  Genres: ${movie.genres}`);
  console.log(`����  Director: ${movie.director}`);
  console.log(`����  Cast: ${movie.cast}`);
  console.log(`����  Status: ${movie.status}`);

  if (movie.tagline) console.log(`����  Tagline: "${movie.tagline}"`);
  if (movie.budget !== 'N/A') console.log(`����  Budget: ${movie.budget}`);
  if (movie.revenue !== 'N/A') console.log(`����  Revenue: ${movie.revenue}`);

  console.log(`\n����  Links:`);
  console.log(`   TMDB: ${movie.tmdbUrl}`);
  if (movie.imdbId) console.log(`   IMDB: ${movie.imdbId}`);
  if (movie.homepage) console.log(`   Official: ${movie.homepage}`);
  if (movie.posterUrl) console.log(`   Poster: ${movie.posterUrl}`);

  console.log('='.repeat(50) + '\n');
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node search.js "<movie name>"');
    console.log('Example: node search.js "Inception"');
    console.log('\nSet your TMDB API key first:');
    console.log('  export TMDB_API_KEY="your_api_key_here"');
    console.log('Get a free key at: https://www.themoviedb.org/settings/api');
    process.exit(1);
  }

  const movieName = args.join(' ');
  console.log(`���� Searching for: "${movieName}"...`);

  const result = await searchByMovieName(movieName);
  displayMovie(result);
}

main();