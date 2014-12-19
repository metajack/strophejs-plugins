module.exports = function(cfg){

cfg.set({

  basePath: '',

  files: [
    'node_modules/punycode/punycode.js',
    'node_modules/strophe/strophe.js',
    '../rpc/strophe.rpc.js',
    'jid.js',
    'strophe.joap.js',
    'node_modules/chai/chai.js',
    'node_modules/sinon-chai/lib/sinon-chai.js',
    'node_modules/sinon/pkg/sinon.js',
    'node_modules/jquery/dist/jquery.js',
    'spec/*.spec.coffee'
  ],

  frameworks: ["mocha"],

  reporters: ['progress'],

  port: 9876,

  runnerPort: 9100,

  colors: true,

  logLevel: cfg.LOG_INFO,

  autoWatch: false,

  browsers: ['PhantomJS'],

  captureTimeout: 6000,

  singleRun: true,

  preprocessors: {
    'spec/*.coffee': ['coffee']
  }

});};
