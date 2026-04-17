import { AddLink, CloudUpload } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import XMLViewer from 'react-xml-viewer';

import GrobidSvg from '../grobid.svg';
import Metadata from './components/metadata';
import { GrobidObjectType } from './components/metadata/types';
import PDFAnnotationViewer from './components/PDFAnnotationViewer/PDFAnnotationViewer';
import { GrobidAnnotation } from './components/PDFAnnotationViewer/types';
import { teiConverter } from './TEIConverter';

const App: React.FC = () => {
  const [, setPdfFile] = useState<Blob | File | null>(null);
  const [error, setError] = useState<string>('');
  const [grobidTeiXml, setGrobidTeiXml] = useState<string>('');
  const [grobidObject, setGrobidObject] = useState<GrobidObjectType>({});
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<GrobidAnnotation | null>(null);
  const [tab, setTab] = useState(0);

  // Handle PDF file upload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFileUpload = (event: any) => {
    const file = event?.target?.files?.[0] ?? event?.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setError('');
      processWithGrobid(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const extractMetadataFromTei = (xmlString: string): GrobidObjectType => {
    const xmlDoc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const xmlHeader = xmlDoc.getElementsByTagName('teiHeader')?.[0];
    const xmlAuthors = xmlHeader?.getElementsByTagName('author') ?? [];
    const authors = [];
    for (let i = 0; i < xmlAuthors.length; i++) {
      const xmlAffiliations = xmlAuthors[i].getElementsByTagName('affiliation');
      const affiliations = [];
      for (let j = 0; j < xmlAffiliations.length; j++) {
        affiliations.push(xmlAffiliations[j].getElementsByTagName('note')[0].textContent);
      }
      const author = {
        forename: xmlAuthors[i].getElementsByTagName('persName')[0].getElementsByTagName('forename')[0].textContent,
        surname: xmlAuthors[i].getElementsByTagName('persName')[0].getElementsByTagName('surname')[0].textContent,
        affiliations,
      }
      authors.push(author);
    }
    const xmlKeywords = xmlHeader?.getElementsByTagName('keywords')?.[0]?.getElementsByTagName('term') ?? [];
    const keywords = []
    for (let i = 0; i < xmlKeywords.length; i++) {
      keywords.push(xmlKeywords[i].textContent);
    }
    const acknowledgements: HTMLElement[] = [];
    xmlDoc.querySelectorAll<HTMLElement>('div[type="acknowledgement"] p > s').forEach((node) => {
      acknowledgements.push(node as HTMLElement);
    });
    const references: HTMLElement[] = [];
    xmlDoc.querySelectorAll<HTMLElement>('div[type="references"] biblStruct').forEach((node) => {
      references.push(node as HTMLElement);
    });

    return {
      title: xmlHeader?.getElementsByTagName('title')?.[0]?.textContent,
      authors,
      date: xmlHeader?.getElementsByTagName('date')?.[0]?.getAttribute('when'),
      keywords: keywords.join('; '),
      abstract: xmlHeader?.getElementsByTagName('abstract')?.[0]?.textContent,
      acknowledgements,
      references,
      licence: xmlHeader?.getElementsByTagName('licence')?.[0]?.textContent,
      publisher: xmlHeader?.getElementsByTagName('publisher')?.[0]?.textContent,
      grobidVersion: xmlHeader?.getElementsByTagName('application')?.[0]?.getAttribute('version'),
    }
  }

  // Process PDF with GROBID API
  const processWithGrobid = async (file: Blob | File) => {
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
      formData.append('teiCoordinates', 'affiliation');
      formData.append('teiCoordinates', 'biblStruct');
      formData.append('teiCoordinates', 'figure');
      formData.append('teiCoordinates', 'formula');
      formData.append('teiCoordinates', 'head');
      formData.append('teiCoordinates', 'note');
      formData.append('teiCoordinates', 'p');
      formData.append('teiCoordinates', 'persName');
      formData.append('teiCoordinates', 'ref');
      formData.append('teiCoordinates', 's');
      formData.append('teiCoordinates', 'title');

      const grobidUrl = 'https://lfoppiano-grobid.hf.space/api/processFulltextDocument';
      const response = await fetch(grobidUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`GROBID processing failed: ${response.statusText}`);
      }

      const teiXml = await response.text();
      const result = teiConverter.convert(teiXml);
      const grobidObjectTmp: GrobidObjectType = extractMetadataFromTei(teiXml);
      if (!result.success) {
        throw new Error(`TEI-XML processing failed: ${result.error}`);
      }
      setGrobidTeiXml(teiXml);
      setMarkdown(result?.markdown ?? '');
      setGrobidObject(grobidObjectTmp)
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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const downloadFile = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const pdfBlob = await response.blob();
      if (pdfBlob && pdfBlob.type === 'application/pdf') {
        setPdfFile(pdfBlob);
        setPdfUrl(URL.createObjectURL(pdfBlob));
        setError('');
        processWithGrobid(pdfBlob);
      } else {
        setError('Please select a valid PDF file');
      }
    } catch (error) {
      console.error(error);
      setError('Error while fetching online PDF');
    }
  }

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }
  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
      <div
        aria-labelledby={`simple-tab-${index}`}
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        role="tabpanel"
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  const isLoaded = (grobidTeiXml.length > 0) && (markdown.length > 0) && (pdfUrl.length > 0) && !loading;

  useEffect(() => {
    const dropZone = document.getElementById("dropZone");
    dropZone?.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone?.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    dropZone?.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
      handleFileUpload(event);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container spacing={3} sx={{ flexGrow: 1, width: '100%' }}>
      <Grid size={isLoaded ? 5 : 10} offset={{ xs: 1, md: 1 }}>
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'white',
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 4,
              py: 3,
            }}
          >
            <Grid container maxWidth="xl">
              <Grid size={isLoaded ? 2 : 1}>
                <img alt="Grobid logo" src={GrobidSvg} style={{ height: "80px", width: "80px" }} />
              </Grid>
              <Grid>
                <Typography variant="h4" fontWeight={700}>
                  GROBID PDF Annotation Viewer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Upload a PDF to extract and visualize document structure with GROBID
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Upload Section */}
            {!isLoaded && (
              <>
                <Paper elevation={2} id="dropZone" sx={{ p: 4, textAlign: 'center' }} className={loading ? 'disable' : ''} onClick={() => document?.getElementById("fileInput")?.click()} >
                  <CloudUpload sx={{ color: '#659243', fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to upload or drop a PDF Document
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select a PDF file to visualize its structure with GROBID annotations
                    <br />
                    OR
                    <br />
                    Seize the URL of a PDF
                  </Typography>
                  <Box>
                    <AddLink sx={{ color: '#659243', mt: 2, mr: 1 }} />
                    <TextField label="URL of a PDF" variant="standard" onChange={(e) => downloadFile(e.target.value)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} style={{ width: "25%" }} />
                  </Box>
                  <input type="file" id="fileInput" accept=".pdf" className="hidden"></input>
                </Paper>
                {loading && (
                  <CircularProgress
                    aria-label="Processing PDF with GROBID..."
                    enableTrackSlot
                    size={80}
                    sx={{
                      color: '#659243',
                      display: 'flex',
                      margin: 'auto',
                      position: 'relative',
                      top: -160,
                      zIndex: 1,
                    }}
                  />
                )}
              </>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* PDF Viewer */}
            {isLoaded && (
              <Paper elevation={2} sx={{ height: 'calc(100vh - 280px)', minHeight: 600 }}>
                <PDFAnnotationViewer
                  grobidTeiXml={grobidTeiXml}
                  initialScale={1}
                  onAnnotationClick={handleAnnotationClick}
                  pdfUrl={pdfUrl}
                />
              </Paper>
            )}

            {/* Selected Annotation Details */}
            {isLoaded && selectedAnnotation && (
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

            {/* New Upload Button (when PDF is already loaded) */}
            {isLoaded && (
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
      {isLoaded && (
        <Grid size={5}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={handleTabChange} aria-label="basic tabs example">
              <Tab label="Metadata" id="tab-metadata" aria-controls="tab-metadata" style={{ color: 'white' }} />
              <Tab label="Markdown-raw" id="tab-markdown-raw" aria-controls="tab-markdown-raw" style={{ color: 'white' }} />
              <Tab label="Markdown" id="tab-markdown" aria-controls="tab-markdown" style={{ color: 'white' }} />
              <Tab label="XML-TEI" id="tab-tei-xml" aria-controls="tab-tei-xml" style={{ color: 'white' }} />
            </Tabs>
          </Box>
          <Box sx={{ overflowY: "scroll", height: 'calc(100vh - 50px)', minHeight: 600 }}>
            <CustomTabPanel value={tab} index={0}>
              {((markdown?.length ?? 0) > 0) &&
                <Metadata grobidObject={grobidObject} />
              }
            </CustomTabPanel>
            <CustomTabPanel value={tab} index={1}>
              {((markdown?.length ?? 0) > 0) &&
                <Typography style={{ whiteSpace: "pre-wrap" }}>{markdown}</Typography>
              }
            </CustomTabPanel>
            <CustomTabPanel value={tab} index={2}>
              {((markdown?.length ?? 0) > 0) &&
                <Markdown>{markdown}</Markdown>
              }
            </CustomTabPanel>
            <CustomTabPanel value={tab} index={3}>
              {((grobidTeiXml?.length ?? 0) > 0) &&
                <XMLViewer xml={grobidTeiXml} theme={{ separatorColor: 'grey', textColor: 'white' }} showLineNumbers={true} />
              }
            </CustomTabPanel>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default App;
