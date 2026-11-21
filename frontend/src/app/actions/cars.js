"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { countryFrom } from "@/lib/cars";
import { FUEL_TYPES } from "@/lib/catalogParams";
import {
  BODY_TYPES,
  COLORS,
  CONDITIONS,
  STEERING_OPTIONS,
  VIN_PATTERN,
} from "@/lib/carDetails";
import {
  MAX_IMAGES_PER_CAR,
  deleteUploadedImages,
  isBlobEnabled,
  describeBlobChecks,
  isOwnBlobUrl,
  saveCarImage,
} from "@/lib/uploads";

const MAX_YEAR = new Date().getFullYear() + 1;

const TEXT_FIELDS = {
  brand: { label: "Make", min: 1, max: 40 },
  model: { label: "Model", min: 1, max: 60 },
  engine: { label: "Engine", min: 1, max: 60 },
  gearbox: { label: "Gearbox", min: 1, max: 60 },
  location: { label: "Location", min: 3, max: 120 },
  description: { label: "Description", min: 20, max: 5000 },
};

const NUMBER_FIELDS = {
  year: { label: "Year", min: 1900, max: MAX_YEAR },
  price: { label: "Price", min: 1, max: 1_000_000_000 },
  mileage: { label: "Mileage", min: 0, max: 2_000_000 },
};

// Choices from a fixed list (lib/carDetails.js).
const CHOICE_FIELDS = {
  bodyType: { label: "a body type", options: BODY_TYPES },
  exteriorColor: { label: "an exterior color", options: COLORS },
  interiorColor: { label: "an interior color", options: COLORS },
  steering: { label: "the steering side", options: STEERING_OPTIONS.map((option) => option.value) },
  condition: { label: "the condition", options: CONDITIONS },
};

function readCarFields(formData) {
  const values = {};
  const errors = {};

  for (const [key, rule] of Object.entries(TEXT_FIELDS)) {
    const value = String(formData.get(key) ?? "").trim();
    values[key] = value;
    if (value.length < rule.min || value.length > rule.max) {
      errors[key] = `${rule.label} must be ${rule.min}–${rule.max} characters`;
    }
  }

  for (const [key, rule] of Object.entries(NUMBER_FIELDS)) {
    const raw = String(formData.get(key) ?? "").replace(/[\s,]/g, "");
    values[key] = raw;
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < rule.min || value > rule.max) {
      errors[key] = `${rule.label} must be a whole number from ${rule.min.toLocaleString("en-US")} to ${rule.max.toLocaleString("en-US")}`;
    }
  }

  values.fuelType = String(formData.get("fuelType") ?? "");
  if (!FUEL_TYPES.includes(values.fuelType)) {
    errors.fuelType = "Choose a fuel type";
  }

  for (const [key, rule] of Object.entries(CHOICE_FIELDS)) {
    values[key] = String(formData.get(key) ?? "");
    if (!rule.options.includes(values[key])) errors[key] = `Choose ${rule.label}`;
  }

  // Optional: power in hp.
  values.horsepower = String(formData.get("horsepower") ?? "").replace(/[\s,]/g, "");
  if (values.horsepower !== "") {
    const hp = Number(values.horsepower);
    if (!Number.isInteger(hp) || hp < 1 || hp > 5000) {
      errors.horsepower = "Power must be a whole number from 1 to 5,000 hp";
    }
  }

  // Optional: VIN, stored in capitals without spaces.
  values.vin = String(formData.get("vin") ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (values.vin !== "" && !VIN_PATTERN.test(values.vin)) {
    errors.vin = "A VIN has 17 letters and digits (no I, O or Q)";
  }

  values.priceOnRequest = formData.get("priceOnRequest") === "on";

  return { values, errors };
}

// The order chosen in the editor: "k:<url>" is a kept photo, "n:<index>"
// the index-th new photo. Anything missing from the list goes at the end, so
// a bad or absent order never loses a photo.
function orderPhotos(order, keptUrls, newUrls) {
  const ordered = [];
  for (const entry of order) {
    const url = entry.startsWith("k:")
      ? keptUrls.find((kept) => kept === entry.slice(2))
      : entry.startsWith("n:")
        ? newUrls[Number(entry.slice(2))]
        : undefined;
    if (url && !ordered.includes(url)) ordered.push(url);
  }
  for (const url of [...keptUrls, ...newUrls]) {
    if (!ordered.includes(url)) ordered.push(url);
  }
  return ordered;
}

function canManage(user, car) {
  return user.role === "admin" || (car.ownerId !== null && car.ownerId === user.id);
}

function listPath(user) {
  return user.role === "admin" ? "/admin/cars" : "/my-listings";
}

export async function saveCar(_previousState, formData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: { form: "Please log in again" } };

  const id = Number(formData.get("id")) || null;
  const { values, errors } = readCarFields(formData);

  // Photos the browser already uploaded to Vercel Blob (production). Only
  // files this user uploaded to OUR store, and not used by any listing yet,
  // are accepted: a form cannot claim (and later delete) someone else's photo.
  const submittedBlobUrls = isBlobEnabled()
    ? [...new Set(formData.getAll("uploadedImage").map(String))]
    : [];
  const ownBlobUrls = submittedBlobUrls.filter((url) => isOwnBlobUrl(url, user.id));
  const usedUrls = ownBlobUrls.length
    ? new Set(
        (
          await prisma.carImage.findMany({
            where: { url: { in: ownBlobUrls } },
            select: { url: true },
          })
        ).map((image) => image.url)
      )
    : new Set();
  const blobUrls = ownBlobUrls.filter((url) => !usedUrls.has(url));

  const rejectedBlobUrls = submittedBlobUrls.filter((url) => !blobUrls.includes(url));
  if (rejectedBlobUrls.length > 0) {
    // Store host and folder are part of every photo URL, nothing secret here.
    console.warn("Rejected uploaded photo URLs", {
      rejected: rejectedBlobUrls,
      alreadyUsed: rejectedBlobUrls.filter((url) => usedUrls.has(url)),
      ...describeBlobChecks(user.id),
    });
  }

  // On failure the form is reset, so photos uploaded for this attempt are
  // removed again; the user picks them once more. Only the files that passed
  // the checks above are ever deleted here.
  const fail = async (extra = {}) => {
    await deleteUploadedImages(blobUrls);
    return { ok: false, errors: { ...errors, ...extra }, values };
  };

  let existing = null;
  if (id) {
    existing = await prisma.car.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    });
    if (!existing || !canManage(user, existing)) {
      return fail({ form: "You cannot edit this listing" });
    }
  }

  // Photos the user kept, in the chosen order; only the car's own photos.
  const currentUrls = existing?.images.map((image) => image.url) ?? [];
  const keptUrls = formData
    .getAll("keepImage")
    .map(String)
    .filter((url, index, all) => currentUrls.includes(url) && all.indexOf(url) === index);

  const newFiles = formData
    .getAll("photos")
    .filter((file) => typeof file === "object" && file !== null && file.size > 0);

  const total = keptUrls.length + blobUrls.length + newFiles.length;
  if (total === 0) errors.photos = "Add at least one photo";
  if (total > MAX_IMAGES_PER_CAR) {
    errors.photos = `Up to ${MAX_IMAGES_PER_CAR} photos per car`;
  }
  // The more specific reason wins over "Add at least one photo".
  if (rejectedBlobUrls.length > 0) {
    errors.photos = "Some photos could not be used, please choose them again";
  }

  if (Object.keys(errors).length > 0) return fail();

  const uploadedUrls = [];
  for (const file of newFiles) {
    const result = await saveCarImage(file);
    if (result.error) {
      await deleteUploadedImages(uploadedUrls);
      return fail({ photos: result.error });
    }
    uploadedUrls.push(result.url);
  }

  const imageRows = orderPhotos(
    formData.getAll("photoOrder").map(String),
    keptUrls,
    [...blobUrls, ...uploadedUrls]
  ).map((url, position) => ({ url, position }));

  const data = {
    brand: values.brand,
    model: values.model,
    year: Number(values.year),
    price: Number(values.price),
    mileage: Number(values.mileage),
    engine: values.engine,
    gearbox: values.gearbox,
    fuelType: values.fuelType,
    bodyType: values.bodyType,
    exteriorColor: values.exteriorColor,
    interiorColor: values.interiorColor,
    horsepower: values.horsepower === "" ? null : Number(values.horsepower),
    steering: values.steering,
    condition: values.condition,
    vin: values.vin || null,
    priceOnRequest: values.priceOnRequest,
    location: values.location,
    country: countryFrom(values.location),
    description: values.description,
  };

  // Admin changes keep the current status; user edits go back to review.
  const moderation =
    user.role === "admin"
      ? existing
        ? {}
        : { status: "approved", statusNote: null }
      : { status: "pending", statusNote: null };

  try {
    if (existing) {
      await prisma.car.update({
        where: { id: existing.id },
        data: {
          ...data,
          ...moderation,
          images: { deleteMany: {}, create: imageRows },
        },
      });
    } else {
      await prisma.car.create({
        data: {
          ...data,
          ...moderation,
          ownerId: user.role === "admin" ? null : user.id,
          images: { create: imageRows },
        },
      });
    }
  } catch (error) {
    console.error("Failed to save car", error);
    await deleteUploadedImages(uploadedUrls);
    return fail({ form: "Could not save the listing, please try again" });
  }

  // Photos removed in the editor.
  await deleteUploadedImages(currentUrls.filter((url) => !keptUrls.includes(url)));

  redirect(listPath(user));
}

// Photos the browser uploaded for a save that then failed half way (e.g.
// the 3rd of 5 uploads broke): removed so they do not stay in the store.
// Only this user's own files that no listing uses are deleted.
export async function discardUploads(urls) {
  const user = await getCurrentUser();
  if (!user || !Array.isArray(urls)) return { ok: false };

  const own = [...new Set(urls.map(String))]
    .slice(0, MAX_IMAGES_PER_CAR)
    .filter((url) => isOwnBlobUrl(url, user.id));
  if (own.length === 0) return { ok: true };

  const used = new Set(
    (
      await prisma.carImage.findMany({
        where: { url: { in: own } },
        select: { url: true },
      })
    ).map((image) => image.url)
  );

  await deleteUploadedImages(own.filter((url) => !used.has(url)));
  return { ok: true };
}

export async function deleteCar(carId) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const car = await prisma.car.findUnique({
    where: { id: Number(carId) },
    include: { images: { select: { url: true } } },
  });

  if (!car || !canManage(user, car)) {
    return { ok: false, error: "You cannot delete this listing" };
  }

  await prisma.car.delete({ where: { id: car.id } });
  await deleteUploadedImages(car.images.map((image) => image.url));

  refresh();
  return { ok: true };
}

export async function setCarStatus(carId, status, note = "") {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: "Admins only" };

  if (!["approved", "rejected", "pending"].includes(status)) {
    return { ok: false, error: "Unknown status" };
  }

  const statusNote =
    status === "rejected" ? String(note ?? "").trim().slice(0, 500) || null : null;

  try {
    await prisma.car.update({
      where: { id: Number(carId) },
      data: { status, statusNote },
    });
  } catch (error) {
    // Deleted in another tab or by another admin.
    if (error?.code === "P2025") {
      refresh();
      return { ok: false, error: "This listing no longer exists" };
    }
    throw error;
  }

  refresh();
  return { ok: true };
}
