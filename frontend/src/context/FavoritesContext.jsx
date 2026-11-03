"use client"
import { createContext, useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
    const [favoritesArray, setFavoritesArray] = useState([])

    function toggleFavorite(car) {
        const isFavorite = favoritesArray.some((item) => item.id === car.id);

        setFavoritesArray((prev) => 
            prev.some((item) => item.id === car.id)
                ? prev.filter((item) => item.id !== car.id)
                : [...prev, car]
        )

        if (isFavorite) {
            toast.info("Removed from favorites")
        } else {
            toast.info("Added to favorites")
        }
    }

    return (
        <FavoritesContext.Provider
            value={{
                toggleFavorite,
                favoritesArray,
                setFavoritesArray,
            }}
        >
            {children}
            <ToastContainer theme="light" position="bottom-right" autoClose={2000} />
        </FavoritesContext.Provider>
    )
}

export default function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites должен использоваться внутри FavoritesProvider");
  }

  return context;
}