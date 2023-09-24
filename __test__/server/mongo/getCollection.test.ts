import { describe, expect, jest, test } from "@jest/globals";
import { getCollection } from "@fc/server/mongo";
import { Db } from "mongodb";

jest.mock("mongodb");

describe("getCollection", () => {
    test("is a wrapper around collection", async () => {
        const collection = jest.fn<Db["collection"]>();
        // @ts-ignore - creating all the types here is ott, so we just ignore the TS error
        getCollection({ collection }, "users");

        expect(collection).toHaveBeenCalledWith("users");
    });
});
