import { FitScreen, Layers, NavigateBefore, NavigateNext, ZoomIn, ZoomOut } from '@mui/icons-material';
import { Box, IconButton, Paper, Slider, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfJSViewer from 'pdfjs-dist/web/pdf_viewer';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as pdfjsTypes from 'pdfjs-dist/types/web/pdf_viewer';
import AnnotationLayer from './AnnotationLayer';
import AnnotationLegend from './AnnotationLegend';
import { parseGrobidCoordinates } from './grobidParser';
import './PDFAnnotationViewer.css';
import { AnnotationType, GrobidAnnotation } from './types';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFAnnotationViewerProps {
  pdfUrl: string;
  grobidTeiXml?: string;
  onAnnotationClick?: (annotation: GrobidAnnotation) => void;
  initialScale?: number;
}

const ANNOTATION_MODE = {
  VIEW: 1,
  EDIT: 2,
};

const PDFAnnotationViewer: React.FC<PDFAnnotationViewerProps> = ({
  grobidTeiXml,
  initialScale = 1.5,
  onAnnotationClick,
  pdfUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const pdfProxyRef = useRef<pdfjsTypes.PDFDocumentProxy | null>(null);
  const eventBus = new pdfJSViewer.EventBus();

  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [annotations, setAnnotations] = useState<GrobidAnnotation[]>([]);
  const [visibleAnnotationTypes, setVisibleAnnotationTypes] = useState<Set<AnnotationType>>(
    new Set(['title', 'author', 'abstract', 'section', 'reference', 'figure', 'table'])
  );
  const [selectedAnnotation, setSelectedAnnotation] = useState<GrobidAnnotation | null>(null);
  const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);

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

  const loadPDF = async () => {
    setLoading(true);

    if (pdfProxyRef?.current) {
      await pdfProxyRef.current?.destroy();
    }
    let containerOffSetHeight = 0;
    let containerOffSetWidth = 0;
    if (mainContainerRef?.current && containerRef?.current) {
      containerRef.current.innerHTML = '';
      containerOffSetHeight = mainContainerRef.current.offsetHeight;
      containerOffSetWidth = mainContainerRef.current.offsetWidth;
    }
    try {
      pdfProxyRef.current = await pdfjsLib.getDocument(pdfUrl).promise;
      setNumPages(pdfProxyRef.current.numPages)
      await renderPDF({ containerOffSetHeight, containerOffSetWidth });
    } catch (error) {
      console.error('error in [PDFV2.loadPDF]', error);
    }
    setLoading(false);
  };

  const renderPDF = async ({ containerOffSetHeight, containerOffSetWidth }: { containerOffSetHeight: number, containerOffSetWidth: number }) => {
    const numPages = pdfProxyRef?.current?.numPages ?? 0;
    for (let index = 0; index < numPages; index++) {
      const pageProxy = await pdfProxyRef?.current?.getPage(index + 1);
      if (pageProxy) {
        const scaledViewPort = pageProxy.getViewport({ scale: 1 });
        setViewport(scaledViewPort);
        const calculatedScale = Math.min(
          containerOffSetHeight / scaledViewPort.height,
          containerOffSetWidth / scaledViewPort.width
        );
        await renderPage({
          page: pageProxy,
          pageNumber: index + 1,
          viewPort: scaledViewPort,
          scale: calculatedScale,
        });
      }
    }
  };

  const renderPage = async ({ page, pageNumber, viewPort, scale }: { page: unknown, pageNumber: number, viewPort: pdfjsLib.PageViewport, scale?: number | undefined }) => {
    const pdfPageView = new pdfJSViewer.PDFPageView({
      container: containerRef?.current ?? undefined,
      id: pageNumber,
      scale,
      defaultViewport: viewPort,
      eventBus,
      annotationMode: ANNOTATION_MODE.VIEW,
      // annotationMode: ANNOTATION_MODE.EDIT
    });
    pdfPageView.setPdfPage(page);
    await pdfPageView.draw();
  };

  useEffect(() => {
    loadPDF();
    return () => {
      pdfProxyRef.current?.destroy();
    };
  }, []);

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
    _event: React.MouseEvent<HTMLElement>,
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
  const currentPageAnnotations = annotations;

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
      </Paper>

      <Paper
        elevation={2}
        sx={{
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          gap: 2,
          p: 1.5,
        }}
      >
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
        sx={{
          alignItems: 'flex-start',
          bgcolor: 'grey.100',
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          maxHeight: '400px',
          overflowX: 'hidden',
          overflowY: 'scroll',
          p: 2,
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <div
            className="h-[75vh] overflow-scroll relative"
            ref={mainContainerRef}
          >
            <div className="pdf-viewer overflow-auto" ref={containerRef}></div>
          </div>

          {viewport && (
            <AnnotationLayer
              annotations={currentPageAnnotations}
              onAnnotationClick={handleAnnotationClick}
              scale={initialScale}
              selectedAnnotation={selectedAnnotation}
              viewport={viewport}
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
