"use client"
import { useEffect, useState } from "react"
import styles from "./CarImage.module.scss"
import useFavorites from "@/context/FavoritesContext"
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import CompareButton from "@/components/Compare/CompareButton";

export default function CarImage({ car }) {
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites()

  // order[0] is the big photo, the next 4 are thumbnails. Clicking a
  // thumbnail swaps it with the big photo; clicking the big photo opens the
  // full-screen viewer, which shows every photo. With more than 5 photos the
  // last thumbnail says "+N" and opens the viewer.
  const [order, setOrder] = useState(() => car.images)
  const mainImage = order[0]
  const thumbnails = order.slice(1, 5)
  const hiddenCount = order.length - 5

  // Index in car.images of the photo shown full screen, or null.
  const [viewerIndex, setViewerIndex] = useState(null)
  const isOpen = viewerIndex !== null
  const total = car.images.length

  function showAsMain(position) {
    setOrder((current) => {
      const next = [...current]
      ;[next[0], next[position]] = [next[position], next[0]]
      return next
    })
  }

  function openViewer(image) {
    setViewerIndex(Math.max(0, car.images.indexOf(image)))
  }

  const isFavorite = checkFavorite(car.id)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event) {
      if (event.key === "Escape") setViewerIndex(null)
      if (event.key === "ArrowLeft") {
        setViewerIndex((index) => (index - 1 + total) % total)
      }
      if (event.key === "ArrowRight") {
        setViewerIndex((index) => (index + 1) % total)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, total])

  function step(event, delta) {
    event.stopPropagation()
    setViewerIndex((index) => (index + delta + total) % total)
  }

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
        onClick={() => openViewer(mainImage)}
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
        {thumbnails.map((image, index) => {
          const isMore = hiddenCount > 0 && index === thumbnails.length - 1

          return (
            <button
              type="button"
              key={image}
              className={`${styles.imageButton} ${styles.thumbButton}`}
              onClick={() => (isMore ? openViewer(image) : showAsMain(index + 1))}
              aria-label={
                isMore
                  ? `Show all ${total} photos`
                  : `Show photo ${index + 2} as the main photo`
              }
            >
              <img
                src={image}
                alt={`${car.name} — photo ${index + 2}`}
              />
              {isMore && (
                <span className={styles.more} aria-hidden="true">
                  +{hiddenCount + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.buttonBlock}>
        {/* Only catalog cars can be saved (not pending / rejected ones). */}
        {car.status === "approved" && (
          <button
            type="button"
            onClick={() => toggleFavorite(car.id)}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "Saved" : "Save"}
          </button>
        )}
        <button type="button" onClick={handleShare}>Share</button>
        {car.status === "approved" && <CompareButton carId={car.id} />}
      </div>

      {isOpen && createPortal(
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${car.name} photos`}
          onClick={() => setViewerIndex(null)}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setViewerIndex(null)}
            aria-label="Close photo"
            autoFocus
          >
            ×
          </button>

          <img
            key={viewerIndex}
            src={car.images[viewerIndex]}
            alt={`${car.name} — photo ${viewerIndex + 1} of ${total}`}
            className={styles.fullImage}
            onClick={(event) => event.stopPropagation()}
          />

          {total > 1 && (
            <>
              <button
                type="button"
                className={`${styles.viewerArrow} ${styles.viewerPrev}`}
                onClick={(event) => step(event, -1)}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.viewerArrow} ${styles.viewerNext}`}
                onClick={(event) => step(event, 1)}
                aria-label="Next photo"
              >
                ›
              </button>
              <p className={styles.viewerCount} aria-live="polite">
                {viewerIndex + 1} / {total}
              </p>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
