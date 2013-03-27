SRC_DIR         = src
LINT_FREE_DIR   = tmp/lint_free
JS_FILES        := $(wildcard $(SRC_DIR)/*.js)
LINTED_JS_FILES := $(patsubst $(SRC_DIR)/%,$(LINT_FREE_DIR)/%,$(JS_FILES))

build: $(LINTED_JS_FILES)
	node_modules/browserify/bin/cmd.js $(LINT_FREE_DIR)/main.js > assets/insistent_cat.js

$(LINTED_JS_FILES): $(LINT_FREE_DIR)/%.js : $(SRC_DIR)/%.js $(LINT_FREE_DIR)
	node_modules/jshint/bin/jshint $<
	cp $< $@

$(LINT_FREE_DIR):
	mkdir -p $@

clean:
	-rm -rf $(LINT_FREE_DIR)

.PHONY: build $(LINT_FREE_DIR) clean
