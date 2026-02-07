import { Article, CloudUpload } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import XMLViewer from 'react-xml-viewer';

import PDFAnnotationViewer from './components/PDFAnnotationViewer/PDFAnnotationViewer';
import { GrobidAnnotation } from './components/PDFAnnotationViewer/types';
import markdown2 from './data/how_to_build_open_science_monitor.pdf.md?raw';
import grobidTeiXml2 from './data/how_to_build_open_science_monitor.pdf.tei.xml?raw';


/**
 * Example App demonstrating how to use the PDFAnnotationViewer component
 * with GROBID integration
 */
const App: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [, setPdfFile] = useState<File | null>(null);
  const [grobidTeiXml, setGrobidTeiXml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<GrobidAnnotation | null>(null);
  const [format, setFormat] = useState(0);

  // Handle PDF file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setError('');

      // Optionally, automatically process with GROBID
      processWithGrobid(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // Process PDF with GROBID API
  const processWithGrobid = async (file: File) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('input', file);
      formData.append('consolidateCitations', '1');
      formData.append('consolidateFunders', '1');
      formData.append('consolidateHeader', '1');
      formData.append('includeRawAffiliations', '1');
      formData.append('includeRawCitations', '1');
      formData.append('includeRawCopyrights', '1');
      formData.append('segmentSentences', '1');
      formData.append('teiCoordinates', 'affiliation,biblStruct,figure,formula,head,note,persName,ref,s,title');

      // Replace with your GROBID server URL
      // const grobidUrl = 'http://localhost:8070/api/processFulltextDocument';
      const grobidUrl = 'https://lfoppiano-grobid.hf.space/api/processFulltextDocument';

      const response = await fetch(grobidUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`GROBID processing failed: ${response.statusText}`);
      }

      const teiXml = await response.text();
      setGrobidTeiXml(teiXml);
      setLoading(false);
    } catch (err) {
      console.error('GROBID processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF with GROBID');
      setLoading(false);
    }
  };

  // Handle annotation click
  const handleAnnotationClick = (annotation: GrobidAnnotation) => {
    setSelectedAnnotation(annotation);
    console.log('Annotation clicked:', annotation);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setFormat(newValue);
  };


  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }
  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  return (
    <Grid container spacing={3} sx={{ flexGrow: 1, width: '100%' }}>
      <Grid size={4} offset={{ xs: 1, md: 1 }}>
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              py: 3,
              px: 4,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Article sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h4" fontWeight={700}>
                  GROBID PDF Annotation Viewer
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Upload a PDF to extract and visualize document structure with GROBID
              </Typography>
            </Container>
          </Paper>

          <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Upload Section */}
            {!pdfUrl && (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Upload a PDF Document
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select a PDF file to visualize its structure with GROBID annotations
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ mt: 2 }}
                >
                  Choose PDF File
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
              </Paper>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Loading Alert */}
            {loading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Processing PDF with GROBID... This may take a moment.
              </Alert>
            )}

            {/* PDF Viewer */}
            {pdfUrl && (
              <Paper elevation={2} sx={{ height: 'calc(100vh - 280px)', minHeight: 600 }}>
                <PDFAnnotationViewer
                  pdfUrl={pdfUrl}
                  grobidTeiXml={grobidTeiXml}
                  onAnnotationClick={handleAnnotationClick}
                  initialScale={1}
                />
              </Paper>
            )}

            {/* Selected Annotation Details */}
            {selectedAnnotation && (
              <Paper elevation={2} sx={{ mt: 2, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Annotation Details
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedAnnotation.type.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Page
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedAnnotation.page}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Text Content
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedAnnotation.text}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bounding Box
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      x: {selectedAnnotation.bbox.x.toFixed(2)},
                      y: {selectedAnnotation.bbox.y.toFixed(2)},
                      w: {selectedAnnotation.bbox.width.toFixed(2)},
                      h: {selectedAnnotation.bbox.height.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Instructions */}
            {!pdfUrl && (
              <Paper elevation={0} sx={{ mt: 4, p: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="h6" gutterBottom>
                  Getting Started
                </Typography>
                <Typography variant="body2" component="div">
                  <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Make sure you have a GROBID server running (default: http://localhost:8070)</li>
                    <li>Upload a PDF document using the button above</li>
                    <li>The PDF will be automatically processed with GROBID</li>
                    <li>View extracted annotations overlaid on the PDF</li>
                    <li>Click on annotations to see details</li>
                    <li>Toggle annotation types to filter the view</li>
                  </ol>
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Update the GROBID server URL in the code if your server is not running on localhost:8070
                </Typography>
              </Paper>
            )}

            {/* New Upload Button (when PDF is already loaded) */}
            {pdfUrl && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                >
                  Upload Different PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>
            )}
          </Container>
        </Box>
      </Grid>
      <Grid size={6}>
        {/* <FormControl component="fieldset">
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
            grobidTeiXml={grobidTeiXml2}
            initialScale={1}
          />
        )}
        {(format === "xml") && (
          <div>
            <XMLViewer xml={grobidTeiXml2} />
          </div>
        )}
        {(format === "markdown") && (
          <div>
            <Markdown>{markdown2}</Markdown>
          </div>
        )} */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={format} onChange={handleTabChange} aria-label="basic tabs example">
            <Tab label="Markdown" id="tab-markdown" aria-controls="tab-markdown" />
            <Tab label="XML-TEI" id="tab-tei-xml" aria-controls="tab-tei-xml" />
            <Tab label="PDF" id="tab-pdf" aria-controls="tab-pdf" />
          </Tabs>
        </Box>
        <CustomTabPanel value={format} index={0}>
          <Markdown>{markdown2}</Markdown>
        </CustomTabPanel>
        <CustomTabPanel value={format} index={1}>
          <XMLViewer xml={grobidTeiXml2} />
        </CustomTabPanel>
        <CustomTabPanel value={format} index={2}>
          <PDFAnnotationViewer
            pdfUrl={pdfUrl}
            grobidTeiXml={grobidTeiXml2}
            initialScale={1}
          />
        </CustomTabPanel>
      </Grid>
    </Grid>
  );
};

export default App;
