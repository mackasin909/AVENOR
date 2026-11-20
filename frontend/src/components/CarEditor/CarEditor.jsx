"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
  // All photos in their final order, the first one is the main photo:
  // { id, url } for the car's current photos and { id, url, file } for
  // photos picked in this session. Each pick adds to the list (the browser's
  // file input would replace the previous pick), and the list survives a
  // failed save.
  const [photos, setPhotos] = useState(() =>
    (car?.images ?? []).map((url) => ({ id: url, url, file: null }))
  );
  const [dragId, setDragId] = useState(null);
  const newPhotos = photos.filter((photo) => photo.file);

  async function submit(previousState, formData) {
    // Same order as the "n:<index>" entries of photoOrder below.
    const files = newPhotos.map((photo) => photo.file);
    formData.delete("photos");

    if (!blobMode) {
      // Local disk: the files go to the server action with the form.
      files.forEach((file) => formData.append("photos", file));
    } else {
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

    // On failure the picked photos stay in the list, so the next try sends
    // them again without choosing them anew.
    return saveCar(previousState, formData);
  }

  const [state, action, pending] = useActionState(submit, null);
  const [fileError, setFileError] = useState("");

  const errors = state?.errors ?? {};
  // After a failed save, show what the user typed; otherwise the car's data.
  const values = state?.values ?? car ?? {};
  const photoCount = photos.length;

  function handleFiles(event) {
    const picked = [...event.target.files];
    // Empty the input so the same file can be picked again later; the list
    // below is what gets saved.
    event.target.value = "";
    setFileError("");

    const accepted = [];
    for (const file of picked) {
      if (file.size > MAX_BYTES) {
        setFileError(`${file.name} is larger than 8 MB`);
        continue;
      }
      if (photoCount + accepted.length >= MAX_PHOTOS) {
        setFileError(`Up to ${MAX_PHOTOS} photos per car`);
        break;
      }
      accepted.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      });
    }

    if (accepted.length > 0) {
      setPhotos((current) => [...current, ...accepted]);
    }
  }

  function removePhoto(id) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === id);
      if (photo?.file) URL.revokeObjectURL(photo.url);
      return current.filter((item) => item.id !== id);
    });
    setFileError("");
  }

  // Moves a photo to position `to` (0 = main photo).
  function movePhoto(id, to) {
    setPhotos((current) => {
      const from = current.findIndex((item) => item.id === id);
      if (from === -1 || to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      const [photo] = next.splice(from, 1);
      next.splice(to, 0, photo);
      return next;
    });
  }

  // Position of each photo among the new ones ("n:<index>"), so the server
  // can put uploaded files where the user placed them.
  let newIndex = 0;
  const photoOrder = photos.map((photo) =>
    photo.file ? `n:${newIndex++}` : `k:${photo.url}`
  );

  return (
    <form action={action} className={styles.form}>
      {car && <input type="hidden" name="id" value={car.id} />}
      {photos
        .filter((photo) => !photo.file)
        .map((photo) => (
          <input key={photo.id} type="hidden" name="keepImage" value={photo.url} />
        ))}
      {photoOrder.map((entry) => (
        <input key={entry} type="hidden" name="photoOrder" value={entry} />
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

        <Field
          label={`Add photos (${photoCount} / ${MAX_PHOTOS})`}
          error={fileError || errors.photos}
        >
          {/* No name: the picked files are kept in state and sent from there. */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={photoCount >= MAX_PHOTOS}
            onChange={handleFiles}
          />
        </Field>

        {photos.length > 0 && (
          <>
            <br />
            {photos.length > 1 && (
              <p className={styles.muted}>
                Drag photos to reorder them, or use the arrows. Tap
                “Make main” to put a photo first.
              </p>
            )}
            <div className={styles.photos}>
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={styles.photo}
                  data-dragging={dragId === photo.id || undefined}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDragId(photo.id);
                  }}
                  onDragOver={(event) => {
                    if (!dragId) return;
                    event.preventDefault();
                    if (dragId !== photo.id) movePhoto(dragId, index);
                  }}
                  onDrop={(event) => event.preventDefault()}
                  onDragEnd={() => setDragId(null)}
                >
                  <img src={photo.url} alt={`Photo ${index + 1}`} draggable={false} />
                  {index === 0 ? (
                    <span className={styles.photoMain}>Main</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.photoMain}
                      onClick={() => movePhoto(photo.id, 0)}
                    >
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.photoRemove}
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => removePhoto(photo.id)}
                  >
                    ×
                  </button>
                  {photos.length > 1 && (
                    <div className={styles.photoMove}>
                      <button
                        type="button"
                        aria-label={`Move photo ${index + 1} left`}
                        disabled={index === 0}
                        onClick={() => movePhoto(photo.id, index - 1)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label={`Move photo ${index + 1} right`}
                        disabled={index === photos.length - 1}
                        onClick={() => movePhoto(photo.id, index + 1)}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {errors.form && <p className={styles.error} role="alert">{errors.form}</p>}
      {state && !state.ok && !errors.form && (
        <p className={styles.error} role="alert">
          Please fix the highlighted fields.
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={pending}>
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
