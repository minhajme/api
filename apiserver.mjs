const http = require("http");
const https = require("https");
import { settings } from "./settings.mjs";
import { RateLimit } from "./utils_apirate.mjs";
import { get_data_rows } from "./utils_excel.mjs";
import { assert_truthy, assert_redis_running } from "./utils.mjs";

const server = http.createServer((request, response) => {
    const required_opts = { response };
    if (request.url === "/favicon.ico") {
        response.writeHead(200, { "Content-Type": "image/x-icon" });
        return response.end("BaselineLab.ico");
    }

    if (!request.url.includes(settings.apiurlprefix)) {
        response.writeHead(302, { Location: "https://www.deltavalue.de/" });
        return response.end();
    }

    const [client_apikey, stocksymbols] = request.url
        .replace("/vr/", "")
        .replace(/^\/+|\/+$/g, "")
        .split("/");
    const { rate } = get_data_rows().filter(
        (row) => row.apikey === client_apikey
    );
    assert_truthy(stock_symbols, "stock symbol required");
    assert_truthy(client_api_key, "client api key required");
    assert_truthy(rate_hr, "rate limit value required");

    settings.request.apikey = client_apikey;
    settings.request.stocksymbols = stocksymbols;

    assert_redis_running();
    const limiter_monthly = new RateLimit();
    assert_truthy(
        limiter_monthly.available(),
        `apilimitexpire: rate per hr limit ${rate} exceeded!`
    );

    https
        .get(
            "https://api.gurufocus.com/public/user/" +
                settings["GURU_API_KEY"] +
                "/stock/" +
                settings.request.stocksymbols +
                "/financials",
            (res) => {
                limiter.log();
                let data = [];
                res.on("data", (chunk) => {
                    data.push(chunk);
                });
                res.on("end", () => {
                    response.statusCode = settings.http_code.success;
                    response.setHeader("Content-Type", "application/json");
                    const data = Buffer.concat(data).toString();
                    assert_json(data, "guruapidatanotjson");
                    return response.end(Buffer.concat(data).toString());
                });
            }
        )
        .on("error", (err) => {
            console.log("Error: ", err.message);
        });
});

server.listen(settings.apiurlport, settings.apiurlhost, () => {
    console.log(
        `Server running at http://${settings.apiurlhost}:${settings.apiurlport}/`
    );
});
