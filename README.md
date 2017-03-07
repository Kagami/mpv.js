# mpv.js

[![NPM](https://nodei.co/npm/mpv.js.png?downloads=true)](https://www.npmjs.com/package/mpv.js)

Pepper plugin for Electron/NW.js applications providing video playback for a great variety of formats using [mpv](https://mpv.io/) player.

## Usage

## Example

![](https://raw.githubusercontent.com/Kagami/mpv.js/master/example/shot.png)

[Simple Electron application](example) yet capable of handling pretty much any available video thanks to mpv. Run:

```bash
git clone https://github.com/Kagami/mpv.js.git && cd mpv.js
npm i
npm run example
```

## Applications using mpv.js

* [boram](https://github.com/Kagami/boram)

## License

mpv.js is licensed under [CC0](COPYING) itself, however libmpvjs + libmpv package is meant to be distributed as GPLv2+ due to mpv [being GPL](https://github.com/mpv-player/mpv/blob/master/LICENSE) and GPL dynamic linking restrictions.

It shouldn't affect entire Electron/NW.js app though because Chromium runs plugins inside separate process and GPL FAQ [doesn't restrict that](https://www.gnu.org/licenses/gpl-faq.html#NFUseGPLPlugins).

Example video is part of Tears of Steel movie (CC) Blender Foundation | mango.blender.org.
