# Spring Boot + React CRUD Application

A product manager app: a Spring Boot REST API (with an in-memory H2 database) and a React frontend to list, add, edit and delete products.

## Requirements

- Java 21
- Node.js 20.19+ (22 LTS recommended)
- Git

## 1. Get the code

```bash
git clone https://github.com/beauty108/springboot-crud-demo.git
cd springboot-crud-demo
```

## 2. Run the backend (port 8080)

```bash
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

Wait for `Started DemoApplication`. Or open the project in IntelliJ and run `DemoApplication`.

- API docs (Swagger): http://localhost:8080/swagger-ui.html
- H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:productdb`, user `sa`, empty password)

## 3. Run the frontend (port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## 4. Add dummy products

The database is in-memory, so it is empty after every backend restart. With the backend running:

macOS / Linux / Git Bash:

```bash
for i in $(seq 1 25); do
  curl -s -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Product $i\",\"description\":\"Sample item number $i\",\"price\":$((i * 7 % 50 + 5)).99}" > /dev/null
done
```

Windows PowerShell:

```powershell
1..25 | ForEach-Object {
  $body = @{ name = "Product $_"; description = "Sample item number $_"; price = ($_ * 7 % 50 + 5) + 0.99 } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/products -ContentType "application/json" -Body $body | Out-Null
}
```

Refresh the browser to see them.

## 5. Run the tests

```bash
./mvnw test                     # backend tests (from the project root)
cd frontend && npm run test:run # frontend tests
```

## API

| Method | URL | Notes |
|---|---|---|
| GET | `/api/products?page=0&size=10&sortBy=id&direction=asc` | `sortBy`: id, name, price. Totals in `X-Total-Count` / `X-Total-Pages` headers |
| GET | `/api/products/{id}` | 404 if missing |
| POST | `/api/products` | 201 Created; 400 if name is blank or price is negative |
| PUT | `/api/products/{id}` | 404 if missing |
| DELETE | `/api/products/{id}` | 204 No Content |

Example body: `{ "name": "Laptop", "description": "Fast", "price": 999.99 }`

## Troubleshooting

- **Port 8080 or 5173 in use:** stop the other app, or set `server.port` in `application.properties`.
- **Frontend says "Cannot reach the server":** the backend is not running on port 8080.
- **Empty list:** the backend was restarted; run the dummy-data script again.
- **`mvnw: Permission denied`:** run `chmod +x mvnw`.

---
