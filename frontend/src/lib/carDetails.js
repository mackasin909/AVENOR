// Listing details: the choices offered in the editor and how they are shown.
// Shared by the server (validation) and the browser (forms, cards).

export const BODY_TYPES = [
  "Coupe",
  "Convertible",
  "Roadster",
  "Sedan",
  "SUV",
  "Hatchback",
  "Wagon",
  "Pickup",
];

export const COLORS = [
  "Black",
  "White",
  "Grey",
  "Silver",
  "Blue",
  "Red",
  "Green",
  "Yellow",
  "Orange",
  "Brown",
  "Beige",
  "Gold",
  "Purple",
  "Other",
];

export const STEERING_OPTIONS = [
  { value: "LHD", label: "Left-hand drive" },
  { value: "RHD", label: "Right-hand drive" },
];

export const CONDITIONS = ["Used", "New"];

// 17 characters, no I, O or Q (ISO 3779).
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

const KM_PER_MILE = 1.609344;
// A listing counts as new for a week.
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const number = (value) => Number(value).toLocaleString("en-US");

// "$679,106", or "Price on request" when the seller hides the price.
// `spaced`: "$ 679,106", the style of the cards and the car page.
export function formatPrice(car, { spaced = false } = {}) {
  if (car.priceOnRequest) return "Price on request";
  return `$${spaced ? " " : ""}${number(car.price)}`;
}

// "16,903 mi (27,203 km)"
export function formatMileage(miles) {
  return `${number(miles)} mi (${number(Math.round(miles * KM_PER_MILE))} km)`;
}

// "November 18, 2026". UTC, so the server and the browser print the same day.
export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Server only (lib/cars.js toCar), so the page and the browser agree.
export function isNewListing(createdAt, now = Date.now()) {
  if (!createdAt) return false;
  return now - new Date(createdAt).getTime() < NEW_FOR_MS;
}

export function steeringLabel(value) {
  return STEERING_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

// Rows of the "Car details" table; details the listing does not have are
// left out.
export function getCarDetails(car) {
  const rows = [
    ["Year", car.year],
    ["Condition", car.condition],
    ["Mileage", formatMileage(car.mileage)],
    ["Body type", car.bodyType],
    ["Engine", car.engine],
    ["Power", car.horsepower ? `${number(car.horsepower)} hp (${number(Math.round(car.horsepower * 0.7457))} kW)` : null],
    ["Gearbox", car.gearbox],
    ["Fuel type", car.fuelType],
    ["Steering", car.steering ? steeringLabel(car.steering) : null],
    ["Exterior color", car.exteriorColor],
    ["Interior color", car.interiorColor],
    ["VIN", car.vin],
    ["Location", car.location],
  ];

  return rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => ({ label, value: String(value) }));
}
