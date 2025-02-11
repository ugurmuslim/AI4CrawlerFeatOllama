import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantSingleton {
    private static instance: QdrantClient;

    private constructor() {}

    public static getInstance(): QdrantClient {
        if (!QdrantSingleton.instance) {
            QdrantSingleton.instance = new QdrantClient({ url: 'http://localhost:6333' });
        }
        return QdrantSingleton.instance;
    }
}

export default QdrantSingleton;