# pixiv-rss-generator

Pixiv RSS generator.

## Usage

```
node index.js run -s <session_id> <out-file> [options]
```

### Options

#### `-s --session_id <session_id>`

Session ID.

#### `-r --rank_type <rank_type>`

Rank type: daily(Default), weekly, monthly, rookie, original, male, female

#### `-t --content_type <content_type>`

Content type: all(Default), illust, manga, ugoira, novel

#### `-x --with_r18`

With R18 content; Default off.

#### `-d --date <date>`

YYYY-MM-DD; Default to today.

#### `-c --count <count>`

Count to fetch; Default to 50.
