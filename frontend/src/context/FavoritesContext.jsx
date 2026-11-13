"use client"
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  toggleFavorite as toggleFavoriteAction,
  clearFavorites as clearFavoritesAction,
} from "@/app/actions/favorites";
import useSession from "@/context/SessionContext";

export const FavoritesContext = createContext(null)

// Favorites live in the database and belong to the signed-in user.
// `initialIds` is loaded by the root layout on the server.
export function FavoritesProvider({ initialIds, children }) {
    const { user, openSign } = useSession()
    const [favoriteIds, setFavoriteIds] = useState(initialIds)
    const [syncedIds, setSyncedIds] = useState(initialIds)

    // Server sent new data (log in / log out / refresh): adopt it.
    if (syncedIds !== initialIds) {
        setSyncedIds(initialIds)
        setFavoriteIds(initialIds)
    }

    const toggleFavorite = useCallback(async (carId) => {
        if (!user) {
            toast.info("Log in to save cars")
            openSign()
            return
        }

        const wasFavorite = favoriteIds.includes(carId)
        const optimistic = (ids) =>
            wasFavorite ? ids.filter((id) => id !== carId) : [...ids, carId]
        const revert = (ids) =>
            wasFavorite ? [...ids, carId] : ids.filter((id) => id !== carId)

        setFavoriteIds(optimistic)

        try {
            const result = await toggleFavoriteAction(carId)
            if (!result.ok) throw new Error(result.error)

            setFavoriteIds(result.ids)
            toast.info(result.added ? "Added to favorites" : "Removed from favorites")
        } catch (error) {
            console.error("Failed to update favorites", error)
            setFavoriteIds(revert)
            toast.error("Could not update favorites")
        }
    }, [user, openSign, favoriteIds])

    const clearFavorites = useCallback(async () => {
        const previous = favoriteIds
        setFavoriteIds([])

        try {
            const result = await clearFavoritesAction()
            if (!result.ok) throw new Error(result.error)
            toast.info("Favorites cleared")
        } catch (error) {
            console.error("Failed to clear favorites", error)
            setFavoriteIds(previous)
            toast.error("Could not clear favorites")
        }
    }, [favoriteIds])

    const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds])

    const value = useMemo(
        () => ({ favoriteIds, toggleFavorite, clearFavorites, isFavorite }),
        [favoriteIds, toggleFavorite, clearFavorites, isFavorite]
    )

    return (
        <FavoritesContext.Provider value={value}>
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
