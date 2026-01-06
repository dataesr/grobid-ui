import './App.css'

import Grid from '@mui/material/Grid'
import { Document, Page } from 'react-pdf'
import { useState } from 'react';
import { pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';

import FileUploader from './components/FileUploader'
import file from './data/how_to_build_open_science_monitor.pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function App() {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <Grid container spacing={3} sx={{ flexGrow: 1 }}>
      <Grid size={2} offset={{ xs: 1, md: 1 }}>
        <FileUploader />
      </Grid>
      <Grid size={8}>
        <Document file={file} loading="Loading..." onLoadSuccess={onDocumentLoadSuccess}>
          <Page className="pdf-page" pageNumber={pageNumber} renderAnnotationLayer={false} renderTextLayer={false} />
        </Document>
        <span onClick={() => setPageNumber(pageNumber - 1)}> Previous </span>
        <span>Page {pageNumber} of {numPages}</span>
        <span onClick={() => setPageNumber(pageNumber + 1)}> Next </span>
      </Grid>
    </Grid>
  )
}

export default App
