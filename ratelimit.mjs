import {createClient} from "redis";

export const RateLimit = class {
    constructor(dbHelpers, apikey, allowed_rate_hr) {
        this.db = dbHelpers;
        this.apikey = apikey;
        this.allowed_rate_hr = allowed_rate_hr;
        this.use = {};
    }
    available() {
        const { current_hour_id } = this.db.current_time_info();
        const { use_count } = this.db.use_info(this.apikey, current_hour_id);
        const available_count = this.allowed_rate_hr - use_count?use_count:0;
        this.use[current_hour_id] = Array(available_count);
        return this.use[current_hour_id].length;
    }
    log() {
        const { current_hour_id } = this.db.current_time_info();
        this.use[current_hour_id].pop();
        this.db.save_use_info(this.apikey, current_hour_id, this.allowed_rate_hr - this.use[current_hour_id].length);
    }
};

export class RedisHelpers {
    constructor() {
        this.client = createClient();
        this.client.connect();
        this.client.on("error", err => {
            console.error("redis error ", err);
        });
    }
    current_time_info() {
        return {current_hour_id: Date.now()/(1000*3600)};
    }
    async use_info(apikey, hour_id) {
        const use_count = await this.client.get(`${apikey}:${hour_id}`);
        return {use_count};
    }
    async save_use_info(apikey, hour_id, use_count) {
        await this.client.set(`${apikey}:${hour_id}`, use_count);
    }
}