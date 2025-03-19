"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "lucide-react";
import { CodeEditor } from "@/components/code-editor";
import { useToast } from "@/hooks/use-toast";
import { getDatabases, executeQuery } from "@/lib/db-service";
import { Database } from "@/lib/types";
import ChatBot from "./chat-bot";

export default function SQLEditorPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    columns: string[];
    rows: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Database state
  const [availableDatabases, setAvailableDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [databaseConnection, setDatabaseConnection] = useState<any>(null);

  // Fetch available databases on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const conn = localStorage.getItem("databaseConnection");
        if (!conn) {
          toast({
            title: "No database connection",
            description: "Please connect to a database first.",
            variant: "destructive",
          });
          return;
        }

        setDatabaseConnection(JSON.parse(conn));
        const databases = await getDatabases(JSON.parse(conn));
        setAvailableDatabases(databases);
      } catch (error) {
        console.error("Failed to fetch databases:", error);
        toast({
          title: "Error",
          description: "Failed to load available databases.",
          variant: "destructive",
        });
      }
    };

    fetchDatabases();
  }, [toast]);

  const handleRunQuery = async () => {
    if (!selectedDatabase) {
      toast({
        title: "No database selected",
        description: "Please select a database to run the query.",
        variant: "destructive",
      });
      return;
    }

    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Executing query:", query.trim());
      const result = await executeQuery({
        connection: databaseConnection,
        databaseName: selectedDatabase,
        query: query.trim(),
      });

      setResults(result);
      toast({
        title: "Query executed successfully",
        description: `Returned ${result.rows.length} rows`,
      });
    } catch (error) {
      console.error("Query execution failed:", error);
      toast({
        title: "Query failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full rounded-lg border"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">SQL Editor</h2>
                <Select
                  value={selectedDatabase}
                  onValueChange={setSelectedDatabase}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select database" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDatabases.map((db) => (
                      <SelectItem key={db.name} value={db.name}>
                        {db.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRunQuery}
                disabled={isLoading || !selectedDatabase}
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? "Executing..." : "Run Query"}
              </Button>
            </div>
            <div className="flex-1 p-4">
              <CodeEditor value={query} onChange={setQuery} language="sql" />
            </div>
            <div className="border-t p-4">
              <h3 className="text-sm font-medium mb-2">Results</h3>
              <ScrollArea className="h-[300px] rounded-md border">
                {results ? (
                  <div className="p-4">
                    {results.rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              {results.columns.map((col, idx) => (
                                <th
                                  key={idx}
                                  className="border px-4 py-2 bg-muted"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.rows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {results.columns.map((col, colIdx) => (
                                  <td key={colIdx} className="border px-4 py-2">
                                    {row[col] !== null && row[col] !== undefined
                                      ? String(row[col])
                                      : "NULL"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        Query executed successfully. No results returned.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {isLoading
                      ? "Executing query..."
                      : "Run a query to see results"}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          {/* <div className="h-full flex items-center justify-center border-l text-muted-foreground">
            Chatbot interface will be implemented here
          </div> */}
          <ChatBot />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
