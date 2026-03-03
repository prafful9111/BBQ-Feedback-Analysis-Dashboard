/**
 * Utility to derive city and region from outlet names.
 *
 * Outlet names follow patterns like "DEL-ROHINI", "MUM-NERUL", "HYD-BANJARA HILL".
 * The prefix before the first "-" indicates the city code.
 */

const CITY_PREFIX_MAP: Record<string, string> = {
    // North
    DEL: 'Delhi',
    NCR: 'Delhi NCR',
    GGN: 'Gurgaon',
    GUR: 'Gurgaon',
    NDA: 'Noida',
    NOI: 'Noida',
    FBD: 'Faridabad',
    FRD: 'Faridabad',
    CHD: 'Chandigarh',
    LKO: 'Lucknow',
    LCK: 'Lucknow',
    JAI: 'Jaipur',
    JPR: 'Jaipur',
    AGR: 'Agra',
    DHN: 'Dehradun',
    DDN: 'Dehradun',
    AMR: 'Amritsar',
    KNP: 'Kanpur',
    VNS: 'Varanasi',
    BNR: 'Varanasi',
    PAT: 'Patiala',
    LDH: 'Ludhiana',

    // South
    BLR: 'Bangalore',
    BNG: 'Bangalore',
    BAN: 'Bangalore',
    CHE: 'Chennai',
    MAS: 'Chennai',
    HYD: 'Hyderabad',
    HUT: 'Hyderabad',
    HBH: 'Hyderabad',
    HAS: 'Hyderabad',
    KOC: 'Kochi',
    COC: 'Kochi',
    TVM: 'Trivandrum',
    TVN: 'Trivandrum',
    VIJ: 'Vijayawada',
    VJW: 'Vijayawada',
    VSK: 'Visakhapatnam',
    VZG: 'Visakhapatnam',
    MYS: 'Mysore',
    MNG: 'Mangalore',
    CBE: 'Coimbatore',
    TRY: 'Tiruchirappalli',
    PDY: 'Puducherry',
    GBM: 'Bangalore',
    BGM: 'Bangalore',
    THP: 'Thiruvananthapuram',
    MDG: 'Madurai',
    AP: 'Andhra Pradesh',

    // West
    MUM: 'Mumbai',
    BOM: 'Mumbai',
    PUN: 'Pune',
    PNE: 'Pune',
    AHM: 'Ahmedabad',
    AMD: 'Ahmedabad',
    SUR: 'Surat',
    SRT: 'Surat',
    BRD: 'Baroda',
    VAD: 'Vadodara',
    GOA: 'Goa',
    NAG: 'Nagpur',
    NAS: 'Nashik',
    NSK: 'Nashik',
    RAJ: 'Rajkot',
    IND: 'Indore',
    BHP: 'Bhopal',
    BPL: 'Bhopal',
    UDR: 'Udaipur',
    JOD: 'Jodhpur',
    MP: 'Madhya Pradesh',

    // East
    KOL: 'Kolkata',
    CCU: 'Kolkata',
    CAL: 'Kolkata',
    PTN: 'Patna',
    RAN: 'Ranchi',
    BHU: 'Bhubaneswar',
    BBR: 'Bhubaneswar',
    GUW: 'Guwahati',
    GAU: 'Guwahati',
    JAM: 'Jamshedpur',
    JSR: 'Jamshedpur',
    SIL: 'Siliguri',
    WB: 'West Bengal',

    // International
    SHR: 'Sharjah',
    DXB: 'Dubai',
    AUH: 'Abu Dhabi',
    BAH: 'Bahrain',
    MUS: 'Muscat',
    KUL: 'Kuala Lumpur',
    MLY: 'Malaysia',
    MLS: 'Malaysia',
    AL: 'UAE',

    // Full-name prefixes (some outlets use full city name)
    PUNE: 'Pune',
    DELHI: 'Delhi',
    MUMBAI: 'Mumbai',
    CHENNAI: 'Chennai',
    BANGALORE: 'Bangalore',
    HYDERABAD: 'Hyderabad',
    KOLKATA: 'Kolkata',
    PATNA: 'Patna',
    BHOPAL: 'Bhopal',
    LUCKNOW: 'Lucknow',
    JAIPUR: 'Jaipur',
    INDORE: 'Indore',
    NAGPUR: 'Nagpur',
    SURAT: 'Surat',
    NASHIK: 'Nashik',
    NASIK: 'Nashik',
    NOIDA: 'Noida',
    GURGAON: 'Gurgaon',
    CHANDIGARH: 'Chandigarh',
    AHMEDABAD: 'Ahmedabad',
    RANCHI: 'Ranchi',
    MYSORE: 'Mysore',
    KOCHI: 'Kochi',
    COIMBATORE: 'Coimbatore',
    AGRA: 'Agra',
    DEHRADUN: 'Dehradun',
    AMRITSAR: 'Amritsar',
    VARANASI: 'Varanasi',

    // Additional full-name city prefixes from real DB data
    VIZAG: 'Visakhapatnam',
    KAKINADA: 'Kakinada',
    GUNTUR: 'Guntur',
    NELLORE: 'Nellore',
    VELLORE: 'Vellore',
    HUBLI: 'Hubli',
    MANIPAL: 'Manipal',
    ERODE: 'Erode',
    SALEM: 'Salem',
    TRICHY: 'Tiruchirappalli',
    TRISSUR: 'Thrissur',
    PONDICHERRY: 'Puducherry',
    TIRUPUR: 'Tirupur',
    MEERUT: 'Meerut',
    BAREILLY: 'Bareilly',
    GHAZIABAD: 'Ghaziabad',
    FARIDABAD: 'Faridabad',
    MOHALI: 'Mohali',
    PATIALA: 'Patiala',
    JALANDHAR: 'Jalandhar',
    JAMMU: 'Jammu',
    HARYANA: 'Haryana',
    RAIPUR: 'Raipur',
    BILASHPUR: 'Bilaspur',
    PRAYAGRAJ: 'Prayagraj',
    KOTA: 'Kota',
    RAJKOT: 'Rajkot',
    BARODA: 'Baroda',
    AMRAVATI: 'Amravati',
    AURANGABAD: 'Aurangabad',
    BHUBANESWAR: 'Bhubaneswar',
    BHUVANESHWAR: 'Bhubaneswar',
    GUWAHATI: 'Guwahati',
    JAMSHEDPUR: 'Jamshedpur',
    SILIGURI: 'Siliguri',
    MUZAFFARPUR: 'Muzaffarpur',
    HOWRAH: 'Kolkata',
    FIESTA: 'Fiesta',
    DUR: 'Durgapur',
    ABD: 'Abu Dhabi',
    GR: 'Greater Noida',
    UP: 'Uttar Pradesh',
    COLOMBO: 'Colombo',
    RIYADH: 'Riyadh',
    BHARUCH: 'Bharuch',
    ANAND: 'Anand',
};

const CITY_TO_REGION: Record<string, string> = {
    // North
    Delhi: 'North',
    'Delhi NCR': 'North',
    Gurgaon: 'North',
    Noida: 'North',
    'Greater Noida': 'North',
    Faridabad: 'North',
    Ghaziabad: 'North',
    Chandigarh: 'North',
    Mohali: 'North',
    Lucknow: 'North',
    Kanpur: 'North',
    Varanasi: 'North',
    Agra: 'North',
    Meerut: 'North',
    Bareilly: 'North',
    Dehradun: 'North',
    Amritsar: 'North',
    Patiala: 'North',
    Ludhiana: 'North',
    Jalandhar: 'North',
    Jammu: 'North',
    Jaipur: 'North',
    Jodhpur: 'North',
    Udaipur: 'North',
    Kota: 'North',
    Prayagraj: 'North',
    Haryana: 'North',
    'Uttar Pradesh': 'North',

    // South
    Bangalore: 'South',
    Chennai: 'South',
    Hyderabad: 'South',
    Kochi: 'South',
    Trivandrum: 'South',
    Thiruvananthapuram: 'South',
    Vijayawada: 'South',
    Visakhapatnam: 'South',
    Mysore: 'South',
    Mangalore: 'South',
    Coimbatore: 'South',
    Tiruchirappalli: 'South',
    Puducherry: 'South',
    Madurai: 'South',
    'Andhra Pradesh': 'South',
    Kakinada: 'South',
    Guntur: 'South',
    Nellore: 'South',
    Vellore: 'South',
    Hubli: 'South',
    Manipal: 'South',
    Erode: 'South',
    Salem: 'South',
    Thrissur: 'South',
    Tirupur: 'South',

    // West
    Mumbai: 'West',
    Pune: 'West',
    Ahmedabad: 'West',
    Surat: 'West',
    Baroda: 'West',
    Vadodara: 'West',
    Goa: 'West',
    Nagpur: 'West',
    Nashik: 'West',
    Rajkot: 'West',
    Indore: 'West',
    Bhopal: 'West',
    'Madhya Pradesh': 'West',
    Amravati: 'West',
    Aurangabad: 'West',
    Raipur: 'West',
    Bilaspur: 'West',
    Bharuch: 'West',
    Anand: 'West',

    // East
    Kolkata: 'East',
    Patna: 'East',
    Ranchi: 'East',
    Bhubaneswar: 'East',
    Guwahati: 'East',
    Jamshedpur: 'East',
    Siliguri: 'East',
    Muzaffarpur: 'East',
    Durgapur: 'East',
    'West Bengal': 'East',
    Fiesta: 'East',

    // International
    Sharjah: 'International',
    Dubai: 'International',
    'Abu Dhabi': 'International',
    UAE: 'International',
    Bahrain: 'International',
    Muscat: 'International',
    'Kuala Lumpur': 'International',
    Malaysia: 'International',
    Colombo: 'International',
    Riyadh: 'International',
};

/**
 * Extract city name from an outlet name.
 * e.g. "DEL-ROHINI" → "Delhi", "MUM-NERUL" → "Mumbai", "PUNE-K NAGAR" → "Pune"
 */
export function getCityFromOutletName(outletName: string | null | undefined): string {
    if (!outletName) return 'Unknown';

    const prefix = outletName.split('-')[0]?.trim().toUpperCase();
    if (!prefix) return 'Unknown';

    // Try exact prefix match (case-insensitive via uppercase)
    for (const [key, city] of Object.entries(CITY_PREFIX_MAP)) {
        if (key.toUpperCase() === prefix) {
            return city;
        }
    }

    return 'Other';
}

/**
 * Get region from city name.
 * e.g. "Delhi" → "North", "Mumbai" → "West", "Bangalore" → "South"
 */
export function getRegionFromCity(city: string): string {
    return CITY_TO_REGION[city] ?? 'Other';
}

/**
 * Get both city and region from an outlet name in one call.
 */
export function getOutletLocation(outletName: string | null | undefined): {
    city: string;
    region: string;
} {
    const city = getCityFromOutletName(outletName);
    const region = getRegionFromCity(city);
    return { city, region };
}
