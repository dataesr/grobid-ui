import { capitalize } from '../../utils';
import { AuthorType, GrobidObjectType } from './types';

const Metadata = ({ grobidObject }: { grobidObject: GrobidObjectType }) => {
  return (
    <div className='grobid-tab-metadata'>
      <ul>
        {Object.keys(grobidObject).map((key: string) => {
          const value = grobidObject[key as keyof GrobidObjectType];
          if (!value) return '';
          if (key === 'authors')
            return <li key={key}><span>{capitalize(key)}:</span><ul>{grobidObject['authors']?.map((author: AuthorType, index: number) =>
              <li key={`author-${index}`}>{author.forename} {author.surname}<ul>{author.affiliations?.map((affiliation, index2: number) =>
                <li key={`author-${index}-affiliation-${index2}`}>{affiliation}</li>)}</ul></li>)}</ul></li>;
          if (['acknowledgements', 'references'].includes(key)) {
            return value.length > 0 ?
              <li key={key}><span>{capitalize(key)}:</span>
                <ul>{(value as HTMLElement[]).map((node, index) => <li key={`${key}-${index}`} dangerouslySetInnerHTML={{ __html: node.innerHTML }} />)}</ul></li>
              : '';
          }
          return <li key={key}><span>{capitalize(key)}:</span> {value.toString()}</li>;
        })}
      </ul>
    </div>
  )
}

export default Metadata;