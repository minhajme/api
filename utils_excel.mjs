import { dirname, join as join_path } from "path";
import { fileURLToPath } from "url";
import { open, copyFile } from "node:fs/promises";
import { existsSync } from "fs";
import { utils, read, write } from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SETTINGS = {
    EXCELFILEPATH: join_path(__dirname, "db.xlsx"),
    EXCELHEADER: ["apikey", "enabled", "rate"],
    BACKUPDESTDIR: join_path(__dirname, "bk"), // disable backuping by setting empty string
};

/**
 *
 * @param {string} cellname e.g. A1, B1, A12 etc
 * @throws Error on invalid
 * @todo known limitation: two character column names like AB1, AB12 are not supported
 */
const validate_cellname = (cellname) => {
    if (cellname.length < 2)
        throw new Error("cellname length must be minimum two char");
    const first_char_code = cellname.slice(0, 1).charCodeAt();
    const second_char_int = parseInt(cellname.slice(1));
    if (first_char_code <= 65 && first_char_code >= 90)
        throw new Error("cellname first char must be A-Z");
    if (!second_char_int || second_char_int in [0, 1])
        throw new Error(
            "column 0 invalid for cellname, column 1 is reserved for header"
        );
};

const cellname_to_dataarrayindex = (cellname) => {
    const col = cellname.slice(0).charCodeAt() - 65;
    const row = parseInt(cellname.slice(-1)) - 1;
    return { row, col };
};

const backup_file = async () => {
    if (SETTINGS.BACKUPDESTDIR)
        return await copyFile(
            SETTINGS.EXCELFILEPATH,
            join_path(SETTINGS.BACKUPDESTDIR, "db.bk-" + Date.now() + ".xlsx")
        );
};

/**
 *
 * @param {String} cellname
 * @param {String|Array} value array if opts.append=true
 * @param {object} opts opts.origin
 */
export const set_cell_value = async (cellname, value, opts) => {
    if (!opts) opts = { append: false };
    if (!opts.append) validate_cellname(cellname);
    const controller = new AbortController();
    const { signal } = controller;
    let fdr, fdw;
    try {
        backup_file();
        fdr = await open(SETTINGS.EXCELFILEPATH, "r");
        const rb = await fdr.readFile({ signal });
        const workbook = read(rb);
        const first_worksheet = workbook.Sheets[workbook.SheetNames[0]];
        utils.sheet_add_aoa(
            first_worksheet,
            opts.append ? [value] : [[value]],
            { origin: opts.append ? -1 : cellname }
        );
        const wb = write(workbook, { bookType: "xlsx", type: "buffer" });
        await fdr.close();
        fdr = null;

        fdw = await open(SETTINGS.EXCELFILEPATH, "w");
        await fdw.writeFile(wb);
        await fdw.close();
        fdw = null;
    } catch (err) {
        throw new Error(err);
    } finally {
        if (fdr) fdr.close();
        if (fdw) fdw.close();
    }
};

/**
 * @deprecated
 * @param {string} cellname uppercase, 2 digit string, representing cell name e.g., A1, B1 etc
 * @todo inefficient. Takes whole sheet content at first then locates the cell content.
 */
export const get_cell_value = (cellname) => {
    validate_cellname(cellname);
    const { datarow_index, datacol_index } = cellname_to_dataarrayindex();
    return get_data_rows(datarow_index, 1)[0][datacol_index];
};

/**
 *
 * @param {number} start first row index, zero based, e.g., 0, 1, 2, 3 etc
 * @param {number} number_of_rows
 * @returns {Array}
 */
export const get_data_rows = async (start, number_of_rows) => {
    start = start ? start : 0;
    const controller = new AbortController();
    const { signal } = controller;
    const fd = await open(SETTINGS.EXCELFILEPATH, "r");
    let rb;
    try {
        rb = await fd.readFile({ signal });
    } catch (err) {
    } finally {
        await fd.close();
    }
    const workbook = read(rb);
    const first_worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const arr = utils.sheet_to_json(first_worksheet, {
        header: SETTINGS.EXCELHEADER,
        range: 1,
        defval: "",
    });
    number_of_rows = number_of_rows ? number_of_rows : arr.length;
    return arr.slice(start, start + number_of_rows);
};

export const get_currentconsumer_ratelimit = () => {
    return get_data_rows().filter(
        (row) => row.apikey === settings.request.apikey
    ).rate;
};
