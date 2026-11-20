import "server-only";

// Dealer WhatsApp number from .env, digits only (e.g. 79991234567).
export function getDealerWhatsApp() {
  const digits = String(process.env.WHATSAPP_PHONE ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

// Where an inquiry about this car can continue on WhatsApp, or null.
// Dealer cars: the dealer number, for everyone. Cars listed by users: the
// seller's own number, but only for logged-in buyers, so the seller's
// phone is not handed out to anonymous visitors (they still reach the
// seller through the inquiry, which the seller sees in "Inquiries").
export function whatsAppPhoneFor({ ownerId, ownerPhone }, viewer) {
  if (ownerId === null || ownerId === undefined) return getDealerWhatsApp();
  return viewer ? ownerPhone ?? null : null;
}
