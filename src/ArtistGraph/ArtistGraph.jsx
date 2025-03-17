import './ArtistGraph.css';
import GraphCard from "../GraphCard/GraphCard";
import SearchBar from "../Components/SearchBar";
import { getArtistID } from "../getListeningData";
import { useState, useEffect } from "react";

function ArtistGraph({ userId }) {
  // State for the search input
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for multiple artists
  const [artists, setArtists] = useState([]); // Array of artist names
  const [artistIds, setArtistIds] = useState([]); // Array of artist IDs

  // This effect runs when searchQuery changes (when user presses Enter)
  useEffect(() => {
    async function fetchArtistData() {
      if (searchQuery && searchQuery.trim()) {
        console.log("Fetching artist data for", searchQuery);
        
        try {
          const { artist_id: fetchedArtistId, artist: fetchedArtist } = await getArtistID(userId, searchQuery);
          
          console.log("Fetched Artist:", fetchedArtist);
          console.log("Artist ID:", fetchedArtistId);
          
          // Only add the artist if it's not already in our list
          if (fetchedArtistId && !artistIds.includes(fetchedArtistId)) {
            setArtists(prevArtists => [...prevArtists, fetchedArtist]);
            setArtistIds(prevIds => [...prevIds, fetchedArtistId]);
            
            // Clear search input after adding artist
            setSearchQuery("");
          } else {
            console.log("Artist already in the list or not found");
          }
        } catch (error) {
          console.error("Error fetching artist:", error);
        }
      }
    }
    
    fetchArtistData();
  }, [searchQuery, userId, artistIds]); // Depend on searchQuery to fetch data when Enter is pressed

  // Function to remove an artist from the list
  const removeArtist = (index) => {
    setArtists(prevArtists => prevArtists.filter((_, i) => i !== index));
    setArtistIds(prevIds => prevIds.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className='search-container'>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
              && <button onClick={() => { setArtistIds([]); setArtists([]);}} className="clear-btn">
                Clear All
              </button>
            }
          </div>
        </div>
      )}
      
      {/* Display graph if there are any artists */}
      {artistIds.length > 0 && (
        <GraphCard 
          title="Artist Listening History" 
          userId={userId} 
          artistIds={artistIds} 
          artistNames={artists}
        />
      )}
    </div>
  );
}

export default ArtistGraph;