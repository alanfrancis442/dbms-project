"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Table, TableNode, TableEdge, FlowElements } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { TableNodeComponent } from "@/components/table-node";
import { useToast } from "@/hooks/use-toast";

interface DiagramViewProps {
  tables: Table[];
  onBack: () => void;
}

// Register custom node types
const nodeTypes = {
  table: TableNodeComponent,
};

function DiagramViewContent({ tables, onBack }: DiagramViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Create diagram elements from tables
  useEffect(() => {
    const elements = createFlowElements(tables);
    setNodes(elements.nodes);
    setEdges(elements.edges);
    
    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [tables, setNodes, setEdges, fitView]);

  const createFlowElements = (tables: Table[]): FlowElements => {
    const nodes: TableNode[] = [];
    const edges: TableEdge[] = [];
    const tablePositions: Record<string, { x: number, y: number }> = {};
    
    // Create nodes with a grid layout
    const columns = 3;
    const startX = 50;
    const startY = 50;
    const xGap = 350;
    const yGap = 300;
    
    tables.forEach((table, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const position = {
        x: startX + col * xGap,
        y: startY + row * yGap,
      };
      
      tablePositions[table.name] = position;
      
      nodes.push({
        id: table.name,
        type: 'table',
        data: {
          label: table.name,
          columns: table.columns,
        },
        position,
      });
    });
    
    // Create edges for foreign key relationships
    tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.isForeignKey && column.references) {
          const { table: targetTable, column: targetColumn } = column.references;
          
          // Only create edges if both tables are in the visualization
          if (tablePositions[targetTable]) {
            edges.push({
              id: `${table.name}-${column.name}-${targetTable}-${targetColumn}`,
              source: table.name,
              target: targetTable,
              sourceHandle: column.name,
              targetHandle: targetColumn,
              label: `${column.name} → ${targetColumn}`,
              animated: true,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            });
          }
        }
      });
    });
    
    return { nodes, edges };
  };

  const handleExportImage = useCallback(() => {
    if (containerRef.current === null) {
      return;
    }

    const reactFlowNode = containerRef.current.querySelector('.react-flow');
    if (!reactFlowNode) {
      return;
    }

    try {
      // Use html2canvas to capture the diagram (would need to be imported)
      // For now, show a toast message
      toast({
        title: "Export feature",
        description: "Export functionality would be implemented here with html2canvas",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export the diagram",
      });
    }
  }, [toast]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[calc(100vh-6rem)] border rounded-lg overflow-hidden"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                  {isFullScreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExportImage}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Diagram</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Panel>
        
        <Panel position="top-left">
          <Button variant="outline" onClick={onBack}>
            Back to Tables
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function DiagramView(props: DiagramViewProps) {
  return (
    <ReactFlowProvider>
      <DiagramViewContent {...props} />
    </ReactFlowProvider>
  );
}