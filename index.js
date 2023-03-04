import { createServer } from "http";
import { readFileSync } from "fs";
import { SETTINGS, set_cell_value, get_data_rows } from "./db_file.mjs";
import { generate_apikey } from "./utils_apikey.mjs";

const server = createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", req.headers["origin"]);
        res.setHeader("Access-Control-Allow-Headers", 'access-control-allow-origin');
        res.setHeader("Vary", "origin");
        res.statusCode = 200;
    if (req.url === '/db' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        const buffer = readFileSync(SETTINGS.EXCELFILEPATH, {});
        res.end(buffer);
    } else if (req.url === '/db' && req.method === 'POST') {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => {
            const [cellname, value] = JSON.parse(Buffer.concat(chunks).toString());
            set_cell_value(cellname, value);
        });
        res.end("evet");
    } else if (req.url === '/_utils/apikey/generate' && req.method === 'GET') {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify([generate_apikey(), 0, 1]));
    } else if (req.url === '/db/apikey/new' && req.method === 'POST') {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", async () => {
            const [key, enabled, rate_hr] = JSON.parse(Buffer.concat(chunks).toString());
            await set_cell_value(null, [key, enabled.toString(), rate_hr.toString()], {append: true});
        });
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        res.end('evet');
    } else {
        res.statusCode = 404;
        res.end("hayir");
    }
});
server.listen(3001, "", () => {
    console.log("node server running");
});