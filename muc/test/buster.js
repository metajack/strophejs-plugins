var config = module.exports;

config["MUC tests"] = {
  env: "browser",
  rootPath: "../",
  libs: [
    "strophe.min.js"
  ],
  sources: [
    "strophe.muc.js"
  ],
  tests: [
    "test/*-test.js"
  ]
};
