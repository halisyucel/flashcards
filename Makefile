WORD ?= default

run:
	source ~/myenv/bin/activate && python3 main.py "$(WORD)" && deactivate
