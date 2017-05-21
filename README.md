<h1 align="center">
  <a href="https://mpv.io/">
    <img src="https://i.imgur.com/qQFg0aI.png" alt="mpv" width="200">
  </a>
  <br>mpv.js<br><br>
</h1>

<h4 align="center">
  All format embeddable player for Electron/NW.js applications.
  <br>Powered by marvelous <a href="https://mpv.io/">mpv</a>.
</h4>

<p align="center">
  <a href="https://travis-ci.org/Kagami/mpv.js">
    <img src="https://img.shields.io/travis/Kagami/mpv.js.svg" alt="Travis">
  </a>
  <a href="https://npmjs.org/package/mpv.js">
    <img src="https://img.shields.io/npm/v/mpv.js.svg" alt="NPM">
  </a>
</p>

## Get libmpv

In order to try mpv.js you need to install mpv library first.

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack, put corresponding `mpv-1.dll` to `C:\Windows\system32`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv1`

## Example

![](https://i.imgur.com/tLFkATs.png)

[Simple Electron application](example) yet capable of handling pretty much any available video thanks to mpv. Run:

```bash
git clone https://github.com/Kagami/mpv.js.git && cd mpv.js
npm install
# Only on Linux: npm run use-system-ffmpeg
npm run example
```

## Usage

### Add npm package

```bash
npm install mpv.js --save
```

Package includes prebuilt binaries for all major platforms so no need to setup compilers.

### Load plugin in main process (Electron example)

```javascript
const path = require("path");
const {app} = require("electron");
const {getPluginEntry} = require("mpv.js");

// Absolute path to the plugin directory.
const pluginDir = path.join(path.dirname(require.resolve("mpv.js")), "build", "Release");
// See pitfalls section for details.
if (process.platform !== "linux") {process.chdir(pluginDir);}
// To support a broader number of systems.
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("register-pepper-plugins", getPluginEntry(pluginDir));
```

Don't forget to enable `plugins` feature when creating `BrowserWindow`:

```javascript
const win = new BrowserWindow({
  // ...
  webPreferences: {plugins: true},
  // ...
});
```

### Use MPV component (React example)

```javascript
const React = require("react");
const {ReactMPV} = require("mpv.js");

class Player extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mpv = null;
    this.state = {pause: true, "time-pos": 0};
  }
  handleMPVReady(mpv) {
    this.mpv = mpv;
    this.mpv.observe("pause");
    this.mpv.observe("time-pos");
    this.mpv.command("loadfile", "/path/to/video.mkv");
  }
  handlePropertyChange(name, value) {
    this.setState({[name]: value});
  }
  togglePause() {
    this.mpv.property("pause", !this.state.pause);
  }
  render() {
    return (
      <ReactMPV
        className="player"
        onReady={this.handleMPVReady.bind(this)}
        onPropertyChange={this.handlePropertyChange.bind(this)}
        onMouseDown={this.togglePause.bind(this)}
      />
    );
  }
}
```

Currently only React component is provided.

### See also

* [mpv properties documentation](https://mpv.io/manual/master/#property-list)
* [mpv commands documentation](https://mpv.io/manual/master/#list-of-input-commands)
* [ReactMPV source](index.js) with JSDoc API comments
* [example player source](example/renderer.js) for a more advanced usage

## Packaging

Basically all you need to ship is `mpvjs.node` and mpv library. Make sure they both and also Electron/NW.js distribution have the same bitness!

### Windows

You may use [lachs0r builds](https://mpv.srsfckn.biz/mpv-dev-latest.7z). Copy `mpv-1.dll` to the directory with `mpvjs.node` and you are done.

### macOS

[Homebrew](https://brew.sh/) can compile `libmpv.1.dylib` and all its dependencies. To find dylibs that need to be packaged and fix install names you may use [collect-dylib-deps](scripts/collect-dylib-deps.sh) script.

### Linux

Two options are normally acceptable:

1. Ask your users to install `libmpv1` with package manager or simply depend on it if you build package.
2. Compile static `libmpv.so` with e.g. [mpv-build](https://github.com/mpv-player/mpv-build).

## Pitfalls

### Path to plugin can't contain non-ASCII symbols

This is unfortunate Chromium's [pepper_plugin_list.cc](https://chromium.googlesource.com/chromium/src/+/59.0.3036.3/content/common/pepper_plugin_list.cc#84) restriction. To workaround this relative path might be used.

On Windows and Mac it can be done by changing working directory to the path where `mpvjs.node` is stored. You can't change CWD of renderer process on Linux inside main process because of zygote architecture so another fix is just `cd` to the plugin directory in wrapper script.

`getPluginEntry` helper will give you plugin entry string with that fix applied.

### libmpv is being linked with Electron's libffmpeg on Linux

On Linux plugins loaded with `register-pepper-plugins` inherit symbols from `electron` binary so it leads to unfortunate effect: libmpv will use Electron's libraries which is not supported.

To workaround it you need to either replace `libffmpeg.so` with empty wrapper linked to `libav*`:

```bash
gcc -shared -lavformat -o /path/to/libffmpeg.so
```

Or use libmpv with statically linked `libav*`.

## Build

To build `mpvjs.node` by yourself you need to setup dev environment.

### Step 1: setup node-gyp

See [installation](https://github.com/nodejs/node-gyp#installation) section.

* Windows: Visual Studio 2013 is required

### Step 2: setup NaCl SDK

See [download](https://developer.chrome.com/native-client/sdk/download) page.

* Windows: unpack `nacl_sdk.zip` to `C:\`
* macOS & Linux: add `export NACL_SDK_ROOT=/path/to/pepper_49` to `~/.bash_profile`

### Step 2.1: compile 64-bit NaCl host binaries on Windows

1. Open `C:\nacl_sdk\pepper_49\tools\host_vc.mk` and replace `32_host` with `64_host`
2. Open cmd, run `"C:\Program Files (x86)\Microsoft Visual Studio 12.0\VC\vcvarsall.bat" amd64`
3. Run `cd C:\nacl_sdk\pepper_49\src` and `make TOOLCHAIN=win`

### Step 3: setup mpv development files

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack to `C:\mpv-dev`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv-dev`

### Step 4: build plugin

* Run `node-gyp rebuild` in project directory
* Run `node-gyp rebuild --arch=ia32` to build 32-bit version of plugin on 64-bit Windows

## Applications using mpv.js

* [boram](https://github.com/Kagami/boram)

Feel free to PR your own.

## License

mpv.js is licensed under [CC0](COPYING) itself, however mpv.js + libmpv build is meant to be distributed as GPLv2+ due to mpv [being GPL](https://github.com/mpv-player/mpv/blob/master/LICENSE) and GPL dynamic linking restrictions.

It shouldn't affect entire Electron/NW.js app though because Chromium runs plugins inside separate process and GPL FAQ [doesn't restrict that](https://www.gnu.org/licenses/gpl-faq.html#NFUseGPLPlugins). (This is not a legal advice.)

Example video is part of Tears of Steel movie (CC) Blender Foundation | mango.blender.org.

Logo is by @SteveJobzniak.
