"use client";

import { useState, useEffect } from "react";
import { Table } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface TableListProps {
  tables: Table[];
  isLoading: boolean;
  onSelectTables: (selectedTables: Table[]) => void;
}

export function TableList({ tables, isLoading, onSelectTables }: TableListProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTables, setFilteredTables] = useState<Table[]>(tables);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTables(tables);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTables(
        tables.filter((table) => table.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, tables]);

  const handleSelectAll = () => {
    if (selectedTableIds.size === filteredTables.length) {
      // Deselect all
      setSelectedTableIds(new Set());
    } else {
      // Select all
      const newSelected = new Set<string>();
      filteredTables.forEach((table) => newSelected.add(table.name));
      setSelectedTableIds(newSelected);
    }
  };

  const handleTableSelect = (tableName: string) => {
    const newSelected = new Set(selectedTableIds);
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName);
    } else {
      newSelected.add(tableName);
    }
    setSelectedTableIds(newSelected);
  };

  const handleVisualize = () => {
    const selectedTables = tables.filter((table) => 
      selectedTableIds.has(table.name)
    );
    onSelectTables(selectedTables);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Tables</CardTitle>
        <CardDescription>
          Select the tables you want to include in the visualization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleVisualize}
            disabled={selectedTableIds.size === 0 || isLoading}
          >
            Visualize Selected
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center py-2">
              <Checkbox
                id="select-all"
                checked={
                  filteredTables.length > 0 && 
                  selectedTableIds.size === filteredTables.length
                }
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All
              </label>
              <div className="ml-auto text-sm text-muted-foreground">
                {selectedTableIds.size} of {filteredTables.length} selected
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {filteredTables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted"
                  >
                    <Checkbox
                      id={`table-${table.name}`}
                      checked={selectedTableIds.has(table.name)}
                      onCheckedChange={() => handleTableSelect(table.name)}
                    />
                    <label
                      htmlFor={`table-${table.name}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {table.name}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {table.columns.length} columns
                    </span>
                  </div>
                ))}
                {filteredTables.length === 0 && (
                  <div className="py-6 text-center text-muted-foreground">
                    No tables found
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}