export interface AnnotationBatch {
  id: string;
  name: string;
  description: string;
  data_type: string;
  status: string;
  created_at: string;
  total_items?: number;
  completed_items?: number;
}

export interface AnnotationItem {
  id: string;
  status: string;
  raw_data: any;
  refined_data?: any;
}