# Submit 10 orders to the gateway.
# Pass your function URL at run time:
#   hurl --variable base_url=https://your-function.example.com e2e/create-orders.hurl

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-1", "customerId": "customer-1", "total": 19.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-2", "customerId": "customer-2", "total": 29.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-3", "customerId": "customer-3", "total": 39.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-4", "customerId": "customer-4", "total": 49.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-5", "customerId": "customer-5", "total": 59.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-6", "customerId": "customer-6", "total": 69.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-7", "customerId": "customer-7", "total": 79.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-8", "customerId": "customer-8", "total": 89.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-9", "customerId": "customer-9", "total": 99.99 }
HTTP 202

POST {{base_url}}/api/orders
Content-Type: application/json
{ "id": "order-10", "customerId": "customer-10", "total": 109.99 }
HTTP 202
