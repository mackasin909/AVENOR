"use client"

import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { A11y } from "swiper/modules"
import { CARS } from "@/data/cars"

import "swiper/css"
import styles from "./Banner.module.scss"

const bannerCars = CARS.slice(0, 4)

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

export default function Banner() {
    const swiperRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)

    if (bannerCars.length === 0) return null

    const hasMultipleCars = bannerCars.length > 1

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
                                modules={[A11y]}
                                onSwiper={(swiper) => {
                                    swiperRef.current = swiper
                                }}
                                onBeforeDestroy={() => {
                                    swiperRef.current = null
                                }}
                                onSlideChange={(swiper) => {
                                    setActiveIndex(swiper.realIndex)
                                }}
                                slidesPerView={1}
                                spaceBetween={10}
                                speed={500}
                                loop={bannerCars.length >= 3}
                                watchOverflow
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
                                                    The Avenor collection
                                                </span>

                                                <h2>
                                                    {car.brand} {car.model}
                                                </h2>

                                                <p>
                                                    {[
                                                        car.year,
                                                        car.engine,
                                                        car.fuelType,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>

                                                <a
                                                    className={styles.details}
                                                    href={`/car/${car.id}`}
                                                >
                                                    View Details
                                                    <span aria-hidden="true">
                                                        →
                                                    </span>
                                                </a>
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
                                        aria-label="Предыдущий автомобиль"
                                        onClick={() => {
                                            swiperRef.current?.slidePrev()
                                        }}
                                    >
                                        <Arrow direction="left" />
                                    </button>

                                    <button
                                        className={`${styles.arrow} ${styles.next}`}
                                        type="button"
                                        aria-label="Следующий автомобиль"
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
                                className={styles.pagination}
                                aria-label="Выбор автомобиля"
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
                                        aria-label={`Показать ${car.brand} ${car.model}`}
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