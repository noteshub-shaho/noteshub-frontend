export const SUPPORT_WHATSAPP_NUMBER = "919773166286";

export const buildCouponRequestUrl = ({ name, email, noteTitle }) => {
  const message = [
    "Hi! I'd like to get a special coupon for my NotesHub purchase.",
    "",
    `Name: ${name || ""}`,
    `Email: ${email || ""}`,
    `Notes: ${noteTitle || ""}`,
    "",
    "Please share an available coupon code for this purchase. Thank you!",
  ].join("\n");

  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
