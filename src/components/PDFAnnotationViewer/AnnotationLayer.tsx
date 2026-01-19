import React from 'react';
import { GrobidAnnotation, ANNOTATION_STYLES } from './types';
import * as pdfjsLib from 'pdfjs-dist';

interface AnnotationLayerProps {
  annotations: GrobidAnnotation[];
  viewport: pdfjsLib.PageViewport;
  scale?: number;
  selectedAnnotation: GrobidAnnotation | null;
  onAnnotationClick: (annotation: GrobidAnnotation) => void;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  viewport,
  // scale,
  selectedAnnotation,
  onAnnotationClick,
}) => {
  // Convert PDF coordinates to canvas coordinates
  const transformCoordinates = (annotation: GrobidAnnotation) => {
    // PDF coordinates are from bottom-left, canvas from top-left
    const x = annotation.bbox.x;
    // const y = viewport.height - annotation.bbox.y - annotation.bbox.height;
    const y = annotation.bbox.y;
    const width = annotation.bbox.width;
    const height = annotation.bbox.height;

    return { x, y, width, height };
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewport.width,
        height: viewport.height,
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
    >
      <defs>
        {/* Define filters for hover effects */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {annotations.map((annotation) => {
        const coords = transformCoordinates(annotation);
        const style = ANNOTATION_STYLES[annotation.type] || ANNOTATION_STYLES.unknown;
        const isSelected = selectedAnnotation?.id === annotation.id;

        return (
          <g key={annotation.id}>
            {/* Background rectangle */}
            <rect
              x={coords.x}
              y={coords.y}
              width={coords.width}
              height={coords.height}
              fill={style.backgroundColor}
              fillOpacity={isSelected ? style.opacity * 1.3 : style.opacity}
              stroke={style.borderColor}
              strokeWidth={isSelected ? style.borderWidth * 1.5 : style.borderWidth}
              strokeOpacity={isSelected ? 1 : 0.8}
              rx={2}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                filter: isSelected ? 'url(#glow)' : 'none',
              }}
              onClick={() => onAnnotationClick(annotation)}
              className="annotation-rect"
            />

            {/* Label for selected annotation */}
            {isSelected && annotation.text && (
              <g>
                {/* Label background */}
                <rect
                  x={coords.x}
                  y={coords.y - 24}
                  width={Math.min(200, coords.width)}
                  height={22}
                  fill={style.borderColor}
                  fillOpacity={0.95}
                  rx={3}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Label text */}
                <text
                  x={coords.x + 6}
                  y={coords.y - 8}
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {annotation.type.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default AnnotationLayer;
