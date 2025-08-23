import './ArtistGraph.css';
import GraphCard from "../GraphCard/GraphCard";
import SearchBar from "../Components/SearchBar";
import { useState, useEffect } from "react";

function ArtistGraph({ userId }) {
  // State for the search input
  const [searchQuery, setSearchQuery] = useState("");
  const [graphKey, setGraphKey] = useState(0); // Key to force re-render of GraphCard
  // State for multiple artists
  const [artists, setArtists] = useState([]); // Array of artist names
  const [artistIds, setArtistIds] = useState([]); // Array of artist IDs


  // Instant add artist tag when selected from SearchBar
  const handleArtistSelect = (artistObj) => {
    if (artistObj && artistObj.artist_id && !artistIds.includes(artistObj.artist_id)) {
      setArtists(prevArtists => [...prevArtists, artistObj.artist]);
      setArtistIds(prevIds => [...prevIds, artistObj.artist_id]);
      setSearchQuery("");
    }
  };

  // Function to remove an artist from the list
  const removeArtist = (index) => {
    setArtists(prevArtists => prevArtists.filter((_, i) => i !== index));
    setArtistIds(prevIds => prevIds.filter((_, i) => i !== index));
  };

  // Function to clear all artists and reset graph
  const clearAllArtists = () => {
    setArtistIds([]);
    setArtists([]);
    setGraphKey(prevKey => prevKey + 1); // Change key to force re-render
  };

  return (
    <div>
      <div className='search-container'>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} userId={userId} onArtistSelect={handleArtistSelect} />
      </div>
      
      {/* Display selected artists */}
      {artists.length > 0 && (
        <div className="artist-container">
          <h3>Selected Artists</h3>
          <div className="artist-list">
            {artists.map((artist, index) => (
              <div key={artistIds[index]} className="artist-tag">
                <span>{artist}</span>
                <button 
                  onClick={() => removeArtist(index)} 
                  className="remove-btn"
                  aria-label={`Remove ${artist}`}
                >
                  ×
                </button>
              </div>
            ))}
            {artists.length > 0 
              && <button onClick={clearAllArtists} className="clear-btn">
              Clear All
            </button>
            }
          </div>
        </div>
      )}
      
      {/* Display graph if there are any artists */}
      {artistIds.length > 0 ? (
      <GraphCard 
        key={graphKey} // Force re-render when cleared
        title="Artist Listening History" 
        userId={userId} 
        artistIds={artistIds} 
        artistNames={artists}
      />
      ) : (
      <GraphCard title="Artist Listening History"/>
      )}
    </div>
  );
}

export default ArtistGraph;