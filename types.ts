
export enum PlywoodType {
  EXT = "EXT",
  MR = "MR"
}

export interface LabelData {
  thickness: string;
  dimension: string;
  dq: string; 
  plywoodCode: string;
  type: PlywoodType;
  quantity: string;
  date: string;
}

export interface LabelFormState {
  thickness: string;
  dimension: string;
  dq: string; 
  plywoodCode: string;
  type: PlywoodType | ''; // Changed to allow empty string
  quantity: string;
}