import { capitalize } from '../utils';

type grobidObjectType = {
  abstract?: string,
  acknowledgements?: HTMLElement[],
  authors?: object[],
  date?: string | null,
  grobidVersion?: string | null,
  keywords?: string,
  licence?: string,
  publisher?: string,
  title?: string,
}

type authorType = {
  affiliations?: string[],
  forename?: string,
  surname?: string,
}

const Metadata = ({ grobidObject }: { grobidObject: grobidObjectType }) => {
  return (
    <div className='grobid-tab-metadata'>
      <ul>
        {Object.keys(grobidObject).map((key: string) => {
          const value = grobidObject[key as keyof grobidObjectType];
          if (!value) return '';
          if (key === 'authors')
            return <li key={key}><span>{capitalize(key)}:</span><ul>{grobidObject['authors']?.map((author: authorType, index: number) => 
              <li key={`author-${index}`}>{author.forename} {author.surname}<ul>{author.affiliations?.map((affiliation, index2: number) => 
                <li key={`author-${index}-affiliation-${index2}`}>{affiliation}</li>)}</ul></li>)}</ul></li>;
          if (key === 'acknowledgements')
            return <li key={key}><span>{capitalize(key)}:</span>
              <ul>{(grobidObject?.['acknowledgements'] ?? []).map((node, index) => <li key={`acknowledgements-${index}`} dangerouslySetInnerHTML={{ __html: node.innerHTML }} />)}</ul></li>;
          return <li key={key}><span>{capitalize(key)}:</span> {value.toString()}</li>;
        })}
      </ul>
    </div>
  )
}

export default Metadata;