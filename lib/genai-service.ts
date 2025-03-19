"use server"

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { getTables } from "./db-service";
// if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY environment variable is not set.");
// }
// import OpenAI from "openai";

// const openai = new OpenAI({
//     apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
//     baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
// });


// export async function genereateAIResponse(question: string, databaseConnection: any, selectedDatabase: string) {
//     console.log("Database Connection: ", databaseConnection);
//     const tables = await getTables(databaseConnection, selectedDatabase);
//     console.log("Tables: ", tables);
//     const systemPrompt = `You are DatabaseGPT, an expert RDBMS assistant specializing in database schema design, SQL queries, and database optimization.

//     Your capabilities:
//     - Write precise SQL queries for the user's specific database structure
//     - Explain complex database concepts in simple terms
//     - Suggest database optimizations and best practices
//     - Help troubleshoot SQL errors and performance issues
//     - Design database schemas for various use cases

//     When presented with a question or request:
//     1. If it's a request for SQL, generate proper SQL syntax following best practices
//     2. If it's a request for database design advice, suggest normalized structures
//     3. If it's a query troubleshooting request, carefully explain potential issues
//     4. Always explain your SQL or suggestions so the user can learn

//     Current database information:
//     Database Name: ${selectedDatabase}
//     Database Type: ${databaseConnection.type}

//     SCHEMA:
//     ${tables}

//     IMPORTANT GUIDELINES:
//     - Write SQL compatible with ${databaseConnection.type} dialect
//     - Include comments in complex SQL queries
//     - Use proper SQL formatting with keywords in UPPERCASE
//     - Always consider performance implications in your suggestions
//     - Explain JOIN operations clearly when used in queries
//     - If generating data manipulation queries (INSERT, UPDATE, DELETE), remind about potential data integrity impacts
//     - For complex queries, break down explanations step by step`;


//     const response = await openai.chat.completions.create({
//         model: "gemini-2.0-flash",
//         messages: [
//             { role: "system", content: systemPrompt },
//             { role: "user", content: question }
//         ],
//     });
//     return response.choices[0].message.content;

// }


import Groq from "groq-sdk";
import { getTables } from "./db-service";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API });

type Message = { role: string; content: string; }

export async function genereateAIResponse(question: string, databaseConnection: any, selectedDatabase: string, oldMessages: Message[] = []) {
    const tables = await getTables(databaseConnection, selectedDatabase);
    const systemPrompt = `You are DatabaseGPT, an expert RDBMS assistant specializing in database schema design, SQL queries, and database optimization.

    //     Your capabilities:
    //     - Write precise SQL queries for the user's specific database structure
    //     - Explain complex database concepts in simple terms
    //     - Suggest database optimizations and best practices
    //     - Help troubleshoot SQL errors and performance issues
    //     - Design database schemas for various use cases

    //     When presented with a question or request:
    //     1. If it's a request for SQL, generate proper SQL syntax following best practices
    //     2. If it's a request for database design advice, suggest normalized structures
    //     3. If it's a query troubleshooting request, carefully explain potential issues
    //     4. Always explain your SQL or suggestions so the user can learn

    //     Current database information:
    //     Database Name: ${selectedDatabase}
    //     Database Type: ${databaseConnection.type}

    //     SCHEMA:
    //     ${tables}

    //     IMPORTANT GUIDELINES:
    //     - Write SQL compatible with ${databaseConnection.type} dialect
    //     - Include comments in complex SQL queries
    //     - Use proper SQL formatting with keywords in UPPERCASE
    //     - Always consider performance implications in your suggestions
    //     - Explain JOIN operations clearly when used in queries
    //     - If generating data manipulation queries (INSERT, UPDATE, DELETE), remind about potential data integrity impacts
    //     - For complex queries, break down explanations step by step`;

    // Create a messages array
    const messages = [
        { role: "system", content: systemPrompt }
    ];

    // Add previous messages
    oldMessages.forEach(msg => {
        messages.push({
            role: msg.role as "system" | "user" | "assistant" | "tool",
            content: msg.content
        });
    });

    // Add the current question
    messages.push({ role: "user", content: question });

    const completion = await groq.chat.completions
        .create({
            //@ts-ignore
            messages: messages,
            model: "llama-3.3-70b-versatile",
        })

    console.log(completion.choices[0].message.content);
    return {
        role: "assistant",
        content: completion.choices[0].message.content,
        id: Date.now().toString(),
    }
}
