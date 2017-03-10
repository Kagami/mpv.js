"use strict";

const path = require("path");
const {BrowserWindow, app} = require("electron");
const {getPluginEntry} = require("../index");
require("electron-debug")();

const pdir = path.join(__dirname, "..", "build", "Release");
if (process.platform !== "linux") {process.chdir(pdir);}
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("register-pepper-plugins", getPluginEntry(pdir));

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
