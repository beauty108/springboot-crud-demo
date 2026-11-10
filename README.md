# Spring Boot CRUD Application

A REST API for managing products, built with Spring Boot, Spring Data JPA and an in-memory H2 database.

## Tech Stack

- Java 21
- Spring Boot (Spring Web, Spring Data JPA)
- H2 Database (in-memory)
- Maven

## Requirements

- Java JDK
- Git
- Postman

## Run

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <REPO_FOLDER_NAME>
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The app runs at http://localhost:8080. Or open the project in IntelliJ and run `DemoApplication`.

## Endpoints

Base URL: `http://localhost:8080/api/products`

| Operation | Method | URL |
|---|---|---|
| Create | POST | `/api/products` |
| Get all | GET | `/api/products` |
| Get by ID | GET | `/api/products/{id}` |
| Update | PUT | `/api/products/{id}` |
| Delete | DELETE | `/api/products/{id}` |

Sample JSON body for POST and PUT:

```json
{ "name": "Sample Product", "description": "This is a sample product", "price": 19.99 }
```

## Notes

- Data is stored in memory and resets when the app stops.
- H2 console (if enabled): http://localhost:8080/h2-console, JDBC URL `jdbc:h2:mem:productdb`.

---

