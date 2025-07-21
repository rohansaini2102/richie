import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Info,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';

const DataSection = ({
  title,
  icon,
  data,
  children,
  expanded = false,
  collapsible = true,
  editable = false,
  copyable = false,
  loading = false,
  error = null,
  warning = null,
  success = null,
  status,
  statusColor = 'default',
  onEdit,
  onToggle,
  renderHeader,
  renderContent,
  sx = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showRawData, setShowRawData] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onToggle) onToggle(newExpanded);
  };

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle color="success" />;
      case 'incomplete':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const renderAlerts = () => (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
    </>
  );

  if (loading) {
    return (
      <Card sx={sx}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={200} sx={{ ml: 1 }} />
          </Box>
          <Skeleton variant="rectangular" height={100} />
        </CardContent>
      </Card>
    );
  }

  if (!collapsible) {
    return (
      <Card sx={sx}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {icon}
              <Typography variant="h6">{title}</Typography>
              {status && (
                <Chip
                  label={status}
                  color={statusColor}
                  size="small"
                  icon={getStatusIcon()}
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              {copyable && (
                <Tooltip title="Copy JSON">
                  <IconButton size="small" onClick={handleCopy}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {data && (
                <Tooltip title={showRawData ? "Hide JSON" : "Show JSON"}>
                  <IconButton size="small" onClick={() => setShowRawData(!showRawData)}>
                    {showRawData ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              {editable && (
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={onEdit}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {renderAlerts()}

          {showRawData && data && (
            <Box mb={2}>
              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Box>
          )}

          {renderContent ? renderContent() : children}
        </CardContent>
      </Card>
    );
  }

  // Collapsible version
  return (
    <Accordion
      expanded={isExpanded}
      onChange={collapsible ? handleToggle : undefined}
      sx={sx}
    >
      <AccordionSummary 
        expandIcon={collapsible ? <ExpandMore /> : null}
        sx={{ 
          '& .MuiAccordionSummary-content': { 
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6">{title}</Typography>
          {status && (
            <Chip
              label={status}
              color={statusColor}
              size="small"
              icon={getStatusIcon()}
            />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1} onClick={(e) => e.stopPropagation()}>
          {copyable && (
            <Tooltip title="Copy JSON">
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {data && (
            <Tooltip title={showRawData ? "Hide JSON" : "Show JSON"}>
              <IconButton size="small" onClick={() => setShowRawData(!showRawData)}>
                {showRawData ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {editable && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        {renderAlerts()}

        {showRawData && data && (
          <Box mb={2}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Box>
        )}

        {renderContent ? renderContent() : children}
      </AccordionDetails>
    </Accordion>
  );
};

export default DataSection;