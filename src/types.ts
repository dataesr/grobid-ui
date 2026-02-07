/**
 * Type definitions for TEI XML to Markdown Converter
 */

export interface Author {
  forename: string;
  surname: string;
  affiliation?: string;
}

export interface PublicationMetadata {
  title: string;
  authors: Author[];
  abstract?: string;
  date?: string;
  doi?: string;
  keywords?: string[];
}

export interface BiblioReference {
  id?: string;
  authors: string[];
  title: string;
  journal?: string;
  bookTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year?: string;
  doi?: string;
  url?: string;
}

export interface Figure {
  type: 'image' | 'table';
  caption?: string;
  description?: string;
  tableData?: string[][];
}

export interface Section {
  level: number;
  heading: string;
  content: string[];
  subsections: Section[];
}

export interface TEIDocument {
  metadata: PublicationMetadata;
  body: Section[];
  references: BiblioReference[];
  acknowledgments?: string;
}

export interface ConversionOptions {
  includeMetadata?: boolean;
  includeReferences?: boolean;
  includeAcknowledgments?: boolean;
  headingLevelOffset?: number;
}

export interface ConversionResult {
  success: boolean;
  markdown?: string;
  error?: string;
  document?: TEIDocument;
}
