# wework-booking-extension

A Chrome extension to allow for bulk booking of WeWork shared desk space. Built with Vite + React, and Manifest v3

## Limitations

- Currently you are only able to select WeWork's located in London, UK.
- The book is for Shared Desk Space only - this is not configurable. I.e. you cannot book meeting rooms or whole office space.
- No feedback regarding credits - warning: you may not be able to book space if you don't have enough credits.
- No feedback regarding availability. You may not be able to book the selected WeWork if it doesn't have desk space.

## Installing

1. Check if your `Node.js` version is >= **14**.
2. Change or configurate the name of your extension on `src/manifest`.
3. Run `npm install` to install the dependencies.

## Developing

run the command

```shell
$ cd wework-booking-extension

$ npm run dev
```

### Chrome Extension Developer Mode

1. Navigate to chrome://extensions/
2. Toggle 'Developer mode'
3. Click 'Load unpacked', and select `wework-booking-extension/build` folder

### Nomal FrontEnd Developer Mode

1. access `http://localhost:3000/`
2. when debugging popup page, open `/popup.html`
3. when debugging options page, open `/options.html`
