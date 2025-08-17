import './Shelf.css';
import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';

function Shelf({ userId }) {
    const [savedAlbums, setSavedAlbums] = useState(() => {
        // Load saved albums from localStorage on component mount
        const saved = localStorage.getItem(`shelf-albums-${userId}`);
        return saved ? JSON.parse(saved) : [];
    });

    // When albums change, save to localStorage
    useEffect(() => {
        localStorage.setItem(`shelf-albums-${userId}`, JSON.stringify(savedAlbums));
    }, [savedAlbums, userId]);

    const addAlbum = (album) => {
        // Check if album already exists to avoid duplicates
        // Using console logs to debug
        console.log("Adding album:", album);
        console.log("Current savedAlbums:", savedAlbums);
        
        // Check for duplicates more carefully
        const isDuplicate = savedAlbums.some(a => a.album=== album.album && a.artist === album.artist);
        console.log("Is duplicate:", isDuplicate);
        
        if (!isDuplicate) {
            // Create a new object to ensure no reference issues
            const newAlbum = {
                album: album.album,
                artist: album.artist,
                image: album.image || album.album_image
            };
            
            // Use functional update to ensure we have the latest state
            setSavedAlbums(prevAlbums => {
                const updatedAlbums = [...prevAlbums, newAlbum];
                console.log("Updated albums:", updatedAlbums);
                return updatedAlbums;
            });
        }
    };

    const removeAlbum = (album_name) => {
        setSavedAlbums(prev => prev.filter(album => album.album !== album_name));
    };

    return (
        <div className="shelf-container">
            <h2 className="shelf-title">My Album Shelf</h2>
            
            <div className="shelf-search">
                <SearchBar 
                    userId={userId} 
                    searchType="album" 
                    searchQuery="" 
                    setSearchQuery={() => {}} 
                    onAlbumSelect={addAlbum} 
                />
            </div>
            
            <div className="album-count">
                {savedAlbums.length} {savedAlbums.length === 1 ? 'album' : 'albums'} in your collection
            </div>
            
            {savedAlbums.length > 0 ? (
                <div className="album-grid">
                    {savedAlbums.map((album, index) => (
                        <div key={`${album.album}-${index}`} className="album-card">
                            <div className="album-image-container">
                                <img 
                                    src={album.image || 'https://placehold.co/200x200?text=No+Image'} 
                                    alt={album.album} 
                                    className="album-image" 
                                />
                                <button 
                                    className="remove-album-btn" 
                                    onClick={() => removeAlbum(album.album)}
                                    aria-label={`Remove ${album.album}`}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="album-info">
                                <h3 className="album-title">{album.album}</h3>
                                <p className="album-artist">{album.artist}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-shelf">
                    <p>Your shelf is empty. Search and add albums above.</p>
                </div>
            )}
        </div>
    );
}

export default Shelf;