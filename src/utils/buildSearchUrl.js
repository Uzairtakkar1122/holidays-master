import { REGION_ID_MAPPING } from '../data/regionIdMapping';

const formatYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const slugifyKey = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .split(',')[0]
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const getStoredResidency = () => {
  try {
    return (localStorage.getItem('user_residency') || 'pk').toLowerCase();
  } catch {
    return 'pk';
  }
};

const getStoredCurrencyCode = () => {
  try {
    const saved = localStorage.getItem('user_currency');
    if (!saved) return 'USD';
    const parsed = JSON.parse(saved);
    return String(parsed?.code || 'USD').toUpperCase();
  } catch {
    return 'USD';
  }
};

export const buildSearchUrl = ({ title, regionId }) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const key = slugifyKey(title);
  const mapped = REGION_ID_MAPPING[key];
  const finalRegionId = regionId || mapped?.id;

  if (!finalRegionId) {
    return null;
  }

  const params = new URLSearchParams({
    location: title,
    region_id: String(finalRegionId),
    checkin: formatYmd(today),
    checkout: formatYmd(tomorrow),
    adults: '2',
    children_ages: JSON.stringify([]),
    residency: getStoredResidency(),
    currency: getStoredCurrencyCode()
  });

  return `/search?${params.toString()}`;
};
