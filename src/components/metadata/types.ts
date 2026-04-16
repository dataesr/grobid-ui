export type AuthorType = {
  affiliations?: string[],
  forename?: string,
  surname?: string,
}

export type GrobidObjectType = {
  abstract?: string,
  acknowledgements?: HTMLElement[],
  authors?: object[],
  date?: string | null,
  grobidVersion?: string | null,
  keywords?: string,
  licence?: string,
  publisher?: string,
  references?: HTMLElement[],
  title?: string,
}