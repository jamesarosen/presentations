SRC_DIR         = src
LINT_FREE_DIR   = tmp/lint_free
JS_FILES        := $(wildcard $(SRC_DIR)/*.js)
LINTED_JS_FILES := $(JS_FILES:$(SRC_DIR)/%=$(LINT_FREE_DIR)/%)
OUT_FILE        = assets/insistent_cat.js

build: $(OUT_FILE)

$(OUT_FILE): $(LINTED_JS_FILES)
	node_modules/browserify/bin/cmd.js $(SRC_DIR)/main.js > $@

$(LINTED_JS_FILES): $(LINT_FREE_DIR)/%.js : $(SRC_DIR)/%.js $(LINT_FREE_DIR)
	node_modules/jshint/bin/jshint $<
	touch $@

$(LINT_FREE_DIR):
	mkdir -p $@

clean:
	-rm -rf $(LINT_FREE_DIR)

.PHONY: build clean
