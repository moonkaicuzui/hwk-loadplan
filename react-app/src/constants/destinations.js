/**
 * @fileoverview Destination Constants
 * Defines important shipping destinations and country mappings.
 *
 * @module constants/destinations
 */

/**
 * Important destinations (Asian markets)
 * Used for filtering and highlighting
 */
export const IMPORTANT_DESTINATIONS = {
  'JAPAN': { code: 'JP', region: 'Asia', priority: 1, flag: '🇯🇵' },
  'KOREA': { code: 'KR', region: 'Asia', priority: 2, flag: '🇰🇷' },
  'CHINA': { code: 'CN', region: 'Asia', priority: 3, flag: '🇨🇳' },
  'TAIWAN': { code: 'TW', region: 'Asia', priority: 4, flag: '🇹🇼' },
  'HONG KONG': { code: 'HK', region: 'Asia', priority: 5, flag: '🇭🇰' },
  'SINGAPORE': { code: 'SG', region: 'Asia', priority: 6, flag: '🇸🇬' },
  'THAILAND': { code: 'TH', region: 'Asia', priority: 7, flag: '🇹🇭' },
  'MALAYSIA': { code: 'MY', region: 'Asia', priority: 8, flag: '🇲🇾' },
  'INDONESIA': { code: 'ID', region: 'Asia', priority: 9, flag: '🇮🇩' },
  'VIETNAM': { code: 'VN', region: 'Asia', priority: 10, flag: '🇻🇳' }
};

/**
 * Asian destinations array for filter matching
 * Pre-computed from IMPORTANT_DESTINATIONS for O(1) Set lookup
 */
export const ASIAN_DESTINATIONS = Object.keys(IMPORTANT_DESTINATIONS);

/**
 * Asian destinations Set for O(1) lookup performance
 */
export const ASIAN_DESTINATIONS_SET = new Set(ASIAN_DESTINATIONS);

/**
 * Destination regions for grouping
 */
export const DESTINATION_REGIONS = {
  ASIA: {
    id: 'asia',
    name: '아시아',
    nameEn: 'Asia',
    nameVi: 'Châu Á',
    color: '#3B82F6'
  },
  EUROPE: {
    id: 'europe',
    name: '유럽',
    nameEn: 'Europe',
    nameVi: 'Châu Âu',
    color: '#10B981'
  },
  NORTH_AMERICA: {
    id: 'north_america',
    name: '북미',
    nameEn: 'North America',
    nameVi: 'Bắc Mỹ',
    color: '#F59E0B'
  },
  SOUTH_AMERICA: {
    id: 'south_america',
    name: '남미',
    nameEn: 'South America',
    nameVi: 'Nam Mỹ',
    color: '#EF4444'
  },
  OCEANIA: {
    id: 'oceania',
    name: '오세아니아',
    nameEn: 'Oceania',
    nameVi: 'Châu Đại Dương',
    color: '#8B5CF6'
  },
  AFRICA: {
    id: 'africa',
    name: '아프리카',
    nameEn: 'Africa',
    nameVi: 'Châu Phi',
    color: '#EC4899'
  },
  OTHER: {
    id: 'other',
    name: '기타',
    nameEn: 'Other',
    nameVi: 'Khác',
    color: '#6B7280'
  }
};

/**
 * Check if destination is an important Asian market
 * @param {string} destination - Destination name
 * @returns {boolean} True if important destination
 */
export function isImportantDestination(destination) {
  if (!destination) return false;
  const normalized = destination.toUpperCase().trim();
  return normalized in IMPORTANT_DESTINATIONS;
}

/**
 * Get destination info
 * @param {string} destination - Destination name
 * @returns {Object|null} Destination info
 */
export function getDestinationInfo(destination) {
  if (!destination) return null;
  const normalized = destination.toUpperCase().trim();
  return IMPORTANT_DESTINATIONS[normalized] || null;
}

/**
 * Get destination flag emoji
 * @param {string} destination - Destination name
 * @returns {string} Flag emoji or default
 */
export function getDestinationFlag(destination) {
  const info = getDestinationInfo(destination);
  return info?.flag || '🌍';
}

/**
 * Country to region mapping
 * Comprehensive mapping of country names/codes to regions
 */
const COUNTRY_REGION_MAP = {
  // Europe (EU countries, UK, and other European nations)
  'GERMANY': 'europe',
  'DE': 'europe',
  'FRANCE': 'europe',
  'FR': 'europe',
  'ITALY': 'europe',
  'IT': 'europe',
  'SPAIN': 'europe',
  'ES': 'europe',
  'PORTUGAL': 'europe',
  'PT': 'europe',
  'NETHERLANDS': 'europe',
  'NL': 'europe',
  'BELGIUM': 'europe',
  'BE': 'europe',
  'AUSTRIA': 'europe',
  'AT': 'europe',
  'SWITZERLAND': 'europe',
  'CH': 'europe',
  'SWEDEN': 'europe',
  'SE': 'europe',
  'NORWAY': 'europe',
  'NO': 'europe',
  'DENMARK': 'europe',
  'DK': 'europe',
  'FINLAND': 'europe',
  'FI': 'europe',
  'IRELAND': 'europe',
  'IE': 'europe',
  'UNITED KINGDOM': 'europe',
  'UK': 'europe',
  'GB': 'europe',
  'GREAT BRITAIN': 'europe',
  'ENGLAND': 'europe',
  'SCOTLAND': 'europe',
  'WALES': 'europe',
  'POLAND': 'europe',
  'PL': 'europe',
  'CZECH REPUBLIC': 'europe',
  'CZECHIA': 'europe',
  'CZ': 'europe',
  'HUNGARY': 'europe',
  'HU': 'europe',
  'ROMANIA': 'europe',
  'RO': 'europe',
  'BULGARIA': 'europe',
  'BG': 'europe',
  'GREECE': 'europe',
  'GR': 'europe',
  'CROATIA': 'europe',
  'HR': 'europe',
  'SLOVENIA': 'europe',
  'SI': 'europe',
  'SLOVAKIA': 'europe',
  'SK': 'europe',
  'ESTONIA': 'europe',
  'EE': 'europe',
  'LATVIA': 'europe',
  'LV': 'europe',
  'LITHUANIA': 'europe',
  'LT': 'europe',
  'LUXEMBOURG': 'europe',
  'LU': 'europe',
  'MALTA': 'europe',
  'MT': 'europe',
  'CYPRUS': 'europe',
  'CY': 'europe',
  'ICELAND': 'europe',
  'IS': 'europe',
  'RUSSIA': 'europe',
  'RU': 'europe',
  'UKRAINE': 'europe',
  'UA': 'europe',
  'SERBIA': 'europe',
  'RS': 'europe',
  'TURKEY': 'europe',
  'TR': 'europe',

  // North America
  'UNITED STATES': 'north_america',
  'USA': 'north_america',
  'US': 'north_america',
  'AMERICA': 'north_america',
  'CANADA': 'north_america',
  'CA': 'north_america',
  'MEXICO': 'north_america',
  'MX': 'north_america',
  'PUERTO RICO': 'north_america',
  'PR': 'north_america',
  'GUATEMALA': 'north_america',
  'GT': 'north_america',
  'HONDURAS': 'north_america',
  'HN': 'north_america',
  'EL SALVADOR': 'north_america',
  'SV': 'north_america',
  'NICARAGUA': 'north_america',
  'NI': 'north_america',
  'COSTA RICA': 'north_america',
  'CR': 'north_america',
  'PANAMA': 'north_america',
  'PA': 'north_america',
  'CUBA': 'north_america',
  'CU': 'north_america',
  'JAMAICA': 'north_america',
  'JM': 'north_america',
  'DOMINICAN REPUBLIC': 'north_america',
  'DO': 'north_america',
  'HAITI': 'north_america',
  'HT': 'north_america',
  'BAHAMAS': 'north_america',
  'BS': 'north_america',
  'TRINIDAD AND TOBAGO': 'north_america',
  'TT': 'north_america',

  // South America
  'BRAZIL': 'south_america',
  'BR': 'south_america',
  'ARGENTINA': 'south_america',
  'AR': 'south_america',
  'CHILE': 'south_america',
  'CL': 'south_america',
  'COLOMBIA': 'south_america',
  'CO': 'south_america',
  'PERU': 'south_america',
  'PE': 'south_america',
  'VENEZUELA': 'south_america',
  'VE': 'south_america',
  'ECUADOR': 'south_america',
  'EC': 'south_america',
  'BOLIVIA': 'south_america',
  'BO': 'south_america',
  'PARAGUAY': 'south_america',
  'PY': 'south_america',
  'URUGUAY': 'south_america',
  'UY': 'south_america',
  'GUYANA': 'south_america',
  'GY': 'south_america',
  'SURINAME': 'south_america',
  'SR': 'south_america',

  // Middle East (mapped to 'other' as no specific region defined, or could add MIDDLE_EAST region)
  'UNITED ARAB EMIRATES': 'other',
  'UAE': 'other',
  'AE': 'other',
  'SAUDI ARABIA': 'other',
  'SA': 'other',
  'QATAR': 'other',
  'QA': 'other',
  'KUWAIT': 'other',
  'KW': 'other',
  'BAHRAIN': 'other',
  'BH': 'other',
  'OMAN': 'other',
  'OM': 'other',
  'ISRAEL': 'other',
  'IL': 'other',
  'JORDAN': 'other',
  'JO': 'other',
  'LEBANON': 'other',
  'LB': 'other',
  'IRAQ': 'other',
  'IQ': 'other',
  'IRAN': 'other',
  'IR': 'other',
  'YEMEN': 'other',
  'YE': 'other',
  'SYRIA': 'other',
  'SY': 'other',

  // Africa
  'SOUTH AFRICA': 'africa',
  'ZA': 'africa',
  'NIGERIA': 'africa',
  'NG': 'africa',
  'EGYPT': 'africa',
  'EG': 'africa',
  'MOROCCO': 'africa',
  'MA': 'africa',
  'KENYA': 'africa',
  'KE': 'africa',
  'ETHIOPIA': 'africa',
  'ET': 'africa',
  'GHANA': 'africa',
  'GH': 'africa',
  'TANZANIA': 'africa',
  'TZ': 'africa',
  'ALGERIA': 'africa',
  'DZ': 'africa',
  'TUNISIA': 'africa',
  'TN': 'africa',
  'UGANDA': 'africa',
  'UG': 'africa',
  'ANGOLA': 'africa',
  'AO': 'africa',
  'MOZAMBIQUE': 'africa',
  'MZ': 'africa',
  'SENEGAL': 'africa',
  'SN': 'africa',
  'IVORY COAST': 'africa',
  'COTE D\'IVOIRE': 'africa',
  'CI': 'africa',
  'CAMEROON': 'africa',
  'CM': 'africa',
  'ZIMBABWE': 'africa',
  'ZW': 'africa',
  'BOTSWANA': 'africa',
  'BW': 'africa',
  'NAMIBIA': 'africa',
  'NA': 'africa',
  'MAURITIUS': 'africa',
  'MU': 'africa',
  'RWANDA': 'africa',
  'RW': 'africa',
  'LIBYA': 'africa',
  'LY': 'africa',
  'SUDAN': 'africa',
  'SD': 'africa',

  // Oceania
  'AUSTRALIA': 'oceania',
  'AU': 'oceania',
  'NEW ZEALAND': 'oceania',
  'NZ': 'oceania',
  'FIJI': 'oceania',
  'FJ': 'oceania',
  'PAPUA NEW GUINEA': 'oceania',
  'PG': 'oceania',
  'SAMOA': 'oceania',
  'WS': 'oceania',
  'TONGA': 'oceania',
  'TO': 'oceania',
  'VANUATU': 'oceania',
  'VU': 'oceania',
  'GUAM': 'oceania',
  'GU': 'oceania',
  'NEW CALEDONIA': 'oceania',
  'NC': 'oceania',
  'FRENCH POLYNESIA': 'oceania',
  'PF': 'oceania',

  // Asia (additional countries not in IMPORTANT_DESTINATIONS)
  'PHILIPPINES': 'asia',
  'PH': 'asia',
  'INDIA': 'asia',
  'IN': 'asia',
  'PAKISTAN': 'asia',
  'PK': 'asia',
  'BANGLADESH': 'asia',
  'BD': 'asia',
  'SRI LANKA': 'asia',
  'LK': 'asia',
  'NEPAL': 'asia',
  'NP': 'asia',
  'MYANMAR': 'asia',
  'MM': 'asia',
  'CAMBODIA': 'asia',
  'KH': 'asia',
  'LAOS': 'asia',
  'LA': 'asia',
  'MONGOLIA': 'asia',
  'MN': 'asia',
  'BRUNEI': 'asia',
  'BN': 'asia',
  'MACAO': 'asia',
  'MO': 'asia',
  'MACAU': 'asia',
  'KAZAKHSTAN': 'asia',
  'KZ': 'asia',
  'UZBEKISTAN': 'asia',
  'UZ': 'asia',
  'AFGHANISTAN': 'asia',
  'AF': 'asia'
};

/**
 * Get destination region
 * @param {string} destination - Destination name
 * @returns {string} Region ID
 */
export function getDestinationRegion(destination) {
  if (!destination) return 'other';

  // First check if it's in IMPORTANT_DESTINATIONS (Asian markets)
  const info = getDestinationInfo(destination);
  if (info?.region === 'Asia') return 'asia';

  // Check the comprehensive country-region mapping
  const normalized = destination.toUpperCase().trim();
  const region = COUNTRY_REGION_MAP[normalized];

  return region || 'other';
}

/**
 * Destination options for filter dropdowns
 */
export const DESTINATION_FILTER_OPTIONS = [
  { value: '', label: '전체', labelEn: 'All', labelVi: 'Tất cả' },
  { value: 'asia', label: '아시아 (주요)', labelEn: 'Asia (Major)', labelVi: 'Châu Á (Chính)' },
  ...Object.keys(IMPORTANT_DESTINATIONS).map(dest => ({
    value: dest,
    label: dest,
    flag: IMPORTANT_DESTINATIONS[dest].flag
  }))
];

export default IMPORTANT_DESTINATIONS;
