# pixiv-rss-generator

Pixiv RSS generator.

## Usage

```
node index.js run -s <session_id> <out-file> [options]
```

### Example

```
node index.js run /path/to/dropbox/Public/pixiv-rss/daily-illust.xml \
-s 1111111_ffffffffffffffffffffffffffffffff \
-r daily \
-t illust \
-c 100 \
--title 'Pixiv デイリーイラスト' \
--image_src_prefix https://dl.dropboxusercontent.com/u/11111111/pixiv-rss/
```

### Options

#### `-s --session_id <session_id>`

Requried. Session ID.

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

#### `--title <title>`

Define title of generated RSS feed; Default is "Pixiv RSS".

#### `--image_src_prefix <image_src_prefix>`

Prefix for image src; Default is empty.

