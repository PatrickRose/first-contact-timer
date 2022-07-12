import {MongoClient} from "mongodb";
import {BreakingNewsKey, ControlAction, Turn} from "../types/types";
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

const STATIC_ID = 'faes-anatomy';

type Lock = {
    _id: typeof STATIC_ID,
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
                    phaseEnd: nextDate(1, 1).toString(),
                    breakingNews: {
                        1: null,
                        2: null,
                        3: null,
                    },
                    frozenTurn: null,
                };
                defaultTurn.frozenTurn = toApiResponse(defaultTurn, true);
                await turnCollection.insertOne(defaultTurn);
                const database = this.mongo.db();

                const lock = database.collection<Lock>("lock");
                try {
                    await lock.insertOne({_id: STATIC_ID, active: false});
                } catch (e) {
                    // ignore the lock error
                }

                return defaultTurn;
            }

            return turn;
        } catch (e) {
            console.log(e);
            throw e;
        } finally {
            await this.mongo.close()
        }
    }

    private async getCollection() {
        await this.mongo.connect();

        const database = this.mongo.db();

        return database.collection<Turn>("turns");
    }

    async setBreakingNews(newBreakingNews: string | null, number: BreakingNewsKey): Promise<Turn> {
        try {
            await this.getCurrentTurn();

            const breakingNews = newBreakingNews === ''
                ? null
                : newBreakingNews

            const collection = await this.getCollection();

            const key: `${keyof Turn}.${BreakingNewsKey}` = `breakingNews.${number}`;
            const toSet: { [k1 in typeof key]?: string | null } = {};
            toSet[key] = breakingNews;

            await collection.updateOne(
                {_id: STATIC_ID},
                {$set: toSet}
            );

            await this.mongo.close();

            return this.getCurrentTurn();
        } finally {
            await this.mongo.close()
        }
    }

    async nextTurn(current: Turn): Promise<Turn> {
        let lockResult = null;
        let lock = null;

        try {
            const database = this.mongo.db();
            await this.mongo.connect();

            lock = database.collection<Lock>("lock");

            try {
                lockResult = await lock.updateOne({ _id: STATIC_ID, active: false }, { $set: { active: true } });
            } catch (e) {
                console.log('Failed to get lock');
                console.log(e);
                throw e;
            }

            if (lockResult.matchedCount != 1) {
                return current;
            }

            const turn = await this.getCurrentTurn();

            if (turn.phase != current.phase || turn.turnNumber != current.turnNumber) {
                // Then the turn has already been ticked - don't do it again
                return turn;
            }

            const newTurn = tickTurn(turn);

            try {
                // Reconnect - we'll have disconnected when we got the turn
                await this.mongo.connect()
                const collection = await this.getCollection();
                await collection.updateOne({ _id: STATIC_ID }, { $set: newTurn });
            } catch (e) {
                console.log('Failed to update turn')
                console.log(e);
                throw e;
            }

            return newTurn;
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }
            await this.mongo.close();
        }
    }

    async pauseResume(active: boolean): ControlAction {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return {_tag: "Left", left: "Did not manage to lock"};
            }

            const newTurn = pauseResume(turn, active);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return {_tag: "Right", right: newTurn};
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async backTurn(): ControlAction {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return {_tag: "Left", left: "Did not manage to lock"};
            }

            const newTurn = backATurn(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return {_tag: "Right", right: newTurn};
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async backPhase(): ControlAction {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return {_tag: "Left", left: "Did not manage to lock"};
            }

            const newTurn = backAPhase(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return {_tag: "Right", right: newTurn};
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async forwardPhase(): ControlAction {
        let lock = null;
        let lockResult = null;

        try {
            const turn = await this.getCurrentTurn();
            const collection = await this.getCollection();

            const database = this.mongo.db();

            lock = database.collection<Lock>("lock");

            lockResult = await lock.updateOne({_id: STATIC_ID, active: false}, {$set: {active: true}});

            if (lockResult.matchedCount != 1) {
                return {_tag: "Left", left: "Did not manage to lock"};
            }

            const newTurn = tickTurn(turn);

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return {_tag: "Right", right: newTurn};
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }

    async forwardTurn(): ControlAction {
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
                return {_tag: "Left", left: "Did not manage to lock"};
            }

            let newTurn = tickTurn(turn);

            while (newTurn.turnNumber == turnNumber) {
                newTurn = tickTurn(newTurn);
            }

            await collection.updateOne({_id: STATIC_ID}, {$set: newTurn});

            return {_tag: "Right", right: newTurn};
        } finally {
            if (lockResult?.matchedCount == 1) {
                await lock?.updateOne({_id: STATIC_ID, active: true}, {$set: {active: false}});
            }

            await this.mongo.close();
        }
    }
}
