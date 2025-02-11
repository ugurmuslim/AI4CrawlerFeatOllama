import {QdrantClient} from '@qdrant/js-client-rest';
import {ensureCollection} from "../db/qdrant";
import QdrantSingleton from "../db/QdrantSingleton";
import AppDataSource from '../db/AppDataSource';
import {CrawledPageEntity} from "../db/entity/crawledPage.entity";
import {Repository} from "typeorm";

// Assuming AppDataSource is your DataSource instance
const crawledPageRepository: Repository<CrawledPageEntity> = AppDataSource.getRepository(CrawledPageEntity);

interface Message {
    role: 'user' | 'assistant';
    content: string;
}
const conversationHistory: Message[] = [];
export const crawl = async (url: string): Promise<void> => {
    try {
        const now = new Date();
        const crawledPage = await crawledPageRepository.findOne({
            where: {page: url, updated_at: now},
        });
        console.log(crawledPage)
        if (crawledPage) {
            console.log("URL already crawled:", url);
            return;
        }

        console.log("Crawling data from:", url);
        const taskId = await startTask(url);
        console.log(`Task started with ID: ${taskId}`);
        // Poll the status of the task every 5 seconds
        let status = "pending";
        let taskResponse: any = {};
        while (status === "pending") {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            console.log(`Getting crawled Data from task with ID: ${taskId}`);
            taskResponse = await retrieveTask(taskId);
            console.log("Task response:", taskResponse);
            status = taskResponse.status;
        }

        if (status !== "completed") {
            console.log("Task failed with status:", taskResponse.status);
            return
        }


        await ensureCollection()
        const point = await createVector(taskResponse.result.markdown, [taskResponse.result.url]);

        const qdrant = QdrantSingleton.getInstance();

        await qdrant.upsert("crawled_data", {points: [point]});
        crawledPageRepository.upsert({page: url, updated_at: now}, ['page']);
        for (const link of taskResponse.result.links.internal) {
            console.log("Crawling  sub-link:", link.href);
            await crawl(link.href);
        }

        console.log("Data inserted into Qdrant");
    } catch (error) {
        console.error("An error occurred while crawling:", error);
    }
}


const startTask = async (url: string): Promise<string> => {
    const body = {
        "urls": url,
        "config": {
            "remove_overlay_elements": true,
            "process_iframes": true
        }
    }

    const response = await fetch("http://localhost:11235/crawl", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer secret"

        }
    })

    const data = await response.json();

    return data.task_id;
}

const retrieveTask = async (taskId: string): Promise<any> => {
    const response = await fetch(`http://localhost:11235/task/${taskId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer secret"

        }
    })

    return await response.json();
}

const createVector = async (text: string, metaData: string[]): Promise<any> => {
    const embedding = await embedText(text);

    const point = {
        id: Date.now(),
        vector: embedding,
        payload: {text, ...metaData},
    };

    return point;
}

const embedText = async (text: string): Promise<any> => {
    const response = await fetch("http://localhost:11434/api/embeddings", {
        method: "POST",
        body: JSON.stringify({
            model: "nomic-embed-text",
            prompt: text,
        })
    });

    const ollamaResponse =  await response.json();

    return ollamaResponse.embedding;
}


export const getResultFromOllama = async (query: string): Promise<any> => {
    conversationHistory.push({ role: 'user', content: query });

    const embedding = await embedText(query);

    const qdrant = QdrantSingleton.getInstance();

    const searchResults = await qdrant.search(
        "patbo",
        {vector: embedding, limit: 10}
)
    console.log("embedding", embedding)
    console.log("Search results from Qdrant:", searchResults);
    const context = searchResults.map(result => result.payload?.content).join('\n');

    const prompt = `
        Context:
        ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Search Results:
        ${searchResults.map(result => result.payload?.content).join('\n')}
        
        Question: ${query}
        Answer:`;

    console.log("Prompt to Ollama:", prompt);
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama3.2:3b",
            prompt: prompt,
        })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader?.read()!;
        done = doneReading;
        if (value) {
            const chunk = decoder.decode(value, { stream: true });
            // Assuming each chunk is a complete JSON object
            try {
                const jsonObject = JSON.parse(chunk);
                if (jsonObject.response) {
                    result += jsonObject.response;
                }
            } catch (e) {
                console.error("Error parsing JSON chunk:", e);
            }
        }
    }
    conversationHistory.push({ role: 'assistant', content: result.trim() });
    console.log("Complete response from Ollama:", result);


    return 1;
}