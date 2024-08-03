WORD ?= default

run:
	docker compose run cli-app $(WORD) && make clean

up:
	docker compose up --build --remove-orphans

clean:
	docker compose down --remove-orphans
