export type AnnotationType = 
  | 'title' 
  | 'author' 
  | 'abstract' 
  | 'section' 
  | 'reference' 
  | 'figure' 
  | 'table' 
  | 'keyword'
  | 'affiliation'
  | 'formula'
  | 'paragraph'
  | 'unknown';

export interface BoundingBox {
  x: number;      // x coordinate (in PDF points)
  y: number;      // y coordinate (in PDF points)
  width: number;  // width (in PDF points)
  height: number; // height (in PDF points)
}

export interface GrobidAnnotation {
  id: string;
  type: AnnotationType;
  page: number;
  bbox: BoundingBox;
  text: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface GrobidCoordinates {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnnotationStyle {
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  opacity: number;
}

export const ANNOTATION_STYLES: Record<AnnotationType, AnnotationStyle> = {
  title: {
    borderColor: '#e53935',
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  author: {
    borderColor: '#43a047',
    backgroundColor: 'rgba(67, 160, 71, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  abstract: {
    borderColor: '#1e88e5',
    backgroundColor: 'rgba(30, 136, 229, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  section: {
    borderColor: '#fb8c00',
    backgroundColor: 'rgba(251, 140, 0, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  reference: {
    borderColor: '#8e24aa',
    backgroundColor: 'rgba(142, 36, 170, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  figure: {
    borderColor: '#00acc1',
    backgroundColor: 'rgba(0, 172, 193, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  table: {
    borderColor: '#f4511e',
    backgroundColor: 'rgba(244, 81, 30, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  keyword: {
    borderColor: '#7cb342',
    backgroundColor: 'rgba(124, 179, 66, 0.15)',
    borderWidth: 1,
    opacity: 0.7,
  },
  affiliation: {
    borderColor: '#5e35b1',
    backgroundColor: 'rgba(94, 53, 177, 0.15)',
    borderWidth: 1,
    opacity: 0.7,
  },
  formula: {
    borderColor: '#6d4c41',
    backgroundColor: 'rgba(109, 76, 65, 0.15)',
    borderWidth: 2,
    opacity: 0.8,
  },
  paragraph: {
    borderColor: '#757575',
    backgroundColor: 'rgba(117, 117, 117, 0.1)',
    borderWidth: 1,
    opacity: 0.6,
  },
  unknown: {
    borderColor: '#9e9e9e',
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    borderWidth: 1,
    opacity: 0.5,
  },
};

export interface ParsedGrobidData {
  annotations: GrobidAnnotation[];
  metadata: {
    title?: string;
    authors?: string[];
    abstract?: string;
    keywords?: string[];
    doi?: string;
    publicationDate?: string;
  };
}
