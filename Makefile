SHELL=/bin/bash

DOC_DIR = doc
NDPROJ_DIR = ndproj

PLUGIN_FILES = $(shell ls */strophe.*.js | grep -v min)
PLUGIN_FILES_MIN = $(PLUGIN_FILES:.js=.min.js)

all: min

min: $(PLUGIN_FILES_MIN)

%.min.js: %.js
	@@echo "Building" $@ "..."
ifdef YUI_COMPRESSOR
	@@java -jar $(YUI_COMPRESSOR) --type js --nomunge \
		$< > $@
	@@echo $@ "built."
else
	@@echo $@ "not built."
	@@echo "    YUI Compressor required to build minified version."
	@@echo "    Please set YUI_COMPRESSOR to the path to the jar file."
endif
	@@echo

doc:
	@@echo "Building plugin documentation..."
	@@if [ ! -d $(NDPROJ_DIR) ]; then mkdir $(NDPROJ_DIR); fi
	@@if [ ! -d $(DOC_DIR) ]; then mkdir $(DOC_DIR); fi
	@@NaturalDocs -q -i . -o html $(DOC_DIR) -p $(NDPROJ_DIR)
	@@echo "Documentation built."
	@@echo

clean:
	@@echo "Cleaning minified plugins..."
	@@rm -f $(PLUGIN_FILES_MIN)
	@@echo "Minified plugins cleaned."
	@@echo "Cleaning documentation..."
	@@rm -rf $(NDPROJ_DIR) $(DOC_DIR)
	@@echo "Documentation cleaned."
	@@echo

.PHONY: all min doc clean
