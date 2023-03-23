// bismillahir rahmanir rahim
import { createClient } from "redis";
import { settings } from "./settings.mjs";

export class RedisForRateLimit {
    constructor() {
        this.client = createClient();
    }
    async connect() {
        await this.client.connect();
        this.client.on("error", (err) => {
            console.error("redis error ", err);
        });
    }
    is_connected() {
        return this.client.isReady;
    }
    async use_info(id) {
        const use_count = await this.client.get(
            `${settings.request.apikey}:${id}`
        );
        return { use_count };
    }
    async set_use_info(id, use_count) {
        await this.client.set(`${settings.request.apikey}:${id}`, use_count);
    }
}
