import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Box, IconButton, Slider, ToggleButtonGroup, ToggleButton, Tooltip, Paper } from '@mui/material';
import { ZoomIn, ZoomOut, NavigateBefore, NavigateNext, Layers, FitScreen } from '@mui/icons-material';
import { GrobidAnnotation, AnnotationType } from './types';
import { parseGrobidCoordinates } from './grobidParser';
import AnnotationLayer from './AnnotationLayer';
import AnnotationLegend from './AnnotationLegend';
import './PDFAnnotationViewer.css';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFAnnotationViewerProps {
  pdfUrl: string;
  grobidTeiXml?: string;
  onAnnotationClick?: (annotation: GrobidAnnotation) => void;
  initialScale?: number;
}

const PDFAnnotationViewer: React.FC<PDFAnnotationViewerProps> = ({
  pdfUrl,
  grobidTeiXml,
  onAnnotationClick,
  initialScale = 1.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [annotations, setAnnotations] = useState<GrobidAnnotation[]>([]);
  const [visibleAnnotationTypes, setVisibleAnnotationTypes] = useState<Set<AnnotationType>>(
    new Set(['title', 'author', 'abstract', 'section', 'reference', 'figure', 'table'])
  );
  const [selectedAnnotation, setSelectedAnnotation] = useState<GrobidAnnotation | null>(null);
  const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setError('Failed to load PDF document');
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Parse GROBID annotations
  useEffect(() => {
    if (grobidTeiXml) {
      try {
        const parsedAnnotations = parseGrobidCoordinates(grobidTeiXml);
        setAnnotations(parsedAnnotations);
      } catch (err) {
        console.error('Error parsing GROBID annotations:', err);
      }
    }
  }, [grobidTeiXml]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const pageViewport = page.getViewport({ scale });

        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = pageViewport.height;
        canvas.width = pageViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: pageViewport,
        };

        await page.render(renderContext).promise;

        if (isMounted) {
          setViewport(pageViewport);
        }
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNum, scale]);

  // Navigation handlers
  const goToPrevPage = useCallback(() => {
    setPageNum((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNum((prev) => Math.min(numPages, prev + 1));
  }, [numPages]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  }, []);

  const handleFitToWidth = useCallback(() => {
    if (containerRef.current && viewport) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const newScale = containerWidth / (viewport.width / scale);
      setScale(newScale);
    }
  }, [viewport, scale]);

  const handleAnnotationTypeToggle = (
    event: React.MouseEvent<HTMLElement>,
    newTypes: AnnotationType[]
  ) => {
    setVisibleAnnotationTypes(new Set(newTypes));
  };

  const handleAnnotationClick = useCallback((annotation: GrobidAnnotation) => {
    setSelectedAnnotation(annotation);
    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }
  }, [onAnnotationClick]);

  // Filter annotations for current page
  const currentPageAnnotations = annotations.filter(
    (ann) => ann.page === pageNum && visibleAnnotationTypes.has(ann.type)
  );

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
        {error}
      </Box>
    );
  }

  return (
    <Box className="pdf-annotation-viewer" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* Page Navigation */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Previous page">
            <IconButton
              onClick={goToPrevPage}
              disabled={pageNum <= 1 || loading}
              size="small"
            >
              <NavigateBefore />
            </IconButton>
          </Tooltip>

          <Box sx={{
            minWidth: 100,
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {loading ? 'Loading...' : `${pageNum} / ${numPages}`}
          </Box>

          <Tooltip title="Next page">
            <IconButton
              onClick={goToNextPage}
              disabled={pageNum >= numPages || loading}
              size="small"
            >
              <NavigateNext />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
          <Tooltip title="Zoom out">
            <IconButton onClick={handleZoomOut} size="small" disabled={loading}>
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Slider
            value={scale}
            onChange={(_, value) => setScale(value as number)}
            min={0.5}
            max={3}
            step={0.1}
            sx={{ width: 120 }}
            size="small"
            disabled={loading}
          />

          <Box sx={{ minWidth: 45, fontSize: '0.875rem' }}>
            {Math.round(scale * 100)}%
          </Box>

          <Tooltip title="Zoom in">
            <IconButton onClick={handleZoomIn} size="small" disabled={loading}>
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="Fit to width">
            <IconButton onClick={handleFitToWidth} size="small" disabled={loading}>
              <FitScreen />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Annotation Type Filter */}
        {annotations.length > 0 && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title="Toggle annotation layers">
              <Layers fontSize="small" sx={{ color: 'text.secondary' }} />
            </Tooltip>
            <ToggleButtonGroup
              value={Array.from(visibleAnnotationTypes)}
              onChange={handleAnnotationTypeToggle}
              size="small"
            >
              <ToggleButton value="title">Title</ToggleButton>
              <ToggleButton value="author">Authors</ToggleButton>
              <ToggleButton value="abstract">Abstract</ToggleButton>
              <ToggleButton value="section">Sections</ToggleButton>
              <ToggleButton value="reference">References</ToggleButton>
              <ToggleButton value="figure">Figures</ToggleButton>
              <ToggleButton value="table">Tables</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Paper>

      {/* PDF Canvas and Annotations */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: 2,
          bgcolor: 'grey.100'
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />

          {viewport && (
            <AnnotationLayer
              annotations={currentPageAnnotations}
              viewport={viewport}
              scale={scale}
              selectedAnnotation={selectedAnnotation}
              onAnnotationClick={handleAnnotationClick}
            />
          )}
        </Box>
      </Box>

      {/* Legend */}
      {annotations.length > 0 && (
        <AnnotationLegend
          annotations={annotations}
          visibleTypes={visibleAnnotationTypes}
          selectedAnnotation={selectedAnnotation}
        />
      )}
    </Box>
  );
};

export default PDFAnnotationViewer;
