# simple makefile to reduce rendering load on node
HTML_PRE = public/index.html
CSS_PRE  = public/css/style.css
JS_PRE   = public/js/index.js
JS_DIR   = js/
BOOTSTRAP = public/bower_components/bootstrap

.PHONY: all

all: $(HTML_PRE) $(CSS_PRE) $(BOOTSTRAP) $(JS_PRE)

public/%.html: jade/%.jade
	jade $< -o $(dir $@)

public/css/%.css: scss/%.scss
	sass $< $@

public/js/%.js: js/%.js
	uglifyjs -c -o $@ $<

public/bower_components/bootstrap:
  bower install bootstrap
