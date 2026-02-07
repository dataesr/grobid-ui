import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup } from '@mui/material';
import { useState } from 'react';
import Markdown from 'react-markdown';
import XMLViewer from 'react-xml-viewer';

import FileUploader from './components/FileUploader';
import PDFAnnotationViewer from './components/PDFAnnotationViewer/PDFAnnotationViewer';
import pdfUrl from './data/how_to_build_open_science_monitor.pdf';
import markdown from './data/how_to_build_open_science_monitor.pdf.md?raw';
import grobidTeiXml from './data/how_to_build_open_science_monitor.pdf.tei.xml?raw';

import './App.css';

function App() {
  const [format, setFormat] = useState("pdf");

  return (
    <Grid container spacing={3} sx={{ flexGrow: 1 }}>
      <Grid size={2} offset={{ xs: 1, md: 1 }}>
        <FileUploader />
      </Grid>
      <Grid size={8}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Format</FormLabel>
          <RadioGroup aria-label="format" defaultValue={format} name="row-radio-buttons-group" onChange={(event) => setFormat(event.target.value)} row>
            <FormControlLabel value="markdown" control={<Radio />} label="Markdown" />
            <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
            <FormControlLabel value="xml" control={<Radio />} label="XML TEI" />
          </RadioGroup>
        </FormControl>
        {(format === "pdf") && (
          <PDFAnnotationViewer
            pdfUrl={pdfUrl}
            grobidTeiXml={grobidTeiXml}
            initialScale={1}
          />
        )}
        {(format === "xml") && (
          <div>
            <XMLViewer xml={grobidTeiXml} />
          </div>
        )}
        {(format === "markdown") && (
          <div>
            <Markdown>{markdown}</Markdown>
          </div>
        )}
      </Grid>
    </Grid>
  )
}

export default App
