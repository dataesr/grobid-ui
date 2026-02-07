/**
 * TEI XML to Markdown Converter Utility
 * Standalone class for programmatic conversion without React
 */

import { BiblioReference, ConversionResult, ConversionOptions } from './types';

export class TEIConverter {
  private readonly TEI_NS = 'http://www.tei-c.org/ns/1.0';

  /**
   * Convert TEI XML string to Markdown
   */
  public convert(xmlString: string, options: ConversionOptions = {}): ConversionResult {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        return {
          success: false,
          error: 'Invalid XML: ' + parserError.textContent
        };
      }

      const markdown: string[] = [];

      // Parse different sections based on options
      if (options.includeMetadata !== false) {
        markdown.push(...this.parseHeader(xmlDoc));
      }

      markdown.push(...this.parseBody(xmlDoc));

      if (options.includeReferences !== false) {
        markdown.push(...this.parseBack(xmlDoc));
      }

      return {
        success: true,
        markdown: markdown.join('\n')
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert TEI XML file to Markdown
   */
  public async convertFile(file: File, options?: ConversionOptions): Promise<ConversionResult> {
    try {
      const text = await file.text();
      return this.convert(text, options);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to read file'
      };
    }
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string | null): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get text content from an element
   */
  private getTextContent(element: Element | null): string {
    if (!element) return '';

    const textParts: string[] = [];

    const extractText = (elem: Element) => {
      for (let i = 0; i < elem.childNodes.length; i++) {
        const node = elem.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent) {
            textParts.push(node.textContent);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const childElem = node as Element;
          const tagName = childElem.tagName.toLowerCase();

          if (tagName === 'lb') {
            textParts.push(' ');
          } else if (tagName === 'ref') {
            const refType = childElem.getAttribute('type');
            if (refType === 'bibr' && childElem.textContent) {
              textParts.push(`[${childElem.textContent}]`);
            } else if (childElem.textContent) {
              textParts.push(childElem.textContent);
            }
            extractText(childElem);
          } else if (tagName === 'formula') {
            const formulaText = childElem.textContent || '';
            textParts.push(`$${formulaText}$`);
          } else {
            extractText(childElem);
          }
        }
      }
    };

    extractText(element);
    return this.cleanText(textParts.join(''));
  }

  /**
   * Parse TEI header
   */
  private parseHeader(root: Document): string[] {
    const markdown: string[] = [];
    const header = root.querySelector('teiHeader');
    if (!header) return markdown;

    // Title
    const title = header.querySelector('titleStmt title[type="main"]');
    if (title?.textContent) {
      markdown.push(`# ${this.cleanText(title.textContent)}`);
      markdown.push('');
    }

    // Authors
    const authors = Array.from(header.querySelectorAll('sourceDesc author'));
    if (authors.length > 0) {
      const authorNames: string[] = [];
      
      authors.forEach(author => {
        const nameParts: string[] = [];
        const forenames = Array.from(author.querySelectorAll('forename'));
        forenames.forEach(fn => {
          if (fn.textContent) nameParts.push(fn.textContent.trim());
        });
        
        const surname = author.querySelector('surname');
        if (surname?.textContent) {
          nameParts.push(surname.textContent.trim());
        }
        
        if (nameParts.length > 0) {
          authorNames.push(nameParts.join(' '));
        }
      });
      
      if (authorNames.length > 0) {
        markdown.push(`**Authors:** ${authorNames.join(', ')}`);
        markdown.push('');
      }
    }

    // Abstract
    const abstract = header.querySelector('abstract');
    if (abstract) {
      markdown.push('## Abstract');
      markdown.push('');
      const abstractText = this.getTextContent(abstract);
      if (abstractText) {
        markdown.push(abstractText);
        markdown.push('');
      }
    }

    // Publication info
    const pubStmt = header.querySelector('publicationStmt');
    if (pubStmt) {
      const date = pubStmt.querySelector('date');
      const dateWhen = date?.getAttribute('when');
      if (dateWhen) {
        markdown.push(`**Date:** ${dateWhen}`);
      }
      
      const doi = pubStmt.querySelector('idno[type="DOI"]');
      if (doi?.textContent) {
        markdown.push(`**DOI:** ${doi.textContent}`);
      }
      
      if (dateWhen || doi) {
        markdown.push('');
      }
    }

    return markdown;
  }

  /**
   * Parse body
   */
  private parseBody(root: Document): string[] {
    const markdown: string[] = [];
    const body = root.querySelector('text body');
    if (!body) return markdown;

    const divs = Array.from(body.querySelectorAll(':scope > div'));
    divs.forEach(div => {
      markdown.push(...this.parseDiv(div as Element));
    });

    return markdown;
  }

  /**
   * Parse a div element
   */
  private parseDiv(div: Element, level: number = 2): string[] {
    const markdown: string[] = [];

    const head = div.querySelector(':scope > head');
    if (head) {
      const headText = this.getTextContent(head);
      if (headText) {
        markdown.push(`${'#'.repeat(level)} ${headText}`);
        markdown.push('');
      }
    }

    const paragraphs = Array.from(div.querySelectorAll(':scope > p'));
    paragraphs.forEach(p => {
      const paraText = this.getTextContent(p);
      if (paraText) {
        markdown.push(paraText);
        markdown.push('');
      }
    });

    const figures = Array.from(div.querySelectorAll(':scope > figure'));
    figures.forEach(figure => {
      markdown.push(...this.parseFigure(figure));
    });

    const lists = Array.from(div.querySelectorAll(':scope > list'));
    lists.forEach(list => {
      markdown.push(...this.parseList(list));
    });

    const nestedDivs = Array.from(div.querySelectorAll(':scope > div'));
    nestedDivs.forEach(nestedDiv => {
      markdown.push(...this.parseDiv(nestedDiv, level + 1));
    });

    return markdown;
  }

  /**
   * Parse figure
   */
  private parseFigure(figure: Element): string[] {
    const markdown: string[] = [];
    const figType = figure.getAttribute('type') || '';
    const head = figure.querySelector('head');
    const figDesc = figure.querySelector('figDesc');

    if (figType === 'table') {
      if (head) {
        markdown.push(`**${this.getTextContent(head)}**`);
        markdown.push('');
      }

      const table = figure.querySelector('table');
      if (table) {
        markdown.push(this.parseTable(table));
        markdown.push('');
      }
    } else {
      let caption = '';
      if (head) {
        caption = this.getTextContent(head);
      } else if (figDesc) {
        caption = this.getTextContent(figDesc);
      }

      if (caption) {
        markdown.push(`![${caption}]()`);
        markdown.push('');
      }
    }

    return markdown;
  }

  /**
   * Parse table
   */
  private parseTable(table: Element): string {
    const rows = Array.from(table.querySelectorAll('row'));
    if (rows.length === 0) return '';

    const mdTable: string[] = [];

    rows.forEach((row, i) => {
      const cells = Array.from(row.querySelectorAll('cell'));
      const cellTexts = cells.map(cell => 
        this.getTextContent(cell).replace(/\|/g, '\\|')
      );
      mdTable.push('| ' + cellTexts.join(' | ') + ' |');

      if (i === 0) {
        mdTable.push('| ' + cells.map(() => '---').join(' | ') + ' |');
      }
    });

    return mdTable.join('\n');
  }

  /**
   * Parse list
   */
  private parseList(list: Element): string[] {
    const markdown: string[] = [];
    const items = Array.from(list.querySelectorAll('item'));
    
    items.forEach(item => {
      const itemText = this.getTextContent(item);
      if (itemText) {
        markdown.push(`- ${itemText}`);
      }
    });

    if (items.length > 0) {
      markdown.push('');
    }

    return markdown;
  }

  /**
   * Parse back matter
   */
  private parseBack(root: Document): string[] {
    const markdown: string[] = [];
    const back = root.querySelector('text back');
    if (!back) return markdown;

    const bibDiv = back.querySelector('div[type="references"]');
    if (bibDiv) {
      markdown.push('## References');
      markdown.push('');

      const biblList = bibDiv.querySelector('listBibl');
      if (biblList) {
        const bibls = Array.from(biblList.querySelectorAll('biblStruct'));
        bibls.forEach((bibl, i) => {
          const refText = this.parseBiblio(bibl);
          if (refText) {
            markdown.push(`${i + 1}. ${refText}`);
          }
        });

        if (bibls.length > 0) {
          markdown.push('');
        }
      }
    }

    const ackDiv = back.querySelector('div[type="acknowledgment"]');
    if (ackDiv) {
      markdown.push('## Acknowledgments');
      markdown.push('');

      const paragraphs = Array.from(ackDiv.querySelectorAll('p'));
      paragraphs.forEach(p => {
        const paraText = this.getTextContent(p);
        if (paraText) {
          markdown.push(paraText);
          markdown.push('');
        }
      });
    }

    return markdown;
  }

  /**
   * Parse bibliographic entry
   */
  private parseBiblio(bibl: Element): string {
    const parts: string[] = [];
    const authors: string[] = [];
    
    const analytic = bibl.querySelector('analytic');
    const monogr = bibl.querySelector('monogr');

    const authorContainer = analytic || monogr;
    if (authorContainer) {
      const authorElems = Array.from(authorContainer.querySelectorAll('author'));
      authorElems.forEach(author => {
        const nameParts: string[] = [];
        const surname = author.querySelector('surname');
        const forename = author.querySelector('forename');

        if (surname?.textContent) {
          nameParts.push(surname.textContent);
        }
        if (forename?.textContent) {
          nameParts.push(forename.textContent[0] + '.');
        }

        if (nameParts.length > 0) {
          authors.push(nameParts.join(' '));
        }
      });
    }

    if (authors.length > 0) {
      parts.push(authors.join(', '));
    }

    if (analytic) {
      const title = analytic.querySelector('title');
      if (title?.textContent) {
        parts.push(`"${this.cleanText(title.textContent)}"`);
      }
    }

    if (monogr) {
      const title = monogr.querySelector('title');
      if (title?.textContent) {
        parts.push(`*${this.cleanText(title.textContent)}*`);
      }

      const volParts: string[] = [];
      const imprint = monogr.querySelector('imprint');
      if (imprint) {
        const volume = imprint.querySelector('biblScope[unit="volume"]');
        if (volume?.textContent) {
          volParts.push(`vol. ${volume.textContent}`);
        }

        const issue = imprint.querySelector('biblScope[unit="issue"]');
        if (issue?.textContent) {
          volParts.push(`no. ${issue.textContent}`);
        }

        const page = imprint.querySelector('biblScope[unit="page"]');
        if (page) {
          const fromPage = page.getAttribute('from');
          const toPage = page.getAttribute('to');
          if (fromPage && toPage) {
            volParts.push(`pp. ${fromPage}-${toPage}`);
          } else if (page.textContent) {
            volParts.push(`pp. ${page.textContent}`);
          }
        }

        const date = imprint.querySelector('date');
        const dateWhen = date?.getAttribute('when');
        if (dateWhen) {
          volParts.push(dateWhen);
        }
      }

      if (volParts.length > 0) {
        parts.push(volParts.join(', '));
      }
    }

    return parts.join(', ');
  }
}

// Export singleton instance
export const teiConverter = new TEIConverter();
