# Distributed Architectures With Akamai Cloud

This repository contains an example illustrating how one could build a distributed architecture on Akamai Cloud using: 

- Akamai Functions,
- LKE,
- Akamai Valkey Managed Database.

Fictive Orders are submitted over HTTP to an serverless application running on Akamai Functions. That app appends them to a Valkey stream, decoupling ingestion from processing. A pool of worker instances running on LKE consumes the stream via a consumer group, processes each order, and tracks counters in Valkey. Valkey acts as both the message broker and the shared key-value store between the two components.

## Components

- **[order-gateway](src/order-gateway)** — Akamai Function that exposes the HTTP API, 
- **[order-processor](src/order-processor)** — Containerized worker 

## Tech Stack

- **Akamai Functions**
  - [CNCF Spin Framework](https://spinframework.dev) as developer tool
  - TypeScript as programming language
- **Akamai Valkey Managed Database**
  - Message broker + KV store
- **LKE (Linode Kubernetes Engine)**
  - Managed Kubernetes

## Running Locally

Both components require a running managed Valkey instance. Provisioning that instance is considered out of scope; the connection details below must point to an already-deployed Valkey.

### order-gateway

Create your local `variables.json` from the tracked template and fill in your Valkey connection details:

```bash
cp variables.tmpl.json variables.json
```

`variables.json` is git-ignored so your credentials are never committed. Then start the function:

```bash
cd src/order-gateway
spin up --variable variables.json
```

### order-processor

Build and run the processor container, pointing `VALKEY_URL` at the same Valkey instance:

```bash
cd src/order-processor
docker build -t order-processor:latest .
docker run --rm \
  -e VALKEY_URL="rediss://<username>:<password>@<host>:<port>" \
  order-processor:latest
```

## Akamai Cloud Deployment

Deployment assumes an LKE cluster is already provisioned and your local `kubeconfig` is configured to target it.

### order-gateway

Deploy to Akamai Functions with Spin (assuming you've installed the `aka` plugin for Spin CLI and that you're already authneticated against Akamai Functions (`spin aka login`...)):

```bash
cd src/order-gateway
spin aka deploy --variable @variables.json
```

### order-processor

Worker is **not** fully automated — the `make deploy` target (shown below) only applies `k8s/deployment.yaml` and updates the image. The non-sensitive settings and the Valkey connection string are supplied separately and must be applied before (or alongside) the Deployment. Which is defined in the next paragraph.

#### Configs and secrets
Configuration is **not** fully automated — the `make deploy` target only applies `k8s/deployment.yaml` and updates the image. The Valkey connection string must be supplied separately; the ConfigMap is optional:

- **ConfigMap** (`k8s/configmap.yaml`) — *optional* overrides for non-sensitive settings (`STREAM_NAME`, `CONSUMER_GROUP`, `LOG_LEVEL`). The processor ships with reasonable defaults (`orders`, `order-processors`, `info`), and the Deployment references these keys with `optional: true`, so the ConfigMap can be omitted entirely.
- **Secret** (`k8s/secret.yaml`) — **required**. Holds the Valkey connection string as `VALKEY_URL`.

The Deployment wires both into the container via `envFrom`-style references: `STREAM_NAME`, `CONSUMER_GROUP`, and `LOG_LEVEL` come from the ConfigMap when present (falling back to the built-in defaults otherwise), while `VALKEY_URL` is injected from the Secret's `VALKEY_URL` key (`POD_NAME` is derived from the pod's own metadata). That is how the connection string reaches each processor instance in the cluster — it lives in the Secret, and Kubernetes exposes it to the container as an environment variable at runtime.

The Secret is intentionally checked in with an empty value; populate it with your base64-encoded connection string before applying:

```bash
cd src/order-processor
# Base64-encode your connection string and drop it into k8s/secret.yaml (VALKEY_URL),
# or create the Secret directly:
kubectl create secret generic order-processor-secret \
  --namespace default \
  --from-literal=VALKEY_URL="rediss://<username>:<password>@<host>:<port>"

# Optional — only if you want to override the built-in defaults (STREAM_NAME, CONSUMER_GROUP, LOG_LEVEL):
kubectl create configmap order-processor-config \
  --namespace default \
  --from-literal=STREAM_NAME="orders" \
  --from-literal=CONSUMER_GROUP="order-processors" \
  --from-literal=LOG_LEVEL="info" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/secret.yaml      # if managing the Secret via the manifest
kubectl apply -f k8s/configmap.yaml   # optional
```

#### Worker Deployment

Build, push, and deploy the processor image via the provided `Makefile`:

```bash
cd src/order-processor
make build IMAGE=<registry>/order-processor:<tag>
make deploy IMAGE=<registry>/order-processor:<tag>
```

## End-to-End Testing

The [`e2e`](e2e) folder contains [Hurl](https://hurl.dev) files to exercise the deployed system. Pass your function URL via the `base_url` variable:

```bash
hurl --variable base_url=https://your-function.example.com e2e/create-orders.hurl  # submit 10 orders
hurl --variable base_url=https://your-function.example.com e2e/show-metrics.hurl   # show current metrics
hurl --variable base_url=https://your-function.example.com e2e/reset-metrics.hurl  # reset metrics to zero
```
