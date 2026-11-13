"use client"

import { toast } from "react-toastify"
import styles from "./CarForm.module.scss"

export default function CarForm() {
    function handleSubmit(event) {
        event.preventDefault()
        event.currentTarget.reset()
        toast.success("Message sent")
    }

    return (
        <div className={styles.carForm}>
            <div className={styles.formTop}>
                <img src="/icons/user-icon.png" alt="" />
                <h2>Avenor user</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    aria-label="Your name"
                    autoComplete="name"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    aria-label="Your email address"
                    autoComplete="email"
                    required
                />
                <textarea
                    name="message"
                    placeholder="Your message"
                    aria-label="Your message"
                    required
                ></textarea>
                <button type="submit">Send message</button>
            </form>
        </div>
    )
}
