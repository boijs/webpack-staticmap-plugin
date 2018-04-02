const _    = require('lodash');
const Fs   = require('fs');
const Path = require('path');

class WebpackStaticmapPlugin {
  constructor(options) {
    this.options = Object.assign({
      dev: false,
      outputfile: 'static.json'
    }, options);
  }
  apply(compiler) {
    compiler.hooks.done.tap('WebpackStaticmapPlugin', stats => {
      const Compilation = stats.compilation;
      const Info = stats.toJson({
        hash: true,
        publicPath: true,
        assets: true,
        chunks: false,
        modules: false,
        source: false,
        errorDetails: false,
        timings: false
      });

      const AppName = /^(\w+)\/.+/.exec(Info.assets[0].name)[1];
      const OutputPath = `${Compilation.outputOptions.path}/${AppName}`;
      const PublicPath = Info.publicPath;
      const Assets = Info.assetsByChunkName;
      const AssetsMap = {};

      for (let key in Assets) {
        AssetsMap[key] = AssetsMap[key] || {};
        if (_.isArray(Assets[key])) {
          Assets[key].forEach(file => {
            AssetsMap[key][Path.extname(file).split('.')[1]] = Path.join(PublicPath, file);
          });
        } else {
          AssetsMap[key][Path.extname(Assets[key]).split('.')[1]] = Path.join(PublicPath, Assets[key]);
        }
      }

      if (this.options.dev) {
        Object.defineProperty(global, AppName, {
          enumerable: true,
          writable: false,
          value: AssetsMap
        });
      } else {
        Fs.writeFileSync(Path.join(OutputPath, 'static.json'), JSON.stringify(AssetsMap));
      }
    });
  }
}

module.exports = WebpackStaticmapPlugin;