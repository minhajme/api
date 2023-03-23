//Bismillahir Rahmanir Rahim
import { test, expect } from "@playwright/test";
import { set_cell_value, get_data_rows, backup_file } from "./utils_excel.mjs";
import { required } from "./utils_validation.mjs";
import { RateLimit } from "./ratelimit.mjs";
import { RedisForRateLimit as Redis } from "./utils_redis.mjs";
import {
    run_omuk_times,
    generate_apikey,
    parse_api_url,
    init_test_system,
    assert_true,
    assert_equal,
    assert_json,
    assert_substring,
} from "./utils.mjs";

const test_set_cell_value = async () => {
    await set_cell_value("A2", "newapikey1");
    assert_equal(
        (await get_data_rows())[0].apikey,
        "newapikey1",
        "apikeynotset"
    );
};

const test_required = () => {
    const dummy_resp = {
        statusCode: 200,
        setHeader: () => {},
        end: (msg) => {
            return msg;
        },
    };
    const msg1 = required(null, { response: dummy_resp });
    const msg2 = required(1, { response: dummy_resp });
    assert_equal(msg1, "required");
    assert_true(msg2);
};

const test_urlparse_for_apikey = () => {
    const { apikey, stocksymbols } = parse_api_url("/vr/apikey1/wmt/");
    assert_equal(apikey, "apikey1");
    assert_equal(stocksymbols, "wmt");
};

const test_ratelimit_class = () => {
    const db = new Redis();
    const apikey = "testapikey";
    const rate = 6;
    const limiter = new RateLimit(db, { apikey, rate });
    run_omuk_times(() => {
        limiter.log();
    }, hourly_rate - 1);
    assert_equal(limiter.available(), 1);
    limiter.log();
    assert_equal(limiter.available(), 0);
};

const test_ratelimit_real = async () => {
    const close_test_system = await init_test_system({
        seed: () =>
            set_cell_value("A2", ["testapikey1", "1", "6"], { append: true }),
    });
    const [apikey, enabled, rate] = run_omuk_times(
        (cellname) => get_cell_value(cellname),
        ["A2", "B2", "C2"]
    );
    settings.request.apikey = apikey;
    settings.request.stocksymbols = "WMT";
    const url = apiurl();
    run_omuk_times(() => {
        test("", async (page) => {
            await page.goto(url);
            assert_equal(
                page.waitForResponse((resp) => resp.url === url).status(),
                apisettings.http_code.succeed
            );
            assert_json(await page.content());
        });
    }, rate);
    run_omuk_times(
        test("", async (page) => {
            await page.goto(url);
            assert_notjson(await page.content());
            expect(page).toHaveText("apilimitexpire");
        }),
        1
    );
    await close_test_system();
};

const test_apiserver_urlvr_requirement = async () => {
    const close_test_system = init_test_system({
        seed: () => {
            const apikey = generate_apikey();
            set_cell_value("A2", [apikey, "1", "6"], { append: true });
            settings.request.apikey = apikey;
        },
    });
    const url = apiurl();
    test("", async (page) => {
        await page.goto(url);
        assert_equal(
            page.waitForResponse((resp) => resp.url === url).status(),
            apisettings.http_code.redirect
        );
        expect(page).toHaveUrl("deltavalue.de");
    });
    close_test_system();
};

const test_server_is_returning_findata_properly = () => {
    const close_test_system = init_test_system({
        seed: () => {
            const apikey = generate_apikey();
            set_cell_value("A2", apikey);
            settings.request.apikey = apikey;
        },
    });
    const url = apiurl();
    test("", async (page) => {
        await page.goto(url);
        assert_equal(
            page.waitForResponse((resp) => resp.url === url).status(),
            apisettings.http_code.success
        );
        assert_json(page.content());
    });
    close_test_system();
};

export {
    test_set_cell_value,
    test_required,
    test_urlparse_for_apikey,
    test_ratelimit_class,
    test_ratelimit_real,
    test_apiserver_urlvr_requirement,
    test_server_is_returning_findata_properly,
};

// Alhamdulillah
