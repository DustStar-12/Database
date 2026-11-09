export type FieldDef = {
  key: string; label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'model' | 'year' | 'address';
  options?: string[]; placeholder?: string;
  pattern?: RegExp; hint?: string; upper?: boolean;
};

export const NATIONALITIES = ['Afghan','Albanian','Algerian','American','Argentine','Armenian','Australian','Austrian','Azerbaijani','Bahraini','Bangladeshi','Belgian','Brazilian','British','Bulgarian','Canadian','Chilean','Chinese','Colombian','Croatian','Cypriot','Czech','Danish','Dutch','Egyptian','Emirati','Ethiopian','Filipino','Finnish','French','Georgian','German','Ghanaian','Greek','Hungarian','Indian','Indonesian','Iranian','Iraqi','Irish','Israeli','Italian','Japanese','Jordanian','Kazakh','Kenyan','Korean','Kuwaiti','Lebanese','Libyan','Malaysian','Mexican','Moroccan','Nigerian','Norwegian','Omani','Pakistani','Palestinian','Peruvian','Polish','Portuguese','Qatari','Romanian','Russian','Saudi','Serbian','Singaporean','South African','Spanish','Sri Lankan','Sudanese','Swedish','Swiss','Syrian','Thai','Tunisian','Turkish','Ukrainian','Venezuelan','Vietnamese','Yemeni','Other'];
export const EYE_COLORS = ['Brown','Dark Brown','Hazel','Amber','Green','Blue','Gray','Heterochromia','Other'];
export const HAIR_COLORS = ['Black','Dark Brown','Brown','Light Brown','Blonde','Red','Auburn','Gray','White','Bald','Dyed / Other'];
export const VEHICLE_COLORS = ['Black','White','Silver','Gray','Red','Blue','Green','Yellow','Orange','Brown','Beige','Gold','Other'];
export const VEHICLES: Record<string, string[]> = {
  Audi: ['A3','A4','A6','A8','Q3','Q5','Q7','Q8','e-tron'],
  BMW: ['1 Series','3 Series','5 Series','7 Series','X1','X3','X5','X6','X7','i4','iX'],
  Chevrolet: ['Camaro','Corvette','Cruze','Malibu','Silverado','Spark','Tahoe','Traverse'],
  Ford: ['Bronco','Escape','Explorer','F-150','Fiesta','Focus','Mustang','Ranger'],
  Honda: ['Accord','City','Civic','CR-V','HR-V','Odyssey','Pilot'],
  Hyundai: ['Accent','Elantra','Kona','Santa Fe','Sonata','Tucson'],
  Jeep: ['Cherokee','Compass','Grand Cherokee','Renegade','Wrangler'],
  Kia: ['Cerato','Picanto','Rio','Seltos','Sorento','Sportage'],
  Lexus: ['ES','GX','IS','LX','NX','RX'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','G-Class','GLC','GLE','GLS'],
  Mitsubishi: ['ASX','Lancer','Outlander','Pajero'],
  Nissan: ['Altima','Patrol','Qashqai','Sentra','Sunny','X-Trail'],
  Peugeot: ['208','308','2008','3008','5008'],
  Porsche: ['911','Cayenne','Macan','Panamera','Taycan'],
  'Land Rover': ['Defender','Discovery','Range Rover','Range Rover Sport','Range Rover Evoque'],
  Renault: ['Clio','Duster','Koleos','Megane'],
  Tesla: ['Model 3','Model S','Model X','Model Y','Cybertruck'],
  Toyota: ['Camry','Corolla','Hilux','Land Cruiser','Prado','RAV4','Yaris'],
  Volkswagen: ['Golf','Jetta','Passat','Polo','Tiguan','Touareg'],
  Other: ['Other'],
};
const thisYear = new Date().getFullYear();
export const YEARS = Array.from({ length: thisYear + 2 - 1970 }, (_, i) => String(thisYear + 1 - i));

const handle = /^@?[A-Za-z0-9._]{1,30}$/;

export const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  { title: 'Personal Identity', fields: [
    { key: 'fullName', label: 'Full Name' },
    { key: 'motherSName', label: "Mother's Name" },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'nationality', label: 'Nationality', type: 'select', options: NATIONALITIES },
  ]},
  { title: 'Biometrics & Physical', fields: [
    { key: 'heightCm', label: 'Height (cm)', type: 'number' },
    { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
    { key: 'eyeColor', label: 'Eye Color', type: 'select', options: EYE_COLORS },
    { key: 'hairColor', label: 'Hair Color', type: 'select', options: HAIR_COLORS },
    { key: 'distinguishingMarks', label: 'Distinguishing Marks', type: 'textarea' },
  ]},
  { title: 'Contact Information', fields: [
    { key: 'phoneNumber', label: 'Phone Number', placeholder: '+961 3 123 456', pattern: /^\+?[0-9\s\-()]{7,20}$/, hint: 'Digits, spaces, + - ( ) only' },
    { key: 'emailAddress', label: 'Email Address', placeholder: 'name@example.com', pattern: /^\S+@\S+\.\S+$/, hint: 'Invalid email' },
  ]},
  { title: 'Location & Address', fields: [
    { key: 'address', label: 'Address', type: 'address' },
  ]},
  { title: 'Digital Footprint', fields: [
    { key: 'facebookProfileUrl', label: 'Facebook Profile URL', placeholder: 'https://facebook.com/username', pattern: /^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\/.+/i, hint: 'Must be a facebook.com link' },
    { key: 'fbid', label: 'FBID', placeholder: '100012345678901', pattern: /^[0-9]{5,20}$/, hint: 'Digits only (5–20)' },
    { key: 'instagramHandle', label: 'Instagram Handle', placeholder: '@username', pattern: handle, hint: 'Letters, numbers, . and _ only (max 30)' },
    { key: 'xHandle', label: 'X (Twitter) Handle', placeholder: '@username', pattern: /^@?[A-Za-z0-9_]{1,15}$/, hint: 'Letters, numbers and _ only (max 15)' },
    { key: 'linkedInProfileUrl', label: 'LinkedIn Profile URL', placeholder: 'https://linkedin.com/in/username', pattern: /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i, hint: 'Must be a linkedin.com link' },
    { key: 'tikTokUsername', label: 'TikTok Username', placeholder: '@username', pattern: /^@?[A-Za-z0-9._]{2,24}$/, hint: 'Letters, numbers, . and _ only (max 24)' },
    { key: 'youTubeChannel', label: 'YouTube Channel', placeholder: '@channel or youtube.com link', pattern: /^(@[A-Za-z0-9._-]{3,30}|https?:\/\/(www\.)?youtube\.com\/.+)$/i, hint: 'Use @handle or a youtube.com link' },
  ]},
  { title: 'Vehicle Registered', fields: [
    { key: 'vehicleMake', label: 'Vehicle Make', type: 'select', options: Object.keys(VEHICLES) },
    { key: 'vehicleModel', label: 'Vehicle Model', type: 'model' },
    { key: 'modelYear', label: 'Model Year', type: 'year' },
    { key: 'vehicleColor', label: 'Color', type: 'select', options: VEHICLE_COLORS },
    { key: 'licensePlateNumber', label: 'License Plate Number', placeholder: 'AB-123456', upper: true, pattern: /^[A-Z0-9]{1,4}([\s-]?[A-Z0-9]{1,6}){0,2}$/, hint: '2–12 letters/numbers, optional space or dash' },
    { key: 'registeredOwnerName', label: 'Registered Owner Name' },
  ]},
];

export function calcAge(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob), now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 ? a : null;
}

export function profileCode(id: string) {
  return 'CP-' + id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase();
}
