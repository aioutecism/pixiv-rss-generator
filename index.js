const fs = require('fs');
const mkdirp = require('mkdirp');
const request = require('request');
const program = require('commander');

program
    .command('run <out-file>')
    .option('-s --session_id <session_id>', 'Session ID.')
    .option('-r --rank_type <rank_type>', 'Rank type: daily(Default), weekly, monthly, rookie, original, male, female')
    .option('-t --content_type <content_type>', 'Content type: all(Default), illust, manga, ugoira, novel')
    .option('-d --date <date>', 'YYYY-MM-DD; Default to today.')
    .option('-c --count <count>', 'Count to fetch; Default to 50.')
    .action((outFile, options) => {
        getEntries(options, (error, entries) => {
            if (error) {
                console.error(error);
                return;
            }

            save(entries, outFile);
        });
    });

const getHeaders = (options) => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
        'Origin': 'http://www.pixiv.net',
        'Referer': 'http://www.pixiv.net',
    };

    if (options && options.session_id) {
        headers['Cookie'] = `PHPSESSID=${options.session_id}`;
    }

    return headers;
};

const getOptions = (options) => {
    const now = new Date();

    const result = Object.assign({}, {
        rank_type: 'daily',
        content_type: 'all',
        date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
        count: 50,
    }, options);

    result.count = parseInt(result.count, 10);

    return result;
};

const getParamString = (params) => {
    let result = '';

    for (let k in params) {
        const key = encodeURIComponent(k);
        const value = encodeURIComponent(params[k]);
        result += `&${key}=${value}`;
    }

    return result.substr(1);
};

const extractEntries = (html) => {
    const pattern = /data-src="(.+?)".+?data-user-name="(.+?)".+?data-caption="(.+?)".+?data-permalink="(.+?)"/g;

    const entries = [];

    while (match = pattern.exec(html)) {
        let src = match[1];
        src = src.replace('400x400_80_a2', '540x540_70');
        src = src.replace('square1200', 'master1200');

        entries.push({
            src,
            userName: match[2],
            caption: match[3],
            link: match[4],
        });
    }

    return entries;
};

const getEntries = (options, callback) => {
    options = getOptions(options);

    const urlBase = `https://www.pixiv.net/rpc/whitecube/index.php`;
    const headers = getHeaders(options);

    once = (result, page, total) => {
        const paramString = getParamString({
            mode: 'ranking',
            rank_type: options.rank_type,
            content_type: options.content_type,
            date: options.date,
            page_x_restrict: 0,
            page,
        });

        request({
            url: `${urlBase}?${paramString}`,
            headers,
        }, ((error, response, body) => {
            if (error) {
                callback(error);
                return;
            }

            if (response.statusCode !== 200) {
                callback(new Error(`Request failed with status code: ${response.statusCode}\n${body}`));
                return;
            }

            const json = JSON.parse(body);
            const entries = extractEntries(json.body.html);

            result.push.apply(result, entries);

            total += entries.length;

            if (entries.length === 0 || (options.count !== 0 && total >= options.count)) {
                result.splice(options.count);
                callback(null, result);
                return;
            }

            once(result, page + 1, total);
        }));
    };

    once([], 1, 0);
};

const saveImage = (src, outFilePath, callback) => {
    const pathMatch = outFilePath.match(/^(.+)\//);
    if (pathMatch) {
        mkdirp.sync(pathMatch[1]);
    }

    const headers = getHeaders();

    const stream = request({
        url: src,
        headers
    }).pipe(fs.createWriteStream(outFilePath));

    if (callback) {
        stream.on('close', callback);
    }
};

const save = (entries, outFilePath) => {
    const outPathMath = outFilePath.match(/^(.+)\//);
    const outPath = outPathMath ? outPathMath[1] : './';

    let output = entries.map((entry, i) => {
        const imageFilePath = `${outPath}/images/` + entry.src.replace(/^.+\/img\/(.+)$/, '$1');
        saveImage(entry.src, imageFilePath);

        return `${entry.src}
${entry.caption}
${entry.userName}
${entry.link}`;
    });

    output = output.join('\n').trim();

    fs.writeFileSync(outFilePath, output);
};

program.parse(process.argv);
