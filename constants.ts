import { PlywoodType } from './types';

export const PLYWOOD_TYPE_OPTIONS: PlywoodType[] = Object.values(PlywoodType);

export const REMEMBERED_LABELS_STORAGE_KEY = 'plywoodAppRememberedLabels';
export const SAVED_LAYOUTS_STORAGE_KEY = 'plywoodAppSavedLayouts';
export const DEFAULT_LAYOUT_ID_STORAGE_KEY = 'plywoodAppDefaultLayoutId';


export const PREDEFINED_THICKNESS_VALUES: string[] = [
  "3", "4", "5", "6", "6.5", "8", "9", "10", "12", "15", "18", "21", "24", "27", "30", "40", "50"
];

export interface DimensionOption {
  value: string; // Dimension string, e.g., "1525x1525"
  code?: string; // Optional code associated with the dimension, e.g., "02"
}

// This list is for the dropdown - the "most frequently used ones"
export const FREQUENTLY_USED_DIMENSION_VALUES: DimensionOption[] = [
  { value: "1525x1525", code: "02" },
  { value: "1220x2440", code: "03" },
  { value: "2440x1220", code: "04" },
  { value: "1250x2500", code: "05" },
  { value: "2500x1250", code: "06" },
  { value: "1500x2500", code: "07" },
  { value: "1500x3000", code: "12" },
  { value: "1525x3050", code: "11" },
  { value: "1525x3340", code: "90" },
  { value: "1525x3660", code: "76" },
  { value: "1250x3050", code: "29" },
  { value: "1250x3340", code: "98" },
  { value: "1250x3660", code: "94" },
  { value: "2150x3050", code: "62" },
  { value: "2150x3340", code: "57" },
  { value: "2150x3850", code: "27" },
  { value: "2150x4000", code: "75" }
];

// This is the comprehensive list for backend logic (PDF parsing, code generation)
export const ALL_DIMENSION_VALUES: DimensionOption[] = [
  { value: "1475x1475", code: "01" },
  { value: "1525x1525", code: "02" },
  { value: "1220x2440", code: "03" },
  { value: "2440x1220", code: "04" },
  { value: "1250x2500", code: "05" },
  { value: "2500x1250", code: "06" },
  { value: "1500x2500", code: "07" },
  { value: "2500x1500", code: "08" },
  { value: "1525x2500", code: "09" },
  { value: "2500x1525", code: "10" },
  { value: "1525x3050", code: "11" },
  { value: "1500x3000", code: "12" },
  { value: "1240x1240", code: "13" },
  { value: "1220x3050", code: "14" },
  { value: "1550x3000", code: "15" },
  { value: "1500x2400", code: "16" },
  { value: "1550x2500", code: "17" },
  { value: "1550x3080", code: "18" },
  { value: "1300x3050", code: "19" },
  { value: "2130x1250", code: "20" },
  { value: "1200x2500", code: "21" },
  { value: "1525x2440", code: "22" },
  { value: "1500x2700", code: "23" },
  { value: "1525x2230", code: "24" },
  { value: "1250x2230", code: "25" },
  { value: "2150x1250", code: "26" },
  { value: "2150x3850", code: "27" },
  { value: "1525x3000", code: "28" },
  { value: "1250x3050", code: "29" },
  { value: "1250x3000", code: "30" },
  { value: "1220x3000", code: "31" },
  { value: "1200x3000", code: "32" },
  { value: "1560x3080", code: "33" },
  { value: "1220x3080", code: "34" },
  { value: "1560x2750", code: "35" },
  { value: "2540x1270", code: "36" },
  { value: "1270x2540", code: "37" },
  { value: "1220x2400", code: "38" },
  { value: "1220x2500", code: "39" },
  { value: "1270x2550", code: "40" },
  { value: "1200x2700", code: "41" },
  { value: "1500x1500", code: "42" },
  { value: "1525x1475", code: "43" },
  { value: "1220x2700", code: "44" },
  { value: "1560x2500", code: "45" },
  { value: "2400x1220", code: "46" },
  { value: "1250x2440", code: "47" },
  { value: "1500x2499", code: "48" },
  { value: "2000x1500", code: "49" },
  { value: "1500x2100", code: "50" },
  { value: "1220x2750", code: "51" },
  { value: "1500x2750", code: "52" },
  { value: "1550x1550", code: "53" },
  { value: "2500x1220", code: "54" },
  { value: "1525x2745", code: "55" },
  { value: "1525x2750", code: "56" },
  { value: "2150x3340", code: "57" },
  { value: "1250x3030", code: "58" },
  { value: "1200x2440", code: "59" },
  { value: "1250x2750", code: "60" },
  { value: "1500x2600", code: "61" },
  { value: "2150x3050", code: "62" },
  { value: "1250x2700", code: "63" },
  { value: "1200x2400", code: "64" },
  { value: "1525x2150", code: "65" },
  { value: "1500x3300", code: "66" },
  { value: "1350x2700", code: "67" }, // Also code 123, kept 67 as per original sequence
  { value: "1190x2676", code: "68" },
  { value: "2150x1525", code: "69" },
  { value: "1530x2230", code: "70" },
  { value: "1520x2200", code: "71" },
  { value: "625x2500", code: "72" },
  { value: "2400x1200", code: "73" },
  { value: "1110x2400", code: "74" },
  { value: "2150x4000", code: "75" },
  { value: "1525x3660", code: "76" },
  { value: "2290x4000", code: "77" },
  { value: "1200x3300", code: "78" },
  { value: "675x2500", code: "79" },
  { value: "1525x2700", code: "80" },
  { value: "1500x1220", code: "81" },
  { value: "1500x3600", code: "82" },
  { value: "1250x3300", code: "83" },
  { value: "1700x2500", code: "84" },
  { value: "1900x3850", code: "85" },
  { value: "1220x3660", code: "86" },
  { value: "1250x2800", code: "87" },
  { value: "1500x3660", code: "88" },
  { value: "1200x2750", code: "89" },
  { value: "1525x3340", code: "90" },
  { value: "1900x3340", code: "91" },
  { value: "1900x3050", code: "92" },
  { value: "1900x4000", code: "93" },
  { value: "1250x3660", code: "94" },
  { value: "1860x4000", code: "95" },
  { value: "1850x1525", code: "96" },
  { value: "2000x4000", code: "97" },
  { value: "1250x3340", code: "98" },
  { value: "1250x3600", code: "99" },
  { value: "2150x3660", code: "100" },
  { value: "1280x2550", code: "101" },
  { value: "1830x1525", code: "102" },
  { value: "2000x2500", code: "103" },
  { value: "1850x3660", code: "104" },
  { value: "2000x5400", code: "105" },
  { value: "1850x1220", code: "106" },
  { value: "1500x3050", code: "107" },
  { value: "1900x3000", code: "108" },
  { value: "1850x3050", code: "109" },
  { value: "1850x1250", code: "110" },
  { value: "2350x4150", code: "111" },
  { value: "1825x3340", code: "112" },
  { value: "1830x3660", code: "113" },
  { value: "1500x2570", code: "114" },
  { value: "1540x3065", code: "115" },
  { value: "1670x3305", code: "116" },
  { value: "1250x3075", code: "117" },
  { value: "1245x2465", code: "118" },
  { value: "1240x2450", code: "119" },
  { value: "1850x3340", code: "120" },
  { value: "1205x2500", code: "121" },
  { value: "1220x1830", code: "122" },
  { value: "1350x2700", code: "123" }, // Note: This is a duplicate of code 67. Keeping 123 for now if it was intended.
  { value: "1190x3276", code: "124" },
  { value: "1326x3276", code: "125" },
  { value: "1500x3500", code: "126" },
  { value: "1545x3080", code: "127" },
  { value: "2750x1520", code: "128" },
  { value: "1540x3080", code: "129" },
  { value: "1350x2346", code: "130" },
  { value: "1350x2674", code: "131" },
  { value: "1250x2070", code: "132" },
  { value: "1500x2674", code: "133" },
  { value: "1500x320", code: "134" },
  { value: "2000x3850", code: "135" },
  { value: "1250x2455", code: "136" },
  { value: "2000x3000", code: "137" },
  { value: "1500x2440", code: "138" },
  { value: "1826x3070", code: "139" },
  { value: "1826x3670", code: "140" },
  { value: "2022x3047", code: "141" },
  { value: "2104x3511", code: "142" },
  { value: "1250x1990", code: "143" },
  { value: "1525x3300", code: "144" },
  { value: "1205x3020", code: "145" },
  // { value: "1500x2400", code: "146" }, // Duplicate code 16.
  { value: "1270x1525", code: "147" },
  { value: "1500x3340", code: "148" },
  { value: "1320x3050", code: "149" },
  { value: "1850x3100", code: "150" },
  { value: "1850x2700", code: "151" },
  { value: "1305x2875", code: "152" },
  { value: "1305x2525", code: "153" },
  { value: "2000x1250", code: "154" },
  { value: "1500x3365", code: "155" },
  { value: "1000x3000", code: "156" },
  { value: "1710x3000", code: "157" },
  { value: "1525x2464", code: "158" },
  { value: "2000x4150", code: "159" },
  { value: "1900x4150", code: "160" },
  { value: "1800x3050", code: "161" },
  { value: "1290x2500", code: "162" },
  { value: "1830x3340", code: "163" }
];


export interface DQOption {
  display: string; // Text to show in dropdown, e.g., "B/BB"
  value: string;   // Actual value for DQ, e.g., "02"
}

// This list is for the dropdown - the "most frequently used ones"
export const FREQUENTLY_USED_DQ_VALUES: DQOption[] = [
  { display: "B/BB", value: "02" }, // From ALL_DQ_VALUES
  { display: "BB/BB", value: "04" }, // From original PREDEFINED_DQ_VALUES, but matches "BB" in ALL_DQ_VALUES
  { display: "BB/CP", value: "05" }, // From ALL_DQ_VALUES
  { display: "CP/C", value: "18" },  // From ALL_DQ_VALUES (was CP/CP:07 in old PREDEFINED)
  { display: "F/W", value: "14" }, // From ALL_DQ_VALUES (was F/W:14)
  { display: "F/F", value: "12" }, // From ALL_DQ_VALUES (was F/F:12)
  { display: "BB/WG", value: "06" }, // From ALL_DQ_VALUES
  { display: "CP", value: "07" }, // From ALL_DQ_VALUES (was CP/CP:07)
  { display: "WG", value: "09" }, // From ALL_DQ_VALUES (was WG/WG:09)
  { display: "F/W II", value: "15" }, // From ALL_DQ_VALUES (was F2/W2:15)
  { display: "F/F II", value: "13" }, // From ALL_DQ_VALUES (was F2/F2:13)
  { display: "C", value: "10" },    // From ALL_DQ_VALUES (was C/C:10)
  { display: "KILO", value: "11" }, // From ALL_DQ_VALUES (was KILO:KILO)
];

// This is the comprehensive list for backend logic (PDF parsing, code mapping)
export const ALL_DQ_VALUES: DQOption[] = [
  { display: "B", value: "01" },
  { display: "B/BB", value: "02" },
  { display: "S/BB", value: "03" },
  { display: "BB", value: "04" }, // Corresponds to BB/BB in old frequently used
  { display: "BB/CP", value: "05" },
  { display: "BB/WG", value: "06" },
  { display: "CP", value: "07" }, // Corresponds to CP/CP in old frequently used
  { display: "WGE", value: "08" },
  { display: "WG", value: "09" }, // Corresponds to WG/WG in old frequently used
  { display: "C", value: "10" }, // Corresponds to C/C in old frequently used
  { display: "KILO", value: "11" }, // Corresponds to KILO:KILO in old frequently used
  { display: "F/F I", value: "12" }, // Corresponds to F/F in old frequently used
  { display: "F/F II", value: "13" }, // Corresponds to F2/F2 in old frequently used
  { display: "F/W I", value: "14" }, // Corresponds to F/W in old frequently used
  { display: "F/W II", value: "15" }, // Corresponds to F2/W2 in old frequently used
  { display: "W/W I", value: "16" },
  { display: "W/W II", value: "17" },
  { display: "CP/C", value: "18" }, // Corresponds to C/CP in old frequently used (value matches, display different)
  { display: "M/WG", value: "19" },
  { display: "F/BB", value: "20" },
  { display: "F/WG", value: "21" },
  { display: "BB/C", value: "22" },
  { display: "W/BB", value: "23" },
  { display: "W/WG", value: "24" },
  { display: "B/WG", value: "25" },
  { display: "F/WH", value: "26" },
  { display: "W/CP", value: "27" },
  { display: "S/WG", value: "28" },
  { display: "S/CP", value: "29" },
  { display: "V/V", value: "30" }
];


export interface PrintFormat {
  name: string;
  printWidth: string;   // e.g., "210mm"
  printHeight: string;  // e.g., "148mm"
  screenWidth: string;  // e.g., "497px"
  screenHeight: string; // e.g., "350px"
  description?: string; // Optional description for UI
}

export const PRINT_FORMATS: PrintFormat[] = [
  {
    name: "A5 Landscape",
    printWidth: "210mm",
    printHeight: "148mm",
    screenWidth: "700px", 
    screenHeight: "495px", 
    description: "Standard A5 Landscape (210mm x 148mm)"
  },
  {
    name: "A5 Portrait",
    printWidth: "148mm",
    printHeight: "210mm",
    screenWidth: "495px",
    screenHeight: "700px",
    description: "Standard A5 Portrait (148mm x 210mm)"
  },
  {
    name: "Small Label (10x7cm)",
    printWidth: "100mm",
    printHeight: "70mm",
    screenWidth: "450px",
    screenHeight: "315px",
    description: "Small Label (100mm x 70mm)"
  },
];


// -- START: Added for Editable Layout --
export interface ElementStyle {
  x: number; // percentage from left
  y: number; // percentage from top
  fontSize: number; // in points (pt)
}

export interface LabelLayout {
  [key: string]: ElementStyle; // To allow indexing by string
  thickness: ElementStyle;
  dimension: ElementStyle;
  dq: ElementStyle;
  plywoodCode: ElementStyle;
  quantityLabel: ElementStyle;
  quantity: ElementStyle;
  typeLabel: ElementStyle;
  type: ElementStyle;
  footer: ElementStyle;
}

export const INITIAL_LABEL_LAYOUT: LabelLayout = {
  thickness:   { x: 50, y: 35, fontSize: 42 },
  dimension:   { x: 50, y: 50, fontSize: 72 },
  dq:          { x: 50, y: 65, fontSize: 42 },
  plywoodCode: { x: 50, y: 75, fontSize: 11 },
  quantityLabel: { x: 15, y: 84, fontSize: 11 },
  quantity:    { x: 15, y: 91, fontSize: 32 },
  typeLabel:   { x: 85, y: 84, fontSize: 11 },
  type:        { x: 85, y: 91, fontSize: 32 },
  footer:      { x: 50, y: 98, fontSize: 7 },
};

export interface SavedLabelLayout {
  id: string;
  name: string;
  layout: LabelLayout;
}
// -- END: Added for Editable Layout --