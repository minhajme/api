export const required = (variable, opts) => {
    if (!variable) {
        opts.response.statusCode = 200;
        opts.response.setHeader('Content-Type', 'text/html');
        return opts.response.end('required');
    }
};
