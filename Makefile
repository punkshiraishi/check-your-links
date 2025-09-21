.PHONY: zip clean verify
.ONESHELL:

ZIP_NAME := upload-extension.zip
EXT_DIR := extension

zip:
	@echo "Creating $(ZIP_NAME) from $(EXT_DIR) (no external zip needed)"
	@python3 scripts/makezip.py

verify:
	@python3 scripts/verifyzip.py

clean:
	@rm -f $(ZIP_NAME) upload-extension.tar.gz
