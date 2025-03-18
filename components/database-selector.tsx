"use client";

import { useState, useEffect } from "react";
import { Database } from "@/lib/types";
import { getDatabases } from "@/lib/db-service";
import { DatabaseConnection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseSelectorProps {
  connection: DatabaseConnection;
  onSelectDatabase: (databaseName: string) => void;
}

export function DatabaseSelector({ connection, onSelectDatabase }: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDatabases() {
      setIsLoading(true);
      try {
        const dbs = await getDatabases(connection);
        setDatabases(dbs);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to fetch databases",
          description: "Could not retrieve the list of databases",
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDatabases();
  }, [connection, toast]);

  const handleDatabaseSelect = (value: string) => {
    setSelectedDatabase(value);
  };

  const handleContinue = () => {
    if (selectedDatabase) {
      onSelectDatabase(selectedDatabase);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select Database</CardTitle>
        <CardDescription>
          Choose a database to visualize its tables and relationships
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="database-select" className="text-sm font-medium">
                Database
              </label>
              <Select onValueChange={handleDatabaseSelect} value={selectedDatabase}>
                <SelectTrigger id="database-select">
                  <SelectValue placeholder="Select a database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.name} value={db.name}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleContinue} 
              className="w-full"
              disabled={!selectedDatabase}
            >
              Continue
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}