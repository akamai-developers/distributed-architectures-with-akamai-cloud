# Reset all processor metrics back to zero.
# Pass your function URL at run time:
#   hurl --variable base_url=https://your-function.example.com e2e/reset-metrics.hurl

DELETE {{base_url}}/api/metrics
HTTP 204
