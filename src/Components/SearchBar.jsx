import './SearchBar.css';
import { useState, useEffect } from 'react';

function SearchBar({ searchQuery, setSearchQuery }) {
    const [inputValue, setInputValue] = useState(searchQuery);
    
    // Update local state when searchQuery prop changes
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);
    
    const handleInputChange = (event) => {
        setInputValue(event.target.value);  // Update local state only
    };
    
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setSearchQuery(inputValue);  // Only update parent state on Enter
        }
    };
  
    return (
        <input 
            type="text" 
            value={inputValue} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown} 
            placeholder="Search for an artist..." 
            className="search-bar"
        />
    );
}

export default SearchBar;
