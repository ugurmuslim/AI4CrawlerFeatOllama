import express, { Request, Response } from "express";
import {crawl, getResultFromOllama} from "./ai/crawler";
import 'reflect-metadata';
import AppDataSource from './db/AppDataSource';

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());
AppDataSource.connect()
// Define the `/init-rag` route
app.post("/init-rag", async (req: Request, res: Response): Promise<void> => {
    try {
        const { url } = req.body;

        if (!url) {
            res.status(400).json({ error: "Missing 'data' in request body" });
            return; // Ensure function exits
        }

        console.log("Initializing RAG with data:", url);

        // Perform RAG initialization,
        crawl(url);

        res.json({ message: "RAG initialized successfully", receivedData: url });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error });
    }
});

app.post("/talk-to-ai", async (req: Request, res: Response): Promise<void> => {
    try {
        const { text } = req.body;

        if (!text) {
            res.status(400).json({ error: "Missing 'data' in request body" });
            return; // Ensure function exits
        }

        console.log("Initializing RAG with data:", text);

        // Perform RAG initialization,
        await getResultFromOllama(text);

        res.json({ message: "RAG initialized successfully", receivedData: text });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
