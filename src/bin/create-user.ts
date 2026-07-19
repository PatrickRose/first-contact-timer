import { getUserRepo } from "@fc/server/repository/user";
import { isLeft } from "fp-ts/Either";
import { DEFAULT_PASSWORD } from "@fc/server/repository/user/consts";
import { closeClient } from "@fc/server/mongo";
import { loadEnvConfig } from "@next/env";

async function createUser() {
    loadEnvConfig(process.cwd());

    const repo = await getUserRepo();

    if (isLeft(repo)) {
        throw new Error(repo.left);
    }

    // Allowed for CLI interface
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    readline.question(`What is the username?\n`, async (name: string) => {
        readline.close();

        try {
            const result = await repo.right.insert(name);

            if (isLeft(result)) {
                throw new Error(result.left);
            }

            console.log(
                `User account created with name ${name} and password ${DEFAULT_PASSWORD}`,
            );
        } finally {
            // The shared Mongo pool keeps the event loop alive, so this
            // short-lived CLI would otherwise never exit. Closing the client is
            // safe here because nothing else in this process uses it.
            await closeClient();
        }
    });
}

createUser();
