.DEFAULT_GOAL := help
help:
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

# .PHONY : 2-prepare-image clean doctor

#TODO: use it in env file
OUTPUT_IMAGES_DIR ?= output-images
INPUT_IMAGES_DIR ?= source-images

## Main methods
step1-download-image: ## crop all images in source-images in OUTPUT_IMAGES_DIR
	@$(MAKE) clean-input-images
	@mkdir $(INPUT_IMAGES_DIR)
	@node ./2-prepare-images.js

step2-prepare-image: ## crop all images in source-images in OUTPUT_IMAGES_DIR
	@$(MAKE) clean-output-images
	@mkdir $(OUTPUT_IMAGES_DIR)
	@node ./2-prepare-images.js

## Help methods
clean-output-images: ## delete processed images
	@rm -r $(OUTPUT_IMAGES_DIR) 2> /dev/null || true

clean-input-images: ## delete processed images
	@rm -r $(INPUT_IMAGES_DIR) 2> /dev/null || true

clean: ## delete source and processed images
	@$(MAKE) clean-output-images
	@$(MAKE) clean-input-images
	

# Check if executables exists https://stackoverflow.com/a/25668869
EXECUTABLES = convert magick curl
K := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell command -v $(exec)), $(exec) : ✅ 	, $(error "You need to install '$(exec)'")))
doctor: ## Make sure all cli dependencies are there
	@echo $K 
