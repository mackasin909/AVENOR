"use client"
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CARS } from "@/data/cars";

export const FavoritesContext = createContext(null)

const STORAGE_KEY = "avenor-favorites"
const EMPTY = []

// Small external store around localStorage, so favorites are read without
// calling setState inside an effect and stay in sync across browser tabs.
const listeners = new Set()
let cachedIds = null

function readIds() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

        if (!Array.isArray(saved)) return EMPTY

        const ids = saved
            .map((item) => (typeof item === "object" && item !== null ? item.id : item))
            .filter((id) => id !== undefined && id !== null)

        return [...new Set(ids)]
    } catch (error) {
        console.error("Failed to read favorites", error)
        return EMPTY
    }
}

function getSnapshot() {
    if (cachedIds === null) {
        cachedIds = readIds()
    }
    return cachedIds
}

function getServerSnapshot() {
    return EMPTY
}

function setIds(nextIds) {
    cachedIds = nextIds

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds))
    } catch (error) {
        console.error("Failed to save favorites", error)
    }

    listeners.forEach((listener) => listener())
}

function subscribe(listener) {
    listeners.add(listener)

    function handleStorage(event) {
        if (event.key === STORAGE_KEY) {
            cachedIds = null
            listener()
        }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
        listeners.delete(listener)
        window.removeEventListener("storage", handleStorage)
    }
}

const subscribeNoop = () => () => {}

export function FavoritesProvider({ children }) {
    const favoriteIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    const isLoaded = useSyncExternalStore(subscribeNoop, () => true, () => false)

    const toggleFavorite = useCallback((carOrId) => {
        const id = typeof carOrId === "object" ? carOrId.id : carOrId
        const current = getSnapshot()
        const wasFavorite = current.includes(id)

        setIds(wasFavorite ? current.filter((x) => x !== id) : [...current, id])

        toast.info(wasFavorite ? "Removed from favorites" : "Added to favorites")
    }, [])

    const clearFavorites = useCallback(() => {
        setIds(EMPTY)
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
