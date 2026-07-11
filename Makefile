.PHONY: up down logs rebuild migrate test clean

up:
	docker-compose --profile development up -d

down:
	docker-compose --profile development down

logs:
	docker-compose --profile development logs -f

rebuild:
	docker-compose --profile development up -d --build

migrate:
	docker-compose --profile development exec api alembic upgrade head

test:
	docker-compose --profile development exec api pytest

clean:
	docker-compose --profile development down -v
	rm -rf backend/__pycache__
	rm -rf frontend/.next
