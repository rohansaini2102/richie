import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Flag,
  TrendingUp,
  MonetizationOn,
  CreditCard,
  AccountBalance
} from '@mui/icons-material';
import { generateActionItems } from './utils/calculations';
import { 
  formatTimelineLabel, 
  getPriorityColor, 
  getPriorityBgColor 
} from './utils/formatters';

const ActionItems = ({ clientData, planData, onUpdate }) => {
  const [actionItems, setActionItems] = useState([]);
  const [editDialog, setEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('high');

  // Generate action items from client data
  const generatedItems = useMemo(() => {
    return generateActionItems(clientData);
  }, [clientData]);

  // Combine generated items with any existing custom items
  const allItems = useMemo(() => {
    const combined = [...generatedItems, ...actionItems];
    return combined.map((item, index) => ({
      ...item,
      id: item.id || `item-${index}`,
      completed: item.completed || false,
      dateAdded: item.dateAdded || new Date(),
      completedDate: item.completedDate || null
    }));
  }, [generatedItems, actionItems]);

  // Categorize items by priority
  const categorizedItems = useMemo(() => {
    const categories = {
      high: allItems.filter(item => item.priority === 'high'),
      medium: allItems.filter(item => item.priority === 'medium'),
      low: allItems.filter(item => item.priority === 'low')
    };
    
    return categories;
  }, [allItems]);

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const total = allItems.length;
    const completed = allItems.filter(item => item.completed).length;
    const highPriorityTotal = categorizedItems.high.length;
    const highPriorityCompleted = categorizedItems.high.filter(item => item.completed).length;
    
    return {
      total,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      highPriorityTotal,
      highPriorityCompleted,
      highPriorityRate: highPriorityTotal > 0 ? (highPriorityCompleted / highPriorityTotal) * 100 : 0
    };
  }, [allItems, categorizedItems]);

  const handleToggleComplete = (itemId) => {
    const updatedItems = allItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: !item.completed,
          completedDate: !item.completed ? new Date() : null
        };
      }
      return item;
    });
    
    // Update state and notify parent
    setActionItems(updatedItems.filter(item => !generatedItems.some(gen => gen.id === item.id)));
    if (onUpdate) {
      onUpdate({ actionItems: updatedItems });
    }
  };

  const handleAddItem = () => {
    setEditingItem({
      id: `custom-${Date.now()}`,
      action: '',
      priority: 'medium',
      timeline: '0-3 months',
      category: 'custom',
      description: '',
      completed: false
    });
    setEditDialog(true);
  };

  const handleEditItem = (item) => {
    setEditingItem({ ...item });
    setEditDialog(true);
  };

  const handleSaveItem = () => {
    if (!editingItem.action.trim()) return;
    
    const isNewItem = !allItems.find(item => item.id === editingItem.id);
    
    if (isNewItem) {
      setActionItems([...actionItems, {
        ...editingItem,
        dateAdded: new Date()
      }]);
    } else {
      setActionItems(actionItems.map(item => 
        item.id === editingItem.id ? editingItem : item
      ));
    }
    
    setEditDialog(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId) => {
    setActionItems(actionItems.filter(item => item.id !== itemId));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'debt': return <CreditCard />;
      case 'savings': return <MonetizationOn />;
      case 'expense': return <TrendingUp />;
      case 'investment': return <AccountBalance />;
      default: return <Flag />;
    }
  };

  const getTimelineIcon = (timeline) => {
    if (timeline.includes('0-1')) return <Error color="error" />;
    if (timeline.includes('0-3')) return <Warning color="warning" />;
    return <Schedule color="action" />;
  };

  const renderActionItem = (item) => (
    <ListItem 
      key={item.id}
      divider
      sx={{
        bgcolor: item.completed ? 'action.hover' : 'background.paper',
        opacity: item.completed ? 0.7 : 1
      }}
    >
      <ListItemIcon>
        <Checkbox
          checked={item.completed}
          onChange={() => handleToggleComplete(item.id)}
          color="primary"
        />
      </ListItemIcon>
      
      <ListItemIcon>
        {getCategoryIcon(item.category)}
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography 
              variant="body1" 
              sx={{ 
                textDecoration: item.completed ? 'line-through' : 'none',
                fontWeight: item.priority === 'high' ? 'bold' : 'normal'
              }}
            >
              {item.action}
            </Typography>
            <Chip 
              label={formatTimelineLabel(item.timeline)}
              size="small"
              variant="outlined"
              icon={getTimelineIcon(item.timeline)}
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
            {item.completed && item.completedDate && (
              <Typography variant="caption" color="success.main">
                Completed on {new Date(item.completedDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        }
      />
      
      <ListItemSecondaryAction>
        <Box display="flex" alignItems="center" gap={1}>
          {item.category === 'custom' && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEditItem(item)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box>
      {/* Progress Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Action Items Progress</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Overall Progress</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {completionStats.completed}/{completionStats.total} completed
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionStats.completionRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {completionStats.completionRate.toFixed(1)}% complete
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">High Priority Items</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {completionStats.highPriorityCompleted}/{completionStats.highPriorityTotal} completed
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionStats.highPriorityRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'error.main'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {completionStats.highPriorityRate.toFixed(1)}% complete
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Items by Priority */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Action Items</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddItem}
            >
              Add Custom Item
            </Button>
          </Box>

          {allItems.length === 0 ? (
            <Alert severity="success">
              Great! No immediate action items needed. Your financial health is on track.
            </Alert>
          ) : (
            ['high', 'medium', 'low'].map((priority) => (
              categorizedItems[priority].length > 0 && (
                <Accordion 
                  key={priority}
                  expanded={expandedCategory === priority}
                  onChange={() => setExpandedCategory(expandedCategory === priority ? '' : priority)}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Chip
                        label={`${priority.toUpperCase()} PRIORITY`}
                        color={
                          priority === 'high' ? 'error' :
                          priority === 'medium' ? 'warning' : 'success'
                        }
                        size="small"
                      />
                      <Typography variant="subtitle1">
                        {categorizedItems[priority].length} item{categorizedItems[priority].length !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {categorizedItems[priority].filter(item => item.completed).length} completed
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {categorizedItems[priority].map(renderActionItem)}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem && allItems.find(item => item.id === editingItem.id) ? 'Edit Action Item' : 'Add Action Item'}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Action"
                value={editingItem.action}
                onChange={(e) => setEditingItem({...editingItem, action: e.target.value})}
                margin="normal"
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="Description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                margin="normal"
                multiline
                rows={3}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editingItem.priority}
                  onChange={(e) => setEditingItem({...editingItem, priority: e.target.value})}
                  label="Priority"
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Timeline</InputLabel>
                <Select
                  value={editingItem.timeline}
                  onChange={(e) => setEditingItem({...editingItem, timeline: e.target.value})}
                  label="Timeline"
                >
                  <MenuItem value="0-1 month">0-1 month</MenuItem>
                  <MenuItem value="0-3 months">0-3 months</MenuItem>
                  <MenuItem value="0-6 months">0-6 months</MenuItem>
                  <MenuItem value="0-12 months">0-12 months</MenuItem>
                  <MenuItem value="12+ months">12+ months</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  label="Category"
                >
                  <MenuItem value="debt">Debt Management</MenuItem>
                  <MenuItem value="savings">Savings & Emergency Fund</MenuItem>
                  <MenuItem value="expense">Expense Management</MenuItem>
                  <MenuItem value="investment">Investment</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveItem} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionItems;