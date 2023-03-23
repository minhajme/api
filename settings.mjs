import { dirname, join as join_path } from "path";
import { fileURLToPath } from "url";
import { RedisForRateLimit as Redis } from "./utils_redis.mjs";
import env from "./env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const settings = {
    ENV: "local",
    GURU_API_KEY: env.guruapi_key,
    http_code: {
        success: 200,
        redirect: 302,
        apilimitexpire: 400,
    },
    EXCELFILEPATH: join_path(__dirname, "db.xlsx"),
    EXCELHEADER: ["apikey", "enabled", "rate"],
    BACKUPDESTDIR: join_path(__dirname, "bk"), // disable backuping by setting empty string

    db: new Redis(),

    http_code: {
        success: 200,
        redirect: 302,
        apilimitexpire: 400,
    },
    https: false,
    apiurlhost: env.apiurlhost,
    apiurlport: env.apiurlport,
    apiurlprefix: "vr",

    request: {
        apikey: undefined,
        stocksymbols: undefined,
    },
    currentconsumer: this.request, // just a mirror
};

export { settings };
