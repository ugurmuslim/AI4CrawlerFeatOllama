# Ollama agent with Crawler4AI

A crawler gets the data from the web and sends it to a qdrant database. Agent is getting the knowledge from scraped data and answers questions.


* ### For Nvidia GPU setups:

```bash
docker compose --profile gpu-nvidia pull
docker compose create && docker compose --profile gpu-nvidia up
```

### For Mac / Apple Silicon users

```
docker compose pull
docker compose create && docker compose up
```

* ### For Non-GPU setups:

```bash
docker compose --profile cpu pull
docker compose create && docker compose --profile cpu up
```

After running the above commands, you can access the agent at `http://localhost:3002/` and the qdrant database at `http://localhost:6333/`.


```bash
curl --request POST \
  --url http://localhost:3002/init-rag \
  --header 'Authorization: Bearer secret' \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/10.3.0' \
  --data '{
	"url": "https://shopify.dev/docs"
}'
```


After scraping the data you can give prompts to your ai like below

```bash
curl --request POST \
  --url http://localhost:3002/talk-to-ai \
  --header 'Authorization: Bearer secret' \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/10.3.0' \
  --data '{
	"text": "Give me the list of all the endpoints in shopify"
}'
```