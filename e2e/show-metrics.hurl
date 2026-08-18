# Show the current processor metrics.
# Pass your function URL at run time:
#   hurl --variable base_url=https://your-function.example.com e2e/show-metrics.hurl

GET {{base_url}}/api/metrics
HTTP 200
