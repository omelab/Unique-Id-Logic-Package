export interface IdLogicInterface {
  slug: string;
  multiple?: number; // For generating multiple IDs
  date?: string; // Optional custom date
  data?: Record<string, any>; // Custom data for format replacement
}
