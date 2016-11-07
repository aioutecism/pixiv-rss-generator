const fs = require('fs');
const request = require('request');

const getParamString = (params) => {
    let result = '';

    for (let k in params) {
        const key = encodeURIComponent(k);
        const value = encodeURIComponent(params[k]);
        result += `&${key}=${value}`;
    }

    return result.substr(1);
};

const mkdirp = (path) => {
    const dirs = path.split('/');

    for (let i = 0; i < dirs.length; i++) {
        const currentDir = dirs[i];
        const path = dirs.slice(0, i + 1).join('/');

        if (path === '') continue;

        let stat;
        try {
            stat = fs.statSync(path);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                fs.mkdirSync(path);
            }
            else {
                console.error(error);
            }
        }

        if (stat && stat.isFile()) {
            console.warn(`${path} is a file. Abort further directory creating.`);
            break;
        }
    }
};

const downloadImage = (src, headers, outFilePath, callback) => {
    const pathMatch = outFilePath.match(/^(.+)\//);
    if (pathMatch) {
        mkdirp(pathMatch[1]);
    }

    let isExist = true;

    try {
        fs.accessSync(outFilePath, fs.constants.F_OK);
    }
    catch (error) {
        isExist = false;
    }

    if (isExist) {
        console.log(`${outFilePath} already exists. Skipping.`);

        if (callback) {
            callback();
        }

        return;
    }

    const stream = request({
        url: src,
        headers
    }).pipe(fs.createWriteStream(outFilePath));

    if (callback) {
        stream.on('close', callback);
    }
};

module.exports = {
    getParamString,
    mkdirp,
    downloadImage,
};
