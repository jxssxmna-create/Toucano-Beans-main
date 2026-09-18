/**
 * Profile field shape matching public.profiles
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} [email]
 * @property {string} [full_name]
 * @property {string} [phone_number]
 * @property {'admin'|'delivery'|'buyer'} [role]
 * @property {string} [building_number]
 * @property {string} [street_number]
 * @property {string} [zone_number]
 * @property {string} [google_map_link]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

export const EMPTY_PROFILE = {
  full_name: '',
  phone_number: '',
  email: '',
  building_number: '',
  street_number: '',
  zone_number: '',
  google_map_link: '',
  role: 'buyer',
};

/** Columns users are allowed to update (never role / id). */
export const PROFILE_UPDATE_FIELDS = [
  'full_name',
  'phone_number',
  'building_number',
  'street_number',
  'zone_number',
  'google_map_link',
];
