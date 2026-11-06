import styles from "./Banner.module.scss"

export default function Banner() {
    return (
        <div className={styles.banner}>
            <div className="container">
                <div className={styles.bannerWrapper}>
                    <span>
                        The avenor collection
                        <img src="/icons/banner-line.png" alt="" />
                    </span>
                    <h1>curated collection</h1>
                    <p>A handpicked of exceptional automobiles.</p>
                </div>
            </div>
        </div>
    )
}