import GraphCard from "../GraphCard/GraphCard";
import SearchBar from "../Components/SearchBar";
import { getArtistID, getListeningData } from "../getListeningData";
import { useState, useEffect } from "react";

function ArtistGraph({ userId }) {
  const [artist, setArtist] = useState("");
  const [artistId, setArtistId] = useState(null);

  // This will only run when artist is updated (on Enter press)
  useEffect(() => {
    async function fetchArtistData() {
      if (artist) {
        console.log("Fetching artist data for", artist);
        const { artist_id: fetchedArtistId, artist: fetchedArtist } = await getArtistID(userId, artist);
        console.log("Fetched Artist:", fetchedArtist);
        console.log("Artist ID:", fetchedArtistId);
        setArtistId(fetchedArtistId);
        setArtist(fetchedArtist); // Update artist name with normalized version
      }
    }
    fetchArtistData();
  }, [artist]); // Depend on artist to fetch data on artist change

  return (
    <div>
      <SearchBar searchQuery={artist} setSearchQuery={setArtist} />
      {artistId && <GraphCard title="Compare Artists" userId={userId} dataType="artist" artistId={artistId} artistName={artist}/>}
    </div>
  );
}

export default ArtistGraph;