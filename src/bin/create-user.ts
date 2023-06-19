import { getUserRepo } from "../server/repository/user";
import { isLeft } from "fp-ts/Either";
import { DEFAULT_PASSWORD } from "../server/repository/user/consts";
import { loadEnvConfig } from "@next/env";

async function createUser() {
    loadEnvConfig(process.cwd());

    const repo = await getUserRepo();

    if (isLeft(repo)) {
        throw new Error(repo.left);
    }

    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    readline.question(`What is the username?\n`, async (name: string) => {
        readline.close();

        const result = await repo.right.insert(name);

        if (isLeft(result)) {
            throw new Error(result.left);
        }

        console.log(
            `User account created with name ${name} and password ${DEFAULT_PASSWORD}`
        );
    });
}

createUser();
