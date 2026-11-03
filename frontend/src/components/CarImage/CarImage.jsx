"use client"
import { useEffect, useState } from "react"
import styles from "./CarImage.module.scss"
import useFavorites from "@/context/FavoritesContext"
import { createPortal } from "react-dom";

export default function CarImage({ car }) {
  const {
    favoritesArray,
    toggleFavorite
  } = useFavorites()

  const [selectedImage, setSelectedImage] = useState(null)
  const isOpen = selectedImage !== null

  const isFavorite = favoritesArray.some((item) => item.id === car.id)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedImage(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => setSelectedImage(car.images[0])}
        aria-label="Открыть главное фото"
      >
        <img
          src={car.images[0]}
          alt={car.name}
          className={styles.mainImage}
        />
      </button>

      <div className={styles.imagesBlock}>
        {car.images.slice(1, 5).map((image, index) => (
          <button
            type="button"
            key={image}
            className={styles.imageButton}
            onClick={() => setSelectedImage(image)}
            aria-label={`Открыть фото ${index + 2}`}
          >
            <img
              src={image}
              alt={`${car.name} — фото ${index + 2}`}
            />
          </button>
        ))}
      </div>

      <div className={styles.buttonBlock}>
        <button 
          type="button"
          onClick={() => toggleFavorite(car)}
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
        <button type="button">Share</button>
      </div>

      {isOpen && createPortal(
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Фото ${car.name}`}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setSelectedImage(null)}
            aria-label="Закрыть фото"
            autoFocus
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt={car.name}
            className={styles.fullImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  )
}