"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Chip,
  Button,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  ExpandLess,
  Person,
  Refresh,
  Home,
  ZoomIn,
  ZoomOut,
  PanTool,
  Email,
  Badge,
  LocationOn,
} from "@mui/icons-material";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  status: string;
  projectCode: string | null;
}

interface OrgTreeNode {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string | null;
  department: string | null;
  profileImage: string | null;
  location?: string;
  employeeCode: string | null;
  directReportsCount: number;
  children: OrgTreeNode[];
  reportingManagerId: string | null;
  isExpanded?: boolean;
  x?: number;
  y?: number;
}

interface TreeNodeProps {
  node: OrgTreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  onHover: (nodeId: string, event: React.MouseEvent) => void;
  onLeave: () => void;
  projects?: Project[];
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onToggle,
  onHover,
  onLeave,
  projects = [],
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = node.isExpanded ?? false;
  const initials = `${node.firstName[0]}${node.lastName[0]}`.toUpperCase();

  const projectTooltip = (
    <Box sx={{ p: 1.5, maxWidth: 300 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Current Projects
      </Typography>
      {projects.length > 0 ? (
        projects.map((project, idx) => (
          <Box key={project.id} sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              {project.projectCode && `${project.projectCode} - `}
              {project.title}
            </Typography>
            <Chip
              label={project.status}
              size="small"
              sx={{ mt: 0.5, fontSize: "0.65rem", height: 18 }}
              color={project.status === "ACTIVE" ? "success" : "default"}
            />
          </Box>
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No active projects
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        mb: 4,
        mx: 2,
      }}
    >
      {/* Connecting Line from Parent */}
      {level > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: -40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 2,
            height: 40,
            bgcolor: "primary.main",
            zIndex: 0,
          }}
        />
      )}

      {/* Employee Card */}
      <Tooltip title={projectTooltip} arrow placement="top">
        <Card
          onMouseEnter={(e) => onHover(node.id, e)}
          onMouseLeave={onLeave}
          sx={{
            minWidth: 260,
            maxWidth: 300,
            borderRadius: 3,
            boxShadow: level === 0 ? 6 : 3,
            border: `2px solid ${
              level === 0
                ? "primary.main"
                : level === 1
                ? "secondary.main"
                : level === 2
                ? "info.main"
                : "divider"
            }`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-6px) scale(1.02)",
              boxShadow: 8,
              borderColor: "primary.dark",
            },
            bgcolor: "background.paper",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Header with Avatar and Expand Button */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Avatar
                src={node.profileImage || undefined}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  border: "3px solid",
                  borderColor: "primary.light",
                }}
              >
                {initials}
              </Avatar>
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(node.id);
                  }}
                  sx={{
                    bgcolor: isExpanded ? "primary.main" : "action.hover",
                    color: isExpanded ? "white" : "text.secondary",
                    "&:hover": {
                      bgcolor: "primary.dark",
                      color: "white",
                    },
                    width: 36,
                    height: 36,
                  }}
                >
                  {isExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Name */}
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ mb: 0.5, fontSize: "1.05rem" }}
              noWrap
            >
              {node.name}
            </Typography>

            {/* Employee Code */}
            {node.employeeCode && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, fontSize: "0.75rem", display: "flex", alignItems: "center" }}
              >
                <Badge sx={{ fontSize: 12, mr: 0.5 }} />
                {node.employeeCode}
              </Typography>
            )}

            {/* Designation */}
            {node.designation && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, fontSize: "0.85rem" }}
                noWrap
              >
                {node.designation}
              </Typography>
            )}

            {/* Email */}
            <Box display="flex" alignItems="center" mb={1}>
              <Email sx={{ fontSize: 14, mr: 0.5, color: "text.secondary" }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
                noWrap
              >
                {node.email}
              </Typography>
            </Box>

            {/* Location */}
            {node.location && (
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn
                  sx={{ fontSize: 14, mr: 0.5, color: "text.secondary" }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem" }}
                  noWrap
                >
                  {node.location}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Department */}
            {node.department && (
              <Chip
                label={node.department}
                size="small"
                sx={{
                  mb: 1,
                  fontSize: "0.75rem",
                  height: 24,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  fontWeight: 500,
                }}
              />
            )}

            {/* Direct Reports Count */}
            {hasChildren && (
              <Box
                sx={{
                  mt: 1,
                  pt: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem", fontWeight: 500 }}
                >
                  {node.directReportsCount} direct report
                  {node.directReportsCount !== 1 ? "s" : ""}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Tooltip>

      {/* Children Container with Connecting Lines */}
      {hasChildren && isExpanded && (
        <Box
          sx={{
            mt: 4,
            display: "flex",
            flexDirection: "row",
            gap: 4,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -40,
              left: "50%",
              transform: "translateX(-50%)",
              width: node.children.length > 1 ? "calc(100% - 80px)" : 2,
              height: 2,
              bgcolor: "primary.main",
              zIndex: 0,
            },
          }}
        >
          {node.children.map((child, index) => (
            <Box
              key={child.id}
              sx={{
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -40,
                  left:
                    index === 0
                      ? "50%"
                      : index === node.children.length - 1
                      ? "50%"
                      : 0,
                  right:
                    index === node.children.length - 1
                      ? "50%"
                      : index === 0
                      ? "50%"
                      : 0,
                  height: 2,
                  bgcolor: "primary.main",
                  zIndex: 0,
                },
              }}
            >
              <TreeNode
                node={child}
                level={level + 1}
                onToggle={onToggle}
                onHover={onHover}
                onLeave={onLeave}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const OrganizationChart: React.FC = () => {
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Map<string, Project[]>>(
    new Map()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const axiosInstance = createAxiosInstance();
  const userInfo = useAppselector((state) => state.user.user);

  useEffect(() => {
    fetchOrganizationTree();
  }, []);

  const fetchOrganizationTree = async (userId?: string) => {
    try {
      setLoading(true);
      const url = userId
        ? `/organization/tree?userId=${userId}`
        : `/organization/tree`;
      const response = await axiosInstance.get(url);
      const data = response.data.data;

      const nodes = Array.isArray(data) ? data : [data];
      const processedNodes = processTreeData(nodes);
      setTreeData(processedNodes);
    } catch (error: any) {
      console.error("Error fetching organization tree:", error);
      toast.error("Failed to load organization chart");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async (userId: string) => {
    if (userProjects.has(userId)) {
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/organization/user-projects/${userId}?limit=5`
      );
      const projects = response.data.data || [];
      setUserProjects((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, projects);
        return newMap;
      });
    } catch (error) {
      console.error("Error fetching user projects:", error);
    }
  };

  const processTreeData = (nodes: OrgTreeNode[]): OrgTreeNode[] => {
    return nodes.map((node) => ({
      ...node,
      isExpanded: expandedNodes.has(node.id),
      children: processTreeData(node.children),
    }));
  };

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });

    setTreeData((prev) => {
      const updateNode = (node: OrgTreeNode): OrgTreeNode => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return {
          ...node,
          children: node.children.map(updateNode),
        };
      };
      return prev.map(updateNode);
    });
  }, []);

  const handleHover = useCallback((nodeId: string, event: React.MouseEvent) => {
    setHoveredNodeId(nodeId);
    fetchUserProjects(nodeId);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoomLevel((prev) => Math.max(50, Math.min(200, prev + delta)));
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      try {
        const response = await axiosInstance.get(
          `/organization/search?q=${encodeURIComponent(value)}`
        );
        setSearchResults(response.data.data || []);
      } catch (error) {
        console.error("Error searching:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (userId: string) => {
    fetchOrganizationTree(userId);
    setSearchTerm("");
    setSearchResults([]);
    setPanPosition({ x: 0, y: 0 });
    setZoomLevel(100);
  };

  const expandAll = () => {
    const expandNode = (node: OrgTreeNode): Set<string> => {
      const ids = new Set<string>([node.id]);
      node.children.forEach((child) => {
        const childIds = expandNode(child);
        childIds.forEach((id) => ids.add(id));
      });
      return ids;
    };

    const allIds = new Set<string>();
    treeData.forEach((node) => {
      const nodeIds = expandNode(node);
      nodeIds.forEach((id) => allIds.add(id));
    });

    setExpandedNodes(allIds);
    setTreeData((prev) => {
      const expand = (node: OrgTreeNode): OrgTreeNode => ({
        ...node,
        isExpanded: true,
        children: node.children.map(expand),
      });
      return prev.map(expand);
    });
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
    setTreeData((prev) => {
      const collapse = (node: OrgTreeNode): OrgTreeNode => ({
        ...node,
        isExpanded: false,
        children: node.children.map(collapse),
      });
      return prev.map(collapse);
    });
  };

  const goToTop = () => {
    fetchOrganizationTree();
    setPanPosition({ x: 0, y: 0 });
    setZoomLevel(100);
  };

  const goToMe = () => {
    if (userInfo?.id) {
      fetchOrganizationTree(userInfo.id);
      setPanPosition({ x: 0, y: 0 });
      setZoomLevel(100);
    }
  };

  const resetView = () => {
    setPanPosition({ x: 0, y: 0 });
    setZoomLevel(100);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Organization Chart
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              placeholder="Search employee..."
              size="small"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={goToTop}
              size="small"
            >
              Top
            </Button>

            {userInfo?.id && (
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={goToMe}
                size="small"
              >
                Me
              </Button>
            )}

            <Button variant="outlined" onClick={expandAll} size="small">
              Expand All
            </Button>

            <Button variant="outlined" onClick={collapseAll} size="small">
              Collapse All
            </Button>

            <IconButton onClick={() => fetchOrganizationTree()} size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {searchResults.map((result) => (
              <Card
                key={result.id}
                sx={{
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => handleSearchSelect(result.id)}
              >
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {result.name}
                  </Typography>
                  {result.designation && (
                    <Typography variant="caption" color="text.secondary">
                      {result.designation}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Canvas Container */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          bgcolor: "grey.50",
          borderRadius: 2,
          cursor: isDragging ? "grabbing" : "grab",
          "&:active": {
            cursor: "grabbing",
          },
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Zoomable/Draggable Canvas */}
        <Box
          ref={canvasRef}
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            pt: 4,
            pb: 8,
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
            willChange: "transform",
          }}
        >
          {treeData.length > 0 ? (
            treeData.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                onToggle={handleToggle}
                onHover={handleHover}
                onLeave={handleLeave}
                projects={hoveredNodeId === node.id ? userProjects.get(node.id) : undefined}
              />
            ))
          ) : (
            <Typography
              variant="h6"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 8 }}
            >
              No organization data available
            </Typography>
          )}
        </Box>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          position: "fixed",
          right: 24,
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Zoom In" arrow>
          <IconButton
            onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 200))}
            sx={{ bgcolor: "background.paper", boxShadow: 3 }}
          >
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out" arrow>
          <IconButton
            onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 50))}
            sx={{ bgcolor: "background.paper", boxShadow: 3 }}
          >
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset View" arrow>
          <IconButton
            onClick={resetView}
            sx={{ bgcolor: "background.paper", boxShadow: 3 }}
          >
            <PanTool />
          </IconButton>
        </Tooltip>
        <Paper
          sx={{
            p: 1,
            bgcolor: "background.paper",
            boxShadow: 3,
            textAlign: "center",
            minWidth: 50,
          }}
        >
          <Typography variant="caption" fontWeight={600}>
            {zoomLevel}%
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default OrganizationChart;
