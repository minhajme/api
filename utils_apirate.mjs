// Bismillahir Rahmanir Rahim
import { settings } from "./settings.mjs";
import { get_currentconsumer_ratelimit } from "./utils_excel.mjs";
import { current_time_info } from "./utils_datetime.mjs";

export const RateLimit = class {
    constructor(dbHelpers) {
        this.db = settings.db;
        this.apikey = settings.request.apikey;
        this.allowed_rate_hr = undefined;
        this.allowed_rate_per_interval = get_currentconsumer_ratelimit();
        this.rate_interval_id_generator = () => {
            current_time_info().current_month_id;
        };
        this.use = {};
    }

    /**
     * TODO implement hourly rate
     */
    available() {
        const interval_id = this.rate_interval_id_generator();
        const { use_count } = this.db.use_info(this.apikey, interval_id);
        const available_count =
            this.allowed_rate_hr - use_count ? use_count : 0;
        this.use[interval_id] = Array(available_count);
        if (!this.use) this.use = {};
        return this.use[interval_id].length;
    }
    log() {
        const interval_id = this.rate_interval_id_generator();
        this.use[interval_id].pop();
        this.db.set_use_info(
            this.apikey,
            interval_id,
            this.allowed_rate_hr - this.use[interval_id].length
        );
    }
};

// Alhamdulillah
