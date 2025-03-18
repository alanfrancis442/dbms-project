"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Column } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Key, Link } from "lucide-react";

interface TableNodeData {
  label: string;
  columns: Column[];
}

export const TableNodeComponent = memo(({ data }: NodeProps<TableNodeData>) => {
  const { label, columns } = data;

  return (
    <Card className="min-w-[250px] max-w-[300px] shadow-md border-2">
      <CardHeader className="py-3 px-4 bg-primary/10">
        <CardTitle className="text-base font-bold truncate">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {columns.map((column) => {
            const isPrimary = column.isPrimaryKey;
            const isForeign = column.isForeignKey;
            
            return (
              <li key={column.name} className="px-4 py-2 text-sm flex items-center">
                <div className="flex-1 flex items-center space-x-2">
                  {isPrimary && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Key className="h-3.5 w-3.5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>Primary Key</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isForeign && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Link className="h-3.5 w-3.5 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Foreign Key to {column.references?.table}.{column.references?.column}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className="truncate">{column.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {column.type}
                </Badge>
                
                {/* Handles for connections */}
                {isPrimary && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={column.name}
                    className="w-3 h-3 bg-amber-500"
                  />
                )}
                {isForeign && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={column.name}
                    className="w-3 h-3 bg-blue-500"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
});

TableNodeComponent.displayName = "TableNodeComponent";