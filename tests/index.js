import {set_cell_value, get_data_rows} from "../db_file.mjs";

await set_cell_value("A2", "newapikey1");
if ((await get_data_rows())[0].apikey != 'newapikey1') {
    console.error("set_cell_value failure");
}

// test required() function