"use strict";

const {BrowserWindow, app} = require("electron");
require("electron-debug")();

app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("register-pepper-plugins",
                             "build/Release/mpvjs.node;application/x-mpvjs");

app.on("ready", () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 574,
    useContentSize: process.platform !== "linux",
    title: "mpv.js example player",
    webPreferences: {plugins: true},
  });
  win.setMenu(null);
  win.loadURL(`file://${__dirname}/index.html`);
});

app.on("window-all-closed", () => {
  app.quit();
});
