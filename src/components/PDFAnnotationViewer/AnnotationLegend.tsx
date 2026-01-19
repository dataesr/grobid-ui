import React from 'react';
import { Paper, Box, Typography, Chip, Divider } from '@mui/material';
import { GrobidAnnotation, ANNOTATION_STYLES, AnnotationType } from './types';

interface AnnotationLegendProps {
  annotations: GrobidAnnotation[];
  visibleTypes: Set<AnnotationType>;
  selectedAnnotation: GrobidAnnotation | null;
}

const AnnotationLegend: React.FC<AnnotationLegendProps> = ({
  annotations,
  visibleTypes,
  selectedAnnotation,
}) => {
  // Count annotations by type
  const annotationCounts = annotations.reduce((acc, ann) => {
    acc[ann.type] = (acc[ann.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const types: AnnotationType[] = [
    'title',
    'author',
    'abstract',
    'section',
    'reference',
    'figure',
    'table',
    'keyword',
    'affiliation',
    'formula',
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Legend Title */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Annotations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {annotations.length} total
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Annotation Type Legend */}
        <Box sx={{ flex: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {types.map((type) => {
            const count = annotationCounts[type] || 0;
            if (count === 0) return null;

            const style = ANNOTATION_STYLES[type];
            const isVisible = visibleTypes.has(type);

            return (
              <Box
                key={type}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  opacity: isVisible ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    border: `2px solid ${style.borderColor}`,
                    backgroundColor: style.backgroundColor,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: '0.813rem' }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Typography>
                <Chip
                  label={count}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    bgcolor: 'grey.100',
                    fontWeight: 600,
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Selected Annotation Info */}
        {selectedAnnotation && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ minWidth: 200, maxWidth: 300 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Selected: {selectedAnnotation.type}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {selectedAnnotation.text}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Page {selectedAnnotation.page}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default AnnotationLegend;
