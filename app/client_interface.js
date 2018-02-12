# These are the client requests that can be made:
curl -d '{"id":"2", "mmr":"0"}' -H "Content-Type: application/json" -X POST http://localhost:8099/start
curl -d '{"id":"2", "mmr":"0"}' -H "Content-Type: application/json" -X POST http://localhost:8099/status
curl -d '{"id":"2", "mmr":"0"}' -H "Content-Type: application/json" -X POST http://localhost:8099/update

