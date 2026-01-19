import { GrobidAnnotation, AnnotationType, ParsedGrobidData, GrobidCoordinates } from './types';

/**
 * Parse GROBID TEI XML and extract annotations with coordinates
 */
export function parseGrobidCoordinates(teiXml: string): GrobidAnnotation[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(teiXml, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.error('XML parsing error:', parserError.textContent);
    throw new Error('Failed to parse GROBID TEI XML');
  }

  const annotations: GrobidAnnotation[] = [];
  let annotationId = 0;

  // Extract title
  const titleElements = xmlDoc.querySelectorAll('titleStmt title[type="main"]');
  titleElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'title',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  // Extract authors
  const authorElements = xmlDoc.querySelectorAll('sourceDesc biblStruct analytic author');
  authorElements.forEach((element) => {
    const coords = extractCoordinates(element);
    const persName = element.querySelector('persName');
    const authorText = persName ? getPersonName(persName) : element.textContent || '';
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'author',
          coord,
          authorText
        ));
      }
    });
  });

  // Extract abstract
  const abstractElements = xmlDoc.querySelectorAll('profileDesc abstract div[type="abstract"]');
  abstractElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'abstract',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  // Extract sections (headings)
  const sectionElements = xmlDoc.querySelectorAll('body div head');
  sectionElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'section',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  // Extract references
  const referenceElements = xmlDoc.querySelectorAll('back div[type="references"] listBibl biblStruct');
  referenceElements.forEach((element) => {
    const coords = extractCoordinates(element);
    const refText = extractReferenceText(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'reference',
          coord,
          refText
        ));
      }
    });
  });

  // Extract figures
  const figureElements = xmlDoc.querySelectorAll('body figure[type="figure"]');
  figureElements.forEach((element) => {
    const coords = extractCoordinates(element);
    const figHead = element.querySelector('head');
    const figText = figHead ? figHead.textContent || '' : 'Figure';
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'figure',
          coord,
          figText
        ));
      }
    });
  });

  // Extract tables
  const tableElements = xmlDoc.querySelectorAll('body figure[type="table"]');
  tableElements.forEach((element) => {
    const coords = extractCoordinates(element);
    const tableHead = element.querySelector('head');
    const tableText = tableHead ? tableHead.textContent || '' : 'Table';
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'table',
          coord,
          tableText
        ));
      }
    });
  });

  // Extract keywords
  const keywordElements = xmlDoc.querySelectorAll('profileDesc textClass keywords term');
  keywordElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'keyword',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  // Extract affiliations
  const affiliationElements = xmlDoc.querySelectorAll('sourceDesc biblStruct analytic author affiliation');
  affiliationElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'affiliation',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  // Extract formulas
  const formulaElements = xmlDoc.querySelectorAll('body formula');
  formulaElements.forEach((element) => {
    const coords = extractCoordinates(element);
    coords.forEach((coord) => {
      if (coord) {
        annotations.push(createAnnotation(
          `annotation-${annotationId++}`,
          'formula',
          coord,
          element.textContent || ''
        ));
      }
    });
  });

  return annotations;
}

/**
 * Extract coordinates from an element or its children
 */
function extractCoordinates(element: Element): (GrobidCoordinates | null)[] {
  // Look for coords attribute on the element itself
  const coordsAttr = element.getAttribute('coords');
  if (coordsAttr) {
    const tmps = coordsAttr.split(';')
    return tmps.map((tmp) => parseCoordinateString(tmp));
  }

  // Look for coordinates in child elements
  const coordsElement = element.querySelector('[coords]');
  if (coordsElement) {
    const coords = coordsElement.getAttribute('coords');
    if (coords) {
      const tmps = coords.split(';')
      return tmps.map((tmp) => parseCoordinateString(tmp));
    }
  }

  return [];
}

/**
 * Parse coordinate string format: "page,x,y,w,h"
 */
function parseCoordinateString(coordsStr: string): GrobidCoordinates | null {
  const parts = coordsStr.split(',').map(p => parseFloat(p.trim()));

  if (parts.length >= 5 && parts.every(p => !isNaN(p))) {
    return {
      page: Math.floor(parts[0]),
      x: parts[1],
      y: parts[2],
      w: parts[3],
      h: parts[4],
    };
  }

  return null;
}

/**
 * Create an annotation object from coordinates and text
 */
function createAnnotation(
  id: string,
  type: AnnotationType,
  coords: GrobidCoordinates,
  text: string
): GrobidAnnotation {
  return {
    id,
    type,
    page: coords.page,
    bbox: {
      x: coords.x,
      y: coords.y,
      width: coords.w,
      height: coords.h,
    },
    text: text.trim(),
  };
}

/**
 * Extract person name from persName element
 */
function getPersonName(persName: Element): string {
  const forename = persName.querySelector('forename')?.textContent || '';
  const surname = persName.querySelector('surname')?.textContent || '';
  return `${forename} ${surname}`.trim();
}

/**
 * Extract readable text from a reference biblStruct
 */
function extractReferenceText(biblStruct: Element): string {
  const title = biblStruct.querySelector('analytic title[type="main"]')?.textContent || '';
  const authors: string[] = [];

  biblStruct.querySelectorAll('analytic author persName').forEach((persName) => {
    authors.push(getPersonName(persName));
  });

  const authorText = authors.slice(0, 3).join(', ');
  const year = biblStruct.querySelector('monogr imprint date')?.getAttribute('when') || '';

  let refText = authorText;
  if (title) {
    refText += refText ? `. ${title}` : title;
  }
  if (year) {
    refText += ` (${year})`;
  }

  return refText || biblStruct.textContent?.substring(0, 100) || 'Reference';
}

/**
 * Parse complete GROBID data including metadata
 */
export function parseGrobidData(teiXml: string): ParsedGrobidData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(teiXml, 'text/xml');

  const annotations = parseGrobidCoordinates(teiXml);

  // Extract metadata
  const title = xmlDoc.querySelector('titleStmt title[type="main"]')?.textContent || undefined;

  const authors: string[] = [];
  xmlDoc.querySelectorAll('sourceDesc biblStruct analytic author persName').forEach((persName) => {
    authors.push(getPersonName(persName));
  });

  const abstract = xmlDoc.querySelector('profileDesc abstract')?.textContent?.trim() || undefined;

  const keywords: string[] = [];
  xmlDoc.querySelectorAll('profileDesc textClass keywords term').forEach((term) => {
    const keyword = term.textContent?.trim();
    if (keyword) {
      keywords.push(keyword);
    }
  });

  const doi = xmlDoc.querySelector('sourceDesc biblStruct idno[type="DOI"]')?.textContent || undefined;
  const publicationDate = xmlDoc.querySelector('publicationStmt date')?.getAttribute('when') || undefined;

  return {
    annotations,
    metadata: {
      title,
      authors: authors.length > 0 ? authors : undefined,
      abstract,
      keywords: keywords.length > 0 ? keywords : undefined,
      doi,
      publicationDate,
    },
  };
}

/**
 * Filter annotations by type
 */
export function filterAnnotationsByType(
  annotations: GrobidAnnotation[],
  types: AnnotationType[]
): GrobidAnnotation[] {
  const typeSet = new Set(types);
  return annotations.filter(ann => typeSet.has(ann.type));
}

/**
 * Get annotations for a specific page
 */
export function getAnnotationsForPage(
  annotations: GrobidAnnotation[],
  page: number
): GrobidAnnotation[] {
  return annotations.filter(ann => ann.page === page);
}
