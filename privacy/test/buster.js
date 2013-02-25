var config = module.exports;

config["My tests"] = {
  rootPath: "../",
  environment: "browser", // or "node"
  libs: [
    "strophe.min.js"
  ],
  extensions: [
    require("when")
  ],
  sources: [
    "strophe.privacy.js"
  ],
  tests: [
    "test/*-test.js"
  ]
}
