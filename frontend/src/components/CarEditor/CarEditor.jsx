"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { saveCar } from "@/app/actions/cars";
import { FUEL_TYPES } from "@/lib/catalogParams";
import styles from "@/styles/panel.module.scss";

const MAX_PHOTOS = 10;
const MAX_BYTES = 8 * 1024 * 1024;

function Field({ label, error, children }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

// Unique, URL-safe file name, e.g. "3f2a…-front-view.jpg".
function blobFileName(name) {
  const safe = String(name || "photo").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60);
  return `${crypto.randomUUID()}-${safe}`;
}

// `blobMode` (set by the page when a Vercel Blob store is connected:
// "token" or "presigned", see lib/uploads.js): the browser uploads selected
// photos straight to Blob and the form sends their URLs, which keeps
// requests under Vercel's body size limit.
// `uploadPrefix`: the user's own Blob folder (cars/<id>/), from the page.
export default function CarEditor({
  car = null,
  cancelHref,
  note,
  blobMode = null,
  uploadPrefix = "",
}) {
  const [uploading, setUploading] = useState(false);

  async function submit(previousState, formData) {
    if (blobMode) {
      const files = formData
        .getAll("photos")
        .filter((file) => typeof file === "object" && file.size > 0);
      formData.delete("photos");

      if (files.length > 0) {
        setUploading(true);
        try {
          const { upload, uploadPresigned } = await import("@vercel/blob/client");
          const send = blobMode === "presigned" ? uploadPresigned : upload;

          for (const file of files) {
            const blob = await send(`${uploadPrefix}${blobFileName(file.name)}`, file, {
              access: "public",
              handleUploadUrl: "/api/upload",
              contentType: file.type,
            });
            formData.append("uploadedImage", blob.url);
          }
        } catch (error) {
          console.error("Photo upload failed", error);
          clearPreviews();
          return {
            ok: false,
            errors: { photos: error?.message || "Could not upload photos" },
            values: Object.fromEntries(formData),
          };
        } finally {
          setUploading(false);
        }
      }
    }

    const result = await saveCar(previousState, formData);

    // React empties the file input after a failed save, so drop the old
    // previews too: the photos have to be chosen again.
    if (result && !result.ok) clearPreviews();

    return result;
  }

  const [state, action, pending] = useActionState(submit, null);
  const [keptImages, setKeptImages] = useState(car?.images ?? []);
  const [previews, setPreviews] = useState([]);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const errors = state?.errors ?? {};
  // After a failed save, show what the user typed; otherwise the car's data.
  const values = state?.values ?? car ?? {};

  function clearPreviews() {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews([]);
  }

  function handleFiles(event) {
    const files = [...event.target.files];
    clearPreviews();
    setFileError("");

    const tooBig = files.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setFileError(`${tooBig.name} is larger than 8 MB`);
      event.target.value = "";
      return;
    }
    if (files.length + keptImages.length > MAX_PHOTOS) {
      setFileError(`Up to ${MAX_PHOTOS} photos per car`);
      event.target.value = "";
      return;
    }

    setPreviews(
      files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))
    );
  }

  function resetFiles() {
    clearPreviews();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeKept(url) {
    setKeptImages((images) => images.filter((image) => image !== url));
  }

  function makeMain(url) {
    setKeptImages((images) => [url, ...images.filter((image) => image !== url)]);
  }

  return (
    <form action={action} className={styles.form}>
      {car && <input type="hidden" name="id" value={car.id} />}
      {keptImages.map((url) => (
        <input key={url} type="hidden" name="keepImage" value={url} />
      ))}

      {note && <p className={styles.muted}>{note}</p>}

      <div className={styles.card}>
        <h2 className={styles.subtitle}>Car</h2>

        <div className={styles.form}>
          <div className={styles.fieldsRow}>
            <Field label="Make" error={errors.brand}>
              <input name="brand" defaultValue={values.brand} maxLength={40} required />
            </Field>
            <Field label="Model" error={errors.model}>
              <input name="model" defaultValue={values.model} maxLength={60} required />
            </Field>
            <Field label="Year" error={errors.year}>
              <input
                name="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                defaultValue={values.year}
                required
              />
            </Field>
          </div>

          <div className={styles.fieldsRow}>
            <Field label="Price, $" error={errors.price}>
              <input
                name="price"
                type="number"
                min={1}
                step={1}
                defaultValue={values.price}
                required
              />
            </Field>
            <Field label="Mileage, mi" error={errors.mileage}>
              <input
                name="mileage"
                type="number"
                min={0}
                step={1}
                defaultValue={values.mileage}
                required
              />
            </Field>
            <Field label="Fuel type" error={errors.fuelType}>
              {/* key: React does not re-apply a select's defaultValue after the
                  form resets, so rebuild it with the restored value. */}
              <select
                key={`fuel-${values.fuelType ?? ""}`}
                name="fuelType"
                defaultValue={values.fuelType ?? ""}
                required
              >
                <option value="" disabled>Choose…</option>
                {FUEL_TYPES.map((fuel) => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className={styles.fieldsRow}>
            <Field label="Engine" error={errors.engine}>
              <input
                name="engine"
                placeholder="e.g. 8 Cylinder"
                defaultValue={values.engine}
                maxLength={60}
                required
              />
            </Field>
            <Field label="Gearbox" error={errors.gearbox}>
              <input
                name="gearbox"
                placeholder="e.g. 7-speed dual-clutch"
                defaultValue={values.gearbox}
                maxLength={60}
                required
              />
            </Field>
          </div>

          <Field label="Location (city, region, country)" error={errors.location}>
            <input
              name="location"
              placeholder="Miami, FL, United States"
              defaultValue={values.location}
              maxLength={120}
              required
            />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              name="description"
              defaultValue={values.description}
              minLength={20}
              maxLength={5000}
              required
            />
          </Field>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.subtitle}>Photos</h2>
        <p className={styles.muted}>
          JPEG, PNG or WebP, up to 8 MB each, {MAX_PHOTOS} photos max. The first
          photo is the main one.
        </p>
        <br />

        {keptImages.length > 0 && (
          <>
            <div className={styles.photos}>
              {keptImages.map((url, index) => (
                <div key={url} className={styles.photo}>
                  <img src={url} alt={`Photo ${index + 1}`} />
                  {index === 0 ? (
                    <span className={styles.photoMain}>Main</span>
                  ) : (
                    <span
                      className={styles.photoMain}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => makeMain(url)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") makeMain(url);
                      }}
                    >
                      Make main
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => removeKept(url)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <br />
          </>
        )}

        <Field label="Add photos" error={fileError || errors.photos}>
          <input
            ref={fileInputRef}
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFiles}
          />
        </Field>

        {previews.length > 0 && (
          <>
            <br />
            <div className={styles.photos}>
              {previews.map((preview) => (
                <div key={preview.url} className={styles.photo}>
                  <img src={preview.url} alt={preview.name} />
                </div>
              ))}
            </div>
            <br />
            <button type="button" className={`${styles.buttonSecondary} ${styles.buttonSmall}`} onClick={resetFiles}>
              Clear selected photos
            </button>
          </>
        )}
      </div>

      {errors.form && <p className={styles.error} role="alert">{errors.form}</p>}
      {state && !state.ok && !errors.form && (
        <p className={styles.error} role="alert">
          Please fix the highlighted fields{errors.photos ? "" : " (photos you selected need to be chosen again)"}.
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={pending || Boolean(fileError)}>
          {uploading ? "Uploading photos…" : pending ? "Saving…" : car ? "Save changes" : "Publish listing"}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className={styles.buttonSecondary}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
