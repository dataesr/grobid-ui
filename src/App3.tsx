import PDFAnnotationViewer from './components/PDFAnnotationViewer/PDFAnnotationViewer';

import grobidTeiXml from './data/how_to_build_open_science_monitor.pdf.tei.xml?raw';
import pdfUrl from './data/how_to_build_open_science_monitor.pdf'

function App3() {
  return (
    <PDFAnnotationViewer
      pdfUrl={pdfUrl}
      grobidTeiXml={grobidTeiXml}
      initialScale={1}
    />
  );
}

export default App3;