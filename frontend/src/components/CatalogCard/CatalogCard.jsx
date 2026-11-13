"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";

import "swiper/css";

import styles from "./CatalogCard.module.scss";
import useFavorites from "@/context/FavoritesContext";

export default function CatalogCard({
  images = [],
  id,
  name,
  price,
  year,
  location,
}) {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const total = images.length;
  const isFirst = activeIndex === 0;
  const isLast = activeIndex >= total - 1;

  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const isFavorite = checkFavorite(id);

  return (
    <div  className={`col-4 ${styles.catalogCard}`}>
      <div className={styles.gallery}>
        <button
          className={styles.favorite}
          type="button"
          onClick={() => toggleFavorite(id)}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${name} from favorites`
              : `Add ${name} to favorites`
          }
        >
          {isFavorite ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
            </svg>
          )}
        </button>

        <Swiper
          className={styles.slider}
          modules={[A11y]}
          slidesPerView={1}
          spaceBetween={0}
          speed={500}
          loop={false}
          allowTouchMove={false}
          simulateTouch={false}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setActiveIndex(swiper.activeIndex);
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image}-${index}`}>
              <Link href={`/car/${id}`} className={styles.imageWrapper}>
                <img
                  src={image}
                  alt={`${name} — photo ${index + 1}`}
                  loading="lazy"
                  draggable={false}
                />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {total > 1 && (
          <>
            <button
              className={`${styles.arrow} ${styles.arrowPrev}`}
              type="button"
              aria-label="Previous photo"
              disabled={isFirst}
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m14 6-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className={`${styles.arrow} ${styles.arrowNext}`}
              type="button"
              aria-label="Next photo"
              disabled={isLast}
              onClick={() => swiperRef.current?.slideNext()}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m10 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {total > 0 && (
          <div
            className={styles.counter}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.srOnly}>Photo </span>
            {activeIndex + 1} / {total}
          </div>
        )}
      </div>

      <Link href={`/car/${id}`} className={styles.info}>
        <p className={styles.price}>
          $ {Number(price).toLocaleString("en-US")}
        </p>

        <h4 className={styles.name}>
          <span>{year}</span> {name}
        </h4>

        <span className={styles.location}>{location}</span>
      </Link>
    </div>
  );
}