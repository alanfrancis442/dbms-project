"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DatabaseConnection, DatabaseType } from "@/lib/types";
import { testConnection } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  host: z.string().min(1, { message: "Host is required" }),
  port: z.coerce.number().int().positive({ message: "Port must be a positive number" }),
  user: z.string().min(1, { message: "Username is required" }),
  password: z.string(),
  type: z.enum(["mysql", "postgresql"], { 
    required_error: "Please select a database type",
  }),
});

interface ConnectionFormProps {
  onConnect: (connection: DatabaseConnection) => void;
}

export function ConnectionForm({ onConnect }: ConnectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      type: "mysql",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const connection: DatabaseConnection = {
        host: values.host,
        port: values.port,
        user: values.user,
        password: values.password,
        type: values.type as DatabaseType,
      };

      const success = await testConnection(connection);
      
      if (success) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to the database server",
        });
        onConnect(connection);
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: "Failed to connect to the database server. Please check your credentials.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "An error occurred while connecting to the database",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Update port when database type changes
  const onDatabaseTypeChange = (value: string) => {
    if (value === "mysql") {
      form.setValue("port", 3306);
    } else if (value === "postgresql") {
      form.setValue("port", 5432);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription>
          Connect to your database to visualize its relationships
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      onDatabaseTypeChange(value);
                    }}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of database you want to connect to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="localhost" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    The hostname or IP address of your database server
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    The port number your database server is listening on
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}