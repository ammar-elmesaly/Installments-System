const firstNames = [
  'محمد',
  'أحمد',
  'محمود',
  'عمر',
  'يوسف',
  'عبدالله',
  'خالد',
  'سامي',
  'ياسر',
  'إبراهيم',
  'مروة',
  'مريم',
  'مازن'
];

const secondNames = [
  'علي',
  'حسن',
  'حسين',
  'سعيد',
  'طارق',
  'وليد',
  'فؤاد',
  'ماهر',
  'رامي',
  'أنس',
];

const thirdNames = [
  'عبدالرحمن',
  'مصطفى',
  'إسماعيل',
  'سليمان',
  'كريم',
  'منصور',
  'جمال',
  'نادر',
  'هاني',
  'مراد',
];

const lastNames = [
  'الشرقاوي',
  'الحسن',
  'الخطيب',
  'النجار',
  'الحداد',
  'الشهاوي',
  'الحموي',
  'الشافعي',
  'السادات',
  'المنصور',
];

export interface GeneratedClient {
  email: string;
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  phone_number: string;
}

function toArabicDigits(value: number): string {
  return value.toString().replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
}

export function createArabicClient(index: number): GeneratedClient {
  const firstName = firstNames[index % firstNames.length];
  const secondName = secondNames[(index * 3) % secondNames.length];
  const thirdName = thirdNames[(index * 7) % thirdNames.length];
  const lastName = lastNames[(index * 11) % lastNames.length];
  const uniqueSuffix = toArabicDigits(index).padStart(5, '٠');
  const numericIndex = index.toString().padStart(8, '0');

  return {
    email: `client-${numericIndex}@example.com`,
    first_name: firstName,
    second_name: secondName,
    third_name: thirdName,
    last_name: `${lastName} ${uniqueSuffix}`,
    phone_number: `059${numericIndex}`,
  };
}
