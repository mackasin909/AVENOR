"use client"

import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y, Autoplay } from "swiper/modules"
import Link from "next/link"

import "swiper/css"

import styles from "./Banner.module.scss"
import { formatPrice } from "@/lib/carDetails"

function Arrow({ direction }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d={
                    direction === "left"
                        ? "M14 6L8 12L14 18"
                        : "M10 6L16 12L10 18"
                }
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default function Banner({ cars = [] }) {
    const bannerCars = cars.slice(0, 4)
    const swiperRef = useRef(null)
    const paginationRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)

    if (bannerCars.length === 0) return null

    const hasMultipleCars = bannerCars.length > 1
    const pad = (value) => String(value).padStart(2, "0")

    return (
        <section
            className={styles.banner}
            aria-label="The Avenor collection"
        >
            <div className="container">
                <div className={styles.bannerWrapper}>
                    <div className={styles.bannerInfo}>
                        <span className={styles.eyebrow}>
                            The avenor collection
                        </span>

                        <h1>Curated collection</h1>

                        <p>
                            A handpicked selection of exceptional automobiles.
                        </p>
                    </div>

                    <div className={styles.sliderWrapper}>
                        <div className={styles.sliderViewport}>
                            <Swiper
                                className={styles.slider}
                                modules={[A11y, Autoplay]}
                                onSwiper={(swiper) => {
                                    swiperRef.current = swiper
                                }}
                                onBeforeDestroy={() => {
                                    swiperRef.current = null
                                }}
                                onSlideChange={(swiper) => {
                                    setActiveIndex(swiper.realIndex)
                                }}
                                // Fills the active pagination line in step with
                                // autoplay (written to a CSS variable, no re-render).
                                onAutoplayTimeLeft={(_swiper, _time, progress) => {
                                    paginationRef.current?.style.setProperty(
                                        "--progress",
                                        String(1 - progress)
                                    )
                                }}
                                grabCursor
                                slidesPerView={1}
                                spaceBetween={10}
                                speed={500}
                                loop={bannerCars.length >= 3}
                                watchOverflow
                                // Next slide every 3 s; pauses while hovered, keeps going after
                                // the arrows or dots are used.
                                autoplay={
                                    hasMultipleCars
                                        ? {
                                              delay: 3000,
                                              disableOnInteraction: false,
                                              pauseOnMouseEnter: true,
                                          }
                                        : false
                                }
                                breakpoints={{
                                    640: {
                                        slidesPerView:
                                            bannerCars.length >= 3 ? 1.22 : 1,
                                    },
                                }}
                            >
                                {bannerCars.map((car, index) => (
                                    <SwiperSlide
                                        key={car.id}
                                        className={styles.slideItem}
                                    >
                                        <article className={styles.slide}>
                                            <div className={styles.imageArea}>
                                                <img
                                                    className={styles.imageBackdrop}
                                                    src={car.images[0]}
                                                    alt=""
                                                    aria-hidden="true"
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                />

                                                <img
                                                    className={styles.slideImage}
                                                    src={car.images[0]}
                                                    alt={`${car.brand} ${car.model}`}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                />
                                            </div>

                                            <div className={styles.slideContent}>
                                                <span className={styles.badge}>
                                                    {pad(index + 1)} / {pad(bannerCars.length)}
                                                </span>

                                                <h2>
                                                    {car.brand} {car.model}
                                                </h2>

                                                <p className={styles.price}>
                                                    {formatPrice(car, { spaced: true })}
                                                </p>

                                                <p>
                                                    {[
                                                        car.year,
                                                        car.engine,
                                                        car.fuelType,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>

                                                <Link
                                                    className={styles.details}
                                                    href={`/car/${car.id}`}
                                                >
                                                    View Details
                                                    <span aria-hidden="true">
                                                        →
                                                    </span>
                                                </Link>
                                            </div>
                                        </article>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {hasMultipleCars && (
                                <div className={styles.controls}>
                                    <button
                                        className={`${styles.arrow} ${styles.prev}`}
                                        type="button"
                                        aria-label="Previous car"
                                        onClick={() => {
                                            swiperRef.current?.slidePrev()
                                        }}
                                    >
                                        <Arrow direction="left" />
                                    </button>

                                    <button
                                        className={`${styles.arrow} ${styles.next}`}
                                        type="button"
                                        aria-label="Next car"
                                        onClick={() => {
                                            swiperRef.current?.slideNext()
                                        }}
                                    >
                                        <Arrow direction="right" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {hasMultipleCars && (
                            <div
                                ref={paginationRef}
                                className={styles.pagination}
                                aria-label="Choose a car"
                            >
                                {bannerCars.map((car, index) => (
                                    <button
                                        key={car.id}
                                        type="button"
                                        className={`${styles.dot} ${
                                            activeIndex === index
                                                ? styles.dotActive
                                                : ""
                                        }`}
                                        aria-label={`Show ${car.name}`}
                                        aria-current={
                                            activeIndex === index
                                                ? "true"
                                                : undefined
                                        }
                                        onClick={() => {
                                            const swiper = swiperRef.current

                                            if (!swiper) return

                                            if (swiper.params.loop) {
                                                swiper.slideToLoop(index)
                                            } else {
                                                swiper.slideTo(index)
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}