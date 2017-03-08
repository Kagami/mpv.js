"use strict";

const path = require("path");
const {BrowserWindow, app} = require("electron");
require("electron-debug")();

const pluginPath = path.join(__dirname, "..", "build", "Release", "mpvjs.node");
const plugins = `${pluginPath};application/x-mpvjs`;
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("register-pepper-plugins", plugins);

app.on("ready", () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 574,
    autoHideMenuBar: true,
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
