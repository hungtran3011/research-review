For the backend:

- The Service should follow the interface - implementation structure. Write the interface under the service folder first, then implement inside the service/impl folder

- When there is error in Service layer, return a custom exception if needed. The controller will catch the error and return the BaseResponseDto. Always check the BusinessCode file in the constants package for the suitable business code and add the code if needed. Remember, do not add the similar meaning code inside the file:
Example: USER_CREATED_SUCCESSFULLY and USER_ADDED_SUCCESSFULLY is not accepted.

- The entities should always extends the BaseEntity
- The CRUD actions should remember that we have a soft-delete flag defined in BaseEntity: `deleted`
- The repository should use a short, comprehensible name with a `@Query`. Use native query if needed, the dialect is PostgreSQL in this project.
- Use MapStruct in mappers package for static mapping between DTO and Entities
- Create DTOs in a smallest scope as possible to minimize unwanted data leakage and save bandwidth (maybe)
- Do not suggest any Maven action test/actions unless I told you to do so