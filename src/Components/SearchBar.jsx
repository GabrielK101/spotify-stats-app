import './SearchBar.css';
import { useState, useEffect, useRef } from 'react';
import { getArtistSuggestions, getAlbumSuggestions } from '../getListeningData';

function SearchBar({ searchQuery, setSearchQuery, userId, searchType = "artist", onAlbumSelect = null }) {
    const [inputValue, setInputValue] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchContainerRef = useRef(null);
    
    // Update local state when searchQuery prop changes
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length < 1) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsLoading(true);
            try {
                let results = [];
                if (searchType === "artist") {
                    results = await getArtistSuggestions(userId, inputValue, 10);
                } else if (searchType === "album") {
                    results = await getAlbumSuggestions(userId, inputValue, 10);
                }
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error(`Error fetching ${searchType} suggestions:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce api calls
        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [inputValue, userId, searchType]);
    
    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleInputChange = (event) => {
        setInputValue(event.target.value);  // Update local state only
    };
    
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setSearchQuery(inputValue);  // Only update parent state on Enter
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (searchType === "artist") {
            setSearchQuery(suggestion.artist);
            setInputValue(suggestion.artist);
        } else if (searchType === "album" && onAlbumSelect) {
            onAlbumSelect(suggestion);
            setInputValue("");  // Clear the search bar after selection
        }
        setShowSuggestions(false);
    };
  
    return (
        <div ref={searchContainerRef} className="search-container">
            <input 
                type="text" 
                value={inputValue} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyDown} 
                placeholder={`Search for ${searchType === "artist" ? "an artist" : "an album"}...`} 
                className="search-bar"
            />
            {isLoading && (
                <div className="search-loading-indicator">
                    <div className="spinner"></div>
                </div>
            )}
            
            {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map(suggestion => (
                        <li 
                            key={suggestion.id || suggestion.album_id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion-item"
                        >
                            {searchType === "artist" ? suggestion.artist : suggestion.album}
                            {searchType === "album" && suggestion.artist && (
                                <span className="album-artist"> - {suggestion.artist}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchBar;
