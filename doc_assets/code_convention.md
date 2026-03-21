🚀 Modern Spring Boot & React Coding Convention
1. Backend (Spring Boot 3.x)
A. Architecture & Services

Interface-First Design: Continue using the Service Interface (in service/) and Service Implementation (in service/impl/) pattern. This promotes loose coupling and easier mocking for tests.

Global Exception Handling:

Do not catch exceptions manually in every Controller.

Do: Throw custom exceptions (e.g., ResourceNotFoundException, BusinessLogicException) in the Service layer.

Handler: Use a @RestControllerAdvice class to catch these exceptions globally and convert them into a standard error response structure.

B. RESTful API Design (Major Change)

Semantic HTTP Status Codes: Stop returning 200 for everything. Use standard HTTP codes to communicate the result type:

200 OK: Successful synchronous request.

201 Created: Resource successfully created (e.g., after POST).

400 Bad Request: Validation failure or malformed request.

401/403: Auth errors.

404 Not Found: Resource does not exist.

500: Internal Server Error.

Verbs:

Use PATCH for partial updates (e.g., updating just a user's email).

Use PUT for full resource replacement.

Response Wrapper: You can still use a BaseResponseDto, but it should wrap the data payload. Errors should return a standard ErrorResponse structure (timestamp, status, error code, message).

C. Persistence (JPA/Hibernate)

Query Priority:

Derived Query Methods: (e.g., findByEmail(String email)) - Use this first for simple queries.

JPQL/HQL: Use @Query("SELECT u FROM User u...") for medium complexity. This keeps your app database-agnostic.

Native Query: Use only as a last resort for specific PostgreSQL features or extreme performance optimization.

Soft Delete: Continue using BaseEntity with a deleted flag. Use Hibernate's @SQLDelete and @SQLRestriction annotations on the Entity class to automatically handle soft deletion logic.

D. DTOs & Validation

Bean Validation: Use Jakarta Validation annotations (@NotNull, @Email, @Size) directly inside your Request DTOs.

Controller Validation: Use @Valid in the controller method arguments to trigger automatic validation before the request even reaches the service.

2. Frontend (React.js + TypeScript)
A. API Client (Axios)

Interceptors: Do not check status codes in every component. Use a global Axios Interceptor to handle responses:

Response Interceptor: Checks for 401 (redirect to login), 403 (forbidden), or 500 (show generic error toast).

If the status is 2xx, return the data payload directly to the component.

Data Fetching: Use a library like TanStack Query (React Query) or SWR. Avoid using useEffect for raw data fetching. This handles caching, loading states, and retries automatically.

B. Directory Structure

Feature-Based Folders: Instead of grouping by file type (components, hooks), group by feature (e.g., features/auth, features/dashboard).

Each feature folder contains its own api, components, and hooks.