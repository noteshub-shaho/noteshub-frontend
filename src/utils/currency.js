export const formatRupees = (paise) => {
  if (paise === null || paise === undefined || Number.isNaN(Number(paise))) return "—";
  const rupees = Number(paise) / 100;
  return `₹${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
};
