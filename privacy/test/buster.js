var config = module.exports;

config["My tests"] = {
  rootPath: "../../",
  environment: "browser", // or "node"
  libs: [
    "test-helpers/strophe.min.js", "test-helpers/strophe.sentinel.js"
  ],
  extensions: [
    require("when"), require("sinon")
  ],
  sources: [
    "privacy/strophe.privacy.js"
  ],
  tests: [
    "privacy/test/*-test.js"
  ]
}
