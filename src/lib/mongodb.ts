import { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
    // Only check and initialize when actually called (runtime)
    if (!process.env.MONGODB_URI) {
        throw new Error('Please add your MongoDB URI to environment variables');
    }

    if (clientPromise) {
        return clientPromise;
    }

    const uri = process.env.MONGODB_URI;
    const options = {};

    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };

        if (!globalWithMongo._mongoClientPromise) {
            const client = new MongoClient(uri, options);
            globalWithMongo._mongoClientPromise = client.connect();
        }
        clientPromise = globalWithMongo._mongoClientPromise;
    } else {
        // In production mode, it's best to not use a global variable.
        const client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }

    return clientPromise;
}

export default getClientPromise;
