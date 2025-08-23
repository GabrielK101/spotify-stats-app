import './SearchBar.css';
import { useState, useEffect, useRef } from 'react';
import { getAllUniqueArtists, getAllUniqueAlbums } from '../getListeningData';

function SearchBar({ searchQuery, setSearchQuery, userId, searchType = "artist", onAlbumSelect = null }) {
    const [inputValue, setInputValue] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allItems, setAllItems] = useState([]); // Cache all items
    const [isLoading, setIsLoading] = useState(false);
    const searchContainerRef = useRef(null);

    // Fetch all unique items on mount/userId/searchType change
    useEffect(() => {
        const fetchAllItems = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                let items = [];
                if (searchType === "artist") {
                    items = await getAllUniqueArtists(userId);
                } else if (searchType === "album") {
                    items = await getAllUniqueAlbums(userId);
                }
                setAllItems(items);
            } catch (error) {
                console.error(`Error fetching all ${searchType}s:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllItems();
    }, [userId, searchType]);

    // Filter cached items locally (instant)
    useEffect(() => {
        if (inputValue.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filtered = allItems.filter(item => {
            const searchField = searchType === "artist" ? item.artist : item.album;
            return searchField.toLowerCase().includes(inputValue.toLowerCase());
        }).slice(0, 10);

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    }, [inputValue, allItems, searchType]);

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
