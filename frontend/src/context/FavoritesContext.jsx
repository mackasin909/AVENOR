"use client"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CARS } from "@/data/cars";

export const FavoritesContext = createContext(null)

const STORAGE_KEY = "avenor-favorites"

export function FavoritesProvider({ children }) {
    const [favoriteIds, setFavoriteIds] = useState([])
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

            if (Array.isArray(saved)) {
                const ids = saved
                    .map((item) => (typeof item === "object" && item !== null ? item.id : item))
                    .filter((id) => id !== undefined && id !== null)

                setFavoriteIds([...new Set(ids)])
            }
        } catch (error) {
            console.error("Failed to read favorites", error)
        }
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (!isLoaded) return
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
        } catch (error) {
            console.error("Failed to save favorites", error)
        }
    }, [favoriteIds, isLoaded])

    const toggleFavorite = useCallback((carOrId) => {
        const id = typeof carOrId === "object" ? carOrId.id : carOrId
        const isFavorite = favoriteIds.includes(id)

        setFavoriteIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )

        toast.info(isFavorite ? "Removed from favorites" : "Added to favorites")
    }, [favoriteIds])

    const clearFavorites = useCallback(() => {
        setFavoriteIds([])
        toast.info("Favorites cleared")
    }, [])

    const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds])

    const favoritesArray = useMemo(
        () => favoriteIds
            .map((id) => CARS.find((car) => car.id === id))
            .filter(Boolean),
        [favoriteIds]
    )

    return (
        <FavoritesContext.Provider
            value={{
                favoriteIds,
                favoritesArray,
                toggleFavorite,
                clearFavorites,
                isFavorite,
                isLoaded,
            }}
        >
            {children}
            <ToastContainer theme="light" position="bottom-right" autoClose={2000} />
        </FavoritesContext.Provider>
    )
}

export default function useFavorites() {
    const context = useContext(FavoritesContext)

    if (!context) {
        throw new Error("useFavorites must be used inside FavoritesProvider")
    }

    return context
}