// pretty-print-json ~ MIT License
/* https://github.com/center-key/pretty-print-json */

// edited to raw js and using a different stringify
// trailing commas were also removed


/**
 * @typedef {Object} FormatSettings
 * @property {number} indent - number of spaces for indentation
 * @property {boolean} lineNumbers - wrap HTML in an <ol> tag to support line numbers
 * @property {boolean} linkUrls - create anchor tags for URLs
 * @property {boolean} linksNewTab - add a target=_blank attribute setting to anchor tags
 * @property {boolean} quoteKeys - always double quote key names
 * @property {maxWidth} width - number of characters in a line
 */

/**
 * @typedef {Partial<FormatSettings>} FormatOptions
 */

/**
 * @typedef {'key' | 'string' | 'number' | 'boolean' | 'null' | 'mark'} JsonType
 */

const github_origin = "https://pjt727.github.io"
const window_name = window.location.origin == github_origin ? `${github_origin}/classy-api/` : window.location.origin
const routeLink = `${window.location.origin}?route=`

const prettyPrintJson = {
    /**
     * Converts an object or primitive into an HTML string suitable for rendering.
     * @param {unknown} data - The data to convert to HTML
     * @param {FormatOptions} [options] - Optional formatting settings
     * @returns {string} The HTML string representation
     */
    toHtml(data, options) {
        const defaults = {
            indent: 3,
            lineNumbers: false,
            linkUrls: true,
            linksNewTab: false,
            quoteKeys: false,
            maxLines: 80,
        };
        const settings = { ...defaults, ...options };
        const invalidHtml = /[<>&]|\\"/g;

        /**
         * Converts special characters to HTML entities
         * @param {string} char - The character to convert
         * @returns {string} The HTML entity
         */
        const toHtml = (char) =>
            char === '<' ? '&lt;' :
                char === '>' ? '&gt;' :
                    char === '&' ? '&amp;' :
                        '&bsol;&quot;'; // escaped quote: \"

        /**
         * Creates HTML to display a value
         * @param {JsonType} type - The type of JSON value
         * @param {string} [display] - The display text
         * @returns {string} The HTML span tag
         */
        const spanTag = (type, display) =>
            display ? '<span class=json-' + type + '>' + display + '</span>' : '';

        /**
         * Analyzes a value and returns HTML
         * @param {string} value - The value to analyze
         * @returns {string} The HTML representation
         */
        const buildValueHtml = (value) => {
            const strType = /^"/.test(value) && 'string';
            const boolType = ['true', 'false'].includes(value) && 'boolean';
            const nullType = value === 'null' && 'null';
            const type = boolType || nullType || strType || 'number';
            const urlPattern = /https?:\/\/[^\s"]+/g;
            const target = settings.linksNewTab ? ' target=_blank' : '';
            const makeLink = (link) => `<a class=json-link href="${link}"${target}>${link.startsWith(routeLink) ? link.slice(routeLink.length) : link}</a>`;
            const display = strType && settings.linkUrls ? value.replace(urlPattern, makeLink) : value;
            return spanTag(type, display);
        };

        /**
         * Converts the four parenthesized capture groups (indent, key, value, end) into HTML
         * @param {string} match - The matched string
         * @param {...string} parts - The captured groups
         * @returns {string} The HTML string
         */
        const replacer = (_, ...parts) => {
            const part = { indent: parts[0], key: parts[1], value: parts[2], end: parts[3] };
            const findName = settings.quoteKeys ? /(.*)(): / : /"([\w$]+)": |(.*): /;
            const indentHtml = part.indent || '';
            const keyName = part.key && part.key.replace(findName, '$1$2');
            const keyHtml = part.key ? spanTag('key', keyName) + spanTag('mark', ': ') : '';
            const valueHtml = part.value ? buildValueHtml(part.value) : '';
            const endHtml = spanTag('mark', part.end);
            return indentHtml + keyHtml + valueHtml + endHtml;
        };

        // Regex parses each line of the JSON string into four parts:
        //    Capture group       Part        Description                  Example
        //    ------------------  ----------  ---------------------------  --------------------
        //    ( *)                p1: indent  Spaces for indentation       '   '
        //    ("[^"]+": )         p2: key     Key name                     '"active": '
        //    ("[^"]*"|[\w.+-]*)  p3: value   Key value                    'true'
        //    ([{}[\],]*)         p4: end     Line termination characters  ','
        const jsonLine = /( *)("[^"]+": )?("[^"]*"|[\w.+-]*)?([{}[\],]*)?/mg;

        // changed for more compact JSON string
        // const json = JSON.stringify(data, null, settings.indent) || 'undefined';
        const json = beautify(data, null, settings.indent, settings.maxLines) || 'undefined';
        const html = json.replace(invalidHtml, toHtml).replace(jsonLine, replacer);

        /**
         * Wraps a line in an HTML li tag
         * @param {string} line - The line to wrap
         * @returns {string} The wrapped line
         */
        const makeLine = (line) => `   <li>${line}</li>`;

        /**
         * Wraps HTML in an ordered list tag
         * @param {string} html - The HTML to wrap
         * @returns {string} The wrapped HTML
         */
        const addLineNumbers = (html) =>
            ['<ol class=json-lines>', ...html.split('\n').map(makeLine), '</ol>'].join('\n');

        return settings.lineNumbers ? addLineNumbers(html) : html;
    },
};
