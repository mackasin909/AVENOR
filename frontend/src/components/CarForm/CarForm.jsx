"use client"

import { useActionState, useRef } from "react"
import { toast } from "react-toastify"
import { createInquiry } from "@/app/actions/inquiries"
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN } from "@/lib/validation"
import styles from "./CarForm.module.scss"

// `hasWhatsApp`: the inquiry continues on WhatsApp (decided by the server,
// see lib/whatsapp.js). `loginForWhatsApp`: a seller's listing viewed by a
// guest, who can log in to message the seller there.
export default function CarForm({ carId, hasWhatsApp = false, loginForWhatsApp = false }) {
    // Browsers block tabs opened after waiting for the server, so the tab
    // is opened right on the click and pointed at WhatsApp once the request
    // is saved (or closed if it fails).
    const popupRef = useRef(null)

    function handleSubmit() {
        if (!hasWhatsApp) return
        const popup = window.open("", "_blank")
        if (popup) {
            popup.opener = null
            popupRef.current = popup
        }
    }

    function finishPopup(url) {
        const popup = popupRef.current
        popupRef.current = null

        if (url && popup && !popup.closed) {
            popup.location.href = url
        } else if (popup && !popup.closed) {
            popup.close()
        } else if (url) {
            // No tab was opened: the "Send via WhatsApp" link below stays.
            window.open(url, "_blank", "noopener")
        }
    }

    async function submit(_previousState, formData) {
        const values = {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            message: String(formData.get("message") ?? ""),
        }

        try {
            const result = await createInquiry(null, formData)

            if (!result.ok) {
                finishPopup(null)
                // Keep what the user typed: React resets the form after an action.
                return { ...result, values }
            }

            toast.success("Request saved")
            finishPopup(result.whatsappUrl)

            return result
        } catch (error) {
            finishPopup(null)
            console.error("Failed to send inquiry", error)
            return {
                ok: false,
                errors: { form: "Could not send your request, please try again" },
                values,
            }
        }
    }

    const [state, formAction, pending] = useActionState(submit, null)
    const errors = state?.errors ?? {}
    const values = state?.values ?? {}

    return (
        <div className={styles.carForm}>
            <div className={styles.formTop}>
                <img src="/icons/user-icon.png" alt="" />
                <h2>Avenor user</h2>
            </div>

            <form action={formAction} onSubmit={handleSubmit}>
                <input type="hidden" name="carId" value={carId} />

                <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    aria-label="Your name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    defaultValue={values.name}
                    aria-invalid={errors.name ? true : undefined}
                    required
                />
                {errors.name && <p className={styles.error}>{errors.name}</p>}

                <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    aria-label="Your email address"
                    autoComplete="email"
                    pattern={EMAIL_PATTERN}
                    maxLength={EMAIL_MAX_LENGTH}
                    title="Enter a valid email, e.g. name@example.com"
                    defaultValue={values.email}
                    aria-invalid={errors.email ? true : undefined}
                    required
                />
                {errors.email && <p className={styles.error}>{errors.email}</p>}

                <textarea
                    name="message"
                    placeholder="Your message"
                    aria-label="Your message"
                    minLength={5}
                    maxLength={2000}
                    defaultValue={values.message}
                    aria-invalid={errors.message ? true : undefined}
                    required
                ></textarea>
                {errors.message && <p className={styles.error}>{errors.message}</p>}

                {errors.form && (
                    <p className={styles.error} role="alert">{errors.form}</p>
                )}

                <button type="submit" disabled={pending}>
                    {pending ? "Sending…" : "Send message"}
                </button>

                {loginForWhatsApp && (
                    <p className={styles.hint}>
                        The seller will see your message in their account. Log in
                        to also continue the chat on WhatsApp.
                    </p>
                )}
            </form>

            {state?.ok && (
                <div className={styles.success} role="status">
                    <p>Your request #{state.inquiryId} has been saved.</p>

                    {state.whatsappUrl && (
                        <a
                            className={styles.whatsapp}
                            href={state.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Send via WhatsApp
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}
