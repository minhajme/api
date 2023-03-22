import { removeFile } from "node:fs/promises";
import { join } from "path";
import { settings } from "settings.mjs";
import { backup_file } from "utils_excel.mjs";
import { generate_apikey } from "utils_apikey.mjs";
import pkg from "crypto-js";
const { MD5 } = pkg;
import { createClient } from "redis";

const copy_object = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

const test_fail_handler = (msg) => {
    throw new Error(msg);
};
const test_settings = {
    pass_handler: (msg) => {
        console.log(msg);
    },
    fail_handler: test_fail_handler
};

export const generate_apikey = () => {
    return MD5(Date.now() + "salt" + Math.random()).toString();
};

/**
 * @param url {string} e.g. "/vr/apikey1/wmt/"
 * @return {array} with two elements [ <apikey>, <stock_symbols> ]
 */
function parse_apiurl(url) {
    const portions = url.replace('/vr/', '').replace(/^\/+|\/+$/g, '').split('/');
    return {
        apikey: portions[0],
        stocksymbols: portions[1]
    };
}

function apiurl() {
    return (settings.https? 'https':'http')+'://'
            +settings.apiurlhost+':'+settings.apiurlport +'/'+ 
            join(settings.apiurlprefix, 
            settings.current_apiconsumer_key, 
            settings.current_apiconsumer_stocksymbol);
}

/**
 * @param {function} callback run this function several times
 * @param {number|array} times run the callback how many times
 * @return array of callback run result if times is array, 
    callback runs over each array element
 */
function run_omuk_times(callback, times) {
	const elements = typeof times==='number'? Array(times) : times;
    const result = elements.map(a => callback(a));
    return typeof times==='number'? undefined : result;
}

/**
 * Start a unaffecting testable system by initializing a test database
 * @param {callable} seed you may do seeing inside the init, 
    or do it yourself after init
 * @returns {callable} a callback to close/end the test system
 * TODO note that our original settings object address is lost. 
 */
const init_test_system = async ({ seed }) => {
   const bkpath = await backup_file();
   const prev_settings = copy_object(settings);
   settings.EXCELFILEPATH = bkpath;
   if (seed) seed();
   return function close_test_system() {
        await removeFile(bkpath);
        settings = prev_settings;
        return true;
   };
};

/** * unit testing helper methods, on test fail they throw Error */

const assert_equal = (eta, ota, msg) => {
    msg = msg? msg : "assert fail";
    if (eta !== ota) throw new Error(msg);
};

const assert_truthy = (v, msg) => {
    if (!v) test_settings.fail_handler(msg);
};

const assert_true = (v, strict) => {
    const outcome = strict? v===true : v==true;
    if (!outcome) test_fail_handler("not true");
};

const assert_json = (text) => {
    JSON.parse(text);
};

const assert_notjson = (text) => {
    try {
        assert_json(text);
        test_fail_handler("notjson");
    } catch (e) {}
};

const assert_substring = (text, sub, msg) => {
    msg = msg? msg : "assert fail";
    if (!text.includes(sub)) test_fail_handler(msg);
};

const assert_redis_running = () => {
    const client = createClient();
    client.connect();
    if (!client.isReady) test_fail_handler("redis not ready");
};


export {
generate_apikey,
run_omuk_times,
generate_apikey,
parse_apiurl,
init_test_system,
assert_true,
assert_equal,
assert_json,
assert_substring,
}

//END
