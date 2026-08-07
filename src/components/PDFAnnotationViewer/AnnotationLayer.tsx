import React from 'react';
import { GrobidAnnotation, ANNOTATION_STYLES } from './types';
import * as pdfjsLib from 'pdfjs-dist';

interface AnnotationLayerProps {
  annotations: GrobidAnnotation[];
  onAnnotationClick: (annotation: GrobidAnnotation) => void;
  scale: number;
  selectedAnnotation: GrobidAnnotation | null;
  viewport: pdfjsLib.PageViewport;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  onAnnotationClick,
  scale,
  selectedAnnotation,
  viewport,
}) => {
  // Convert PDF coordinates to canvas coordinates
  const transformCoordinates = (annotation: GrobidAnnotation) => {
    // PDF coordinates are from bottom-left, canvas from top-left
    const x = annotation.bbox.x * scale;
    const y = annotation.page * viewport.height * scale + annotation.bbox.y;
    const width = annotation.bbox.width * scale;
    const height = annotation.bbox.height * scale;

    return { x, y, width, height };
  };

  return (
    <svg
      style={{
        height: '100%',
        left: 0,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        width: '100%',
      }}
      viewBox={`0 0 100% 100%`}
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
