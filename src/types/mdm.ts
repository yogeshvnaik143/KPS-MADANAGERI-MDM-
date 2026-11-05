export type ClassId = 
  | 'LKG'
  | 'UKG'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10';

export type SectionKey = 'LKG_UKG' | 'PRIMARY_1_5' | 'HIGHER_6_8' | 'HIGH_9_10';

export interface SectionDefinition {
  key: SectionKey;
  label: string;
  subLabel: string;
  registerLabel: string;
  kannadaLabel: string;
  classes: ClassId[];
}

export const SECTIONS: SectionDefinition[] = [
  {
    key: 'LKG_UKG',
    label: '1st Section: LKG & UKG',
    subLabel: 'Pre-Primary',
    registerLabel: 'pre-school',
    kannadaLabel: 'ಪೂರ್ವ ಪ್ರಾಥಮಿಕ (pre-school)',
    classes: ['LKG', 'UKG'],
  },
  {
    key: 'PRIMARY_1_5',
    label: '2nd Section: Class 1 to 5',
    subLabel: 'Lower Primary (LP)',
    registerLabel: '1 to 5',
    kannadaLabel: 'ಕಿರಿಯ ಪ್ರಾಥಮಿಕ (1 to 5)',
    classes: ['1', '2', '3', '4', '5'],
  },
  {
    key: 'HIGHER_6_8',
    label: '3rd Section: Class 6 to 8',
    subLabel: 'Higher Primary (HP)',
    registerLabel: '6 to 8',
    kannadaLabel: 'ಹಿರಿಯ ಪ್ರಾಥಮಿಕ (6 to 8)',
    classes: ['6', '7', '8'],
  },
  {
    key: 'HIGH_9_10',
    label: '4th Section: Class 9 to 10',
    subLabel: 'High School (HS)',
    registerLabel: '9th',
    kannadaLabel: 'ಪ್ರೌಢಶಾಲೆ (9 to 10)',
    classes: ['9', '10'],
  },
];

export const ALL_CLASSES: ClassId[] = [
  'LKG',
  'UKG',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
];

export type SchemeType = 'SNF' | 'APF' | 'GOVT' | 'OTHER';

export interface SchemeInfo {
  id: SchemeType;
  name: string;
  fullName: string;
  sponsor: string;
  description: string;
  badgeColor: string;
}

export const SCHEMES: SchemeInfo[] = [
  {
    id: 'SNF',
    name: 'SNF Scheme',
    fullName: 'Sri Sathya Sai Annapoorna Foundation (SNF)',
    sponsor: 'SNF Nutrition Trust',
    description: 'Provides eggs and bananas supplementary nutrition to students.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'APF',
    name: 'APF Scheme',
    fullName: 'Azim Premji Foundation (APF)',
    sponsor: 'Azim Premji Philanthropic Initiatives',
    description: 'Weekly supplementary nutrition partnership providing eggs and bananas.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'GOVT',
    name: 'Govt PM POSHAN',
    fullName: 'State Government / PM POSHAN Akshara Dasoha',
    sponsor: 'Department of School Education & Literacy, Govt of Karnataka',
    description: 'Regular government mid day meal supplementary nutrition quota.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'OTHER',
    name: 'Special Donor / SDMC',
    fullName: 'School Development & Monitoring Committee / Local Donor',
    sponsor: 'Local Donor / SDMC Madanageri',
    description: 'Special festival or birthday sponsorship for egg and banana.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
];

// Fixed Master Admission data per class
export interface ClassAdmission {
  classId: ClassId;
  boys: number;
  girls: number;
  total: number;
}

export interface MasterAdmission {
  schoolName: string;
  diseCode: string;
  academicYear: string;
  lastUpdated: string;
  admissions: Record<ClassId, ClassAdmission>;
}

// Daily Attendance & Nutrition consumption per class
export interface ClassDailyRecord {
  classId: ClassId;
  boys: number;
  girls: number;
  total: number;
  egg: number;
  banana: number;
}

export interface DailyMDMRecord {
  id: string; // e.g. "2026-11-05"
  date: string; // YYYY-MM-DD
  scheme: SchemeType;
  schemeHeir: string; // Specific provider/donor name if custom
  menuDetails: string;
  classes: Record<ClassId, ClassDailyRecord>;
  notes?: string;
  verifiedBy?: string;
  updatedAt: string;
}

export interface SectionSummary {
  sectionKey: SectionKey;
  label: string;
  subLabel: string;
  enrolledBoys: number;
  enrolledGirls: number;
  enrolledTotal: number;
  attendedBoys: number;
  attendedGirls: number;
  attendedTotal: number;
  eggCount: number;
  bananaCount: number;
  nutritionTotal: number;
  isBalanced: boolean;
  attendancePercentage: number;
}

export interface OverallSummary {
  enrolledBoys: number;
  enrolledGirls: number;
  enrolledTotal: number;
  attendedBoys: number;
  attendedGirls: number;
  attendedTotal: number;
  eggTotal: number;
  bananaTotal: number;
  nutritionTotal: number;
  isBalanced: boolean;
  discrepancy: number; // attendedTotal - nutritionTotal
  attendancePercentage: number;
}
