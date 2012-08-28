var config = module.exports;

config["rpc"] = {
  environment: "browser",
  specs: ["spec/*.spec.js"],
  sources: ["strophe.rpc.js"],
  libs: [ 
    "lib/strophe.js",
    "spec/strophe.rpc.spec.helper.js"
    ]
};
