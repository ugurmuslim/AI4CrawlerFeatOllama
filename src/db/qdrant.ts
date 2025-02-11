import { QdrantClient } from '@qdrant/js-client-rest';
import exp from "node:constants";
import QdrantSingleton from "./QdrantSingleton";

const ensureCollection = async () => {
    const COLLECTION_NAME = "crawled_data";

    const qdrant =  QdrantSingleton.getInstance();

    try {
        await qdrant.getCollection(COLLECTION_NAME);
        console.log(`✅ Collection "${COLLECTION_NAME}" exists.`);
    } catch (error) {
        console.log(`⚠️ Collection "${COLLECTION_NAME}" not found. Creating...`);
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: { size: 768, distance: "Cosine" }, // Adjust size based on embedding model
        });
    }
};

export { ensureCollection };