# pixiv-rss-generator

Pixiv RSS generator.

## Usage

```
node index.js run -s <session_id> <out-file> [options]
```

### Options

#### `-s --session_id <session_id>`

Session ID.

#### `-rt --rank_type <rank_type>`

Rank type: daily(Default), weekly, monthly, rookie, original, male, female

#### `-ct --content_type <content_type>`

Content type: all(Default), illust, manga, ugoira, novel

#### `-d --date <date>`

YYYY-MM-DD; Default to today.

#### `-c --count <count>`

Count to fetch; Default to 50.
