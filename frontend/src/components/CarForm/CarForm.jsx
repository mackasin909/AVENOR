import styles from "./CarForm.module.scss"

export default function CarForm() {
    return (
        <div className={styles.carForm}>
            <div className={styles.formTop}>
                <img src="/icons/user-icon.png" alt="" />
                <h2>Avenor user</h2>
            </div>
            <form>
                <input type="text" placeholder="Your name"/>
                <input type="text" placeholder="Your email address"/>
                <textarea placeholder="Your message"></textarea>
                <button>Send message</button>
            </form>
        </div>
    )
}