import pkg from "crypto-js";
const { MD5 } = pkg;

export const generate_apikey = () => {
    return MD5(Date.now() + "salt" + Math.random()).toString();
};