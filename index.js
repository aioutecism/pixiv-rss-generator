const fs = require('fs');
const request = require('request');
const program = require('commander');
const RSS = require('rss');
const util = require('./util');

program
    .command('run <out-file>')
    .option('-s --session_id <session_id>', 'Session ID.')
    .option('-r --rank_type <rank_type>', 'Rank type: daily(Default), weekly, monthly, rookie, original, male, female')
    .option('-t --content_type <content_type>', 'Content type: all(Default), illust, manga, ugoira, novel')
    .option('-x --with_r18', 'With R18 content; Default off.')
    .option('-d --date <date>', 'YYYY-MM-DD; Default to today.')
    .option('-c --count <count>', 'Count to fetch; Default to 50.')
    .option('--title <title>', 'Define title of generated RSS feed; Default is "Pixiv RSS".')
    .option('--image_src_prefix <image_src_prefix>', 'Prefix for image src; Default is empty.')
    .action((outFile, options) => {
        options = regularizeOptions(options);

        getEntries(options, (error, entries) => {
            if (error) {
                console.error(error);
                return;
            }

            save(entries, outFile, options);
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

const regularizeOptions = (options) => {
    const now = new Date();

    const result = Object.assign({}, {
        rank_type: 'daily',
        content_type: 'all',
        with_r18: false,
        date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
        count: 50,
        title: 'Pixiv RSS',
        image_src_prefix: '',
    }, options);

    result.count = parseInt(result.count, 10);

    return result;
};

const extractEntries = (html) => {
    const pattern = /data-entry-id="(.+?)".+?data-src="(.+?)".+?data-user-name="(.+?)".+?data-caption="(.+?)".+?data-permalink="(.+?)"/g;

    const entries = [];

    while (match = pattern.exec(html)) {
        let src = match[2].replace(/&amp;/g, '&');
        src = src.replace('400x400_80_a2', '540x540_70');
        src = src.replace('square1200', 'master1200');

        const dateMatch = src.match(/\/img\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\//);

        entries.push({
            id: match[1],
            src,
            userName: match[3],
            caption: match[4],
            link: match[5].replace(/&amp;/g, '&'),
            date: new Date(
                parseInt(dateMatch[1], 10),
                parseInt(dateMatch[2], 10) - 1,
                parseInt(dateMatch[3], 10),
                parseInt(dateMatch[4], 10),
                parseInt(dateMatch[5], 10),
                parseInt(dateMatch[6], 10)
            ),
        });
    }

    return entries;
};

const getEntries = (options, callback) => {
    const urlBase = `https://www.pixiv.net/rpc/whitecube/index.php`;
    const headers = getHeaders(options);

    once = (result, page, total) => {
        const paramString = util.getParamString({
            mode: 'ranking',
            rank_type: options.rank_type,
            content_type: options.content_type,
            date: options.date,
            page_x_restrict: options.with_r18 ? 1 : 0,
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

const save = (entries, outFilePath, options) => {
    const outPathMath = outFilePath.match(/^(.+)\//);
    const outPath = outPathMath ? outPathMath[1] : './';

    const feed = new RSS({
        title: options.title,
        site_url: 'http://pixiv.net',
        image_url: 'http://www.pixiv.net/favicon.ico',
        language: 'jp',
        pubDate: new Date(),
    });

    const headers = getHeaders();

    entries.forEach((entry, i) => {
        const imageFilePath = `images/` + entry.src.replace(/^.+\/img\/(.+)$/, '$1');
        util.downloadImage(entry.src, headers, `${outPath}/${imageFilePath}`);

        feed.item({
            guid: entry.id,
            title: entry.caption,
            description: `<img src="${options.image_src_prefix}${imageFilePath}" /><br /><br />${entry.caption} by ${entry.userName}`,
            url: entry.link,
            author: entry.userName,
            date: entry.date
        });
    });

    fs.writeFileSync(outFilePath, feed.xml({ indent: true }));

    console.log(`Done.
XML file saved in ${outFilePath}.
Images saved in ${outPath}/images.`);
};

program.parse(process.argv);
