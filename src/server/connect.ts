import {MongoClient} from "mongodb";
import {Turn} from "../types/types";
import {backAPhase, backATurn, nextDate, pauseResume, tickTurn, toApiResponse} from "./turn";

type DBProps = {
    protocol?: string,
    credentials?: { user: string, password: string },
    dbURL: string,
    dbName: string,
    options?: string
}

function makeClient({protocol, credentials, dbURL, dbName, options}: DBProps): MongoClient {
    const parts: Array<string> = [];

    parts.push(protocol || 'mongodb');
    parts.push('://');

    if (credentials !== undefined) {
        parts.push(credentials.user, ':', credentials.password, '@');
    }

    parts.push(dbURL, '/', dbName);

    if (options !== undefined) {
        parts.push('?', options);
    }

    const uri = parts.join('');

    return new MongoClient(uri);
}

const STATIC_ID = 'watch-the-skies';

type Lock = {
    _id: 'watch-the-skies',
    active: boolean,
}

export default class MongoRepo {
    private readonly mongo: MongoClient;

    constructor(mongo: MongoClient) {
        this.mongo = mongo;
    }

    static MakeInstance(): MongoRepo {
        const dbURL = process.env.MONGO_URL || 'localhost';
        const dbName = process.env.MONGO_DB || 'wts';
        let credentials: undefined | { user: string, password: string };

        if (process.env.MONGO_USERNAME !== undefined && process.env.MONGO_PASSWORD !== undefined) {
            credentials = {
                user: process.env.MONGO_USERNAME,
                password: process.env.MONGO_PASSWORD
            };
        }

        const dbProps = {
            dbURL,
            dbName,
            credentials,
            options: process.env.MONGO_OPTIONS,
            protocol: process.env.MONGO_PROTOCOL
        };

        return new MongoRepo(makeClient(dbProps));
    }

    async getCurrentTurn(): Promise<Turn> {
        try {
            const turnCollection = await this.getCollection();

            const cursor = turnCollection.find({_id: STATIC_ID});

            const turn = await cursor.next();

            if (turn === null) {
                const defaultTurn: Turn = {
                    _id: STATIC_ID,
                    active: false,
                    phase: 1,
                    turnNumber: 1,
                    phaseEnd: nextDate(1).toString(),
                    breakingNews: null,
                    frozenTurn: null,
                };
                defaultTurn.frozenTurn = toApiResponse(defaultTurn, true);
                await turnCollection.insertOne(defaultTurn);

                return defaultTurn;
            }

            return turn;
        } finally {
            await this.mongo.close()
        }
    }

    private async getCollection() {
        await this.mongo.connect();

        const database = this.mongo.db();

        return database.collection<Turn>("turns");
    }

    async setBreakingNews(newBreakingNews: string): Promise<Turn> {
        try {
            const turn = await this.getCurrentTurn();

            const breakingNews = newBreakingNews === ''
                ? null
                : newBreakingNews

            const collection = await this.getCollection();

            await collection.updateOne(
                {_id: STATIC_ID},
                {$set: {breakingNews}}
            );

            return {
                ...turn,
                breakingNews
            }
        } finally {
            await this.mongo.close()
        }
    }

    async nextTurn(): Promise<Turn> {
        let lockResult = null;
        let lock = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            const newTurn = tickTurn(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }
            await this.mongo.close();
        }
    }

    async pauseResume(active: boolean): Promise<Turn> {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            const newTurn = pauseResume(turn, active);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async backTurn(): Promise<Turn> {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            const newTurn = backATurn(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async backPhase(): Promise<Turn> {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            const newTurn = backAPhase(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async forwardPhase(): Promise<Turn> {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            const newTurn = tickTurn(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async forwardTurn(): Promise<Turn> {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();
            const turnNumber = turn.turnNumber;

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return turn;
            }

            let newTurn = tickTurn(turn);

            while (newTurn.turnNumber == turnNumber) {
                newTurn = tickTurn(newTurn);
            }

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }
}
