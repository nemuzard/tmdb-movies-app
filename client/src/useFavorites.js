import {useState, useEffect} from 'react';

const FavoritesKey = 'favoriteMovies';

// a custom hook to manage favorite movies
export function useFavorites(){
    const [favoriteIds, setFavoriteIds] = useState([]);
    // load favorites from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(FavoritesKey);
        if(stored){
            setFavoriteIds(JSON.parse(stored));
        }
    }, []);

    // when favoriteIds change, update localStorage
    const saveToLocal  = (ids) => {
        localStorage.setItem(FavoritesKey, JSON.stringify(ids));
        setFavoriteIds(ids);
    };

    // switch favorite status
    const toggleFavorite = (movieId) => {
        let newFavorites;
        if(favoriteIds.includes(movieId)){
            newFavorites = favoriteIds.filter(id => id !== movieId);
        } else {
            newFavorites = [...favoriteIds, movieId];
        }
        saveToLocal(newFavorites);
    };

    // check if a movie is favorite
    const isFavorite = (movieId) => {
        return favoriteIds.includes(movieId);
    };

    return {
        favoriteIds,
        toggleFavorite,
        favoriteCount: favoriteIds.length,
        isFavorite
    };
}
