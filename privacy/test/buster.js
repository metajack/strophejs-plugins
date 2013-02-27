var config = module.exports;

config["My tests"] = {
  rootPath: "../",
  environment: "browser", // or "node"
  libs: [
    "strophe.min.js", "test/strophe.sentinel.js"
  ],
  extensions: [
    require("when"), require("sinon")
  ],
  sources: [
    "strophe.privacy.js"
  ],
  tests: [
    "test/*-test.js"
  ]
}
