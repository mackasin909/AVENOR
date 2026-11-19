"use client"
import { useEffect, useState } from "react"
import styles from "./CarImage.module.scss"
import useFavorites from "@/context/FavoritesContext"
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import CompareButton from "@/components/Compare/CompareButton";

export default function CarImage({ car }) {
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites()

  // Up to 5 photos: order[0] is the big one, the rest are thumbnails.
  // Clicking a thumbnail swaps it with the big photo; clicking the big
  // photo opens it full screen.
  const [order, setOrder] = useState(() => car.images.slice(0, 5))
  const mainImage = order[0]
  const thumbnails = order.slice(1)

  const [selectedImage, setSelectedImage] = useState(null)
  const isOpen = selectedImage !== null

  function showAsMain(position) {
    setOrder((current) => {
      const next = [...current]
      ;[next[0], next[position]] = [next[position], next[0]]
      return next
    })
  }

  const isFavorite = checkFavorite(car.id)

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

  async function handleShare() {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: car.name, url })
      } catch (error) {
        if (error?.name !== "AbortError") {
          toast.error("Could not share this listing")
        }
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.info("Link copied to clipboard")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => setSelectedImage(mainImage)}
        aria-label="Open photo full screen"
      >
        <img
          key={mainImage}
          src={mainImage}
          alt={car.name}
          className={styles.mainImage}
        />
      </button>

      <div className={styles.imagesBlock}>
        {thumbnails.map((image, index) => (
          <button
            type="button"
            key={image}
            className={`${styles.imageButton} ${styles.thumbButton}`}
            onClick={() => showAsMain(index + 1)}
            aria-label={`Show photo ${index + 2} as the main photo`}
          >
            <img
              src={image}
              alt={`${car.name} — photo ${index + 2}`}
            />
          </button>
        ))}
      </div>

      <div className={styles.buttonBlock}>
        <button 
          type="button"
          onClick={() => toggleFavorite(car.id)}
          aria-pressed={isFavorite}
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
        <button type="button" onClick={handleShare}>Share</button>
        {car.status === "approved" && <CompareButton carId={car.id} />}
      </div>

      {isOpen && createPortal(
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${car.name} photo`}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setSelectedImage(null)}
            aria-label="Close photo"
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