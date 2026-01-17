# Code convention

Always refer to this convention to build the program.

## For the backend

- The Service should follow the interface - implementation structure. Write the interface under the service folder first, then implement inside the service/impl folder

- When there is error in Service layer, return a custom exception if needed. The controller will catch the error and return the BaseResponseDto. Always check the BusinessCode file in the constants package for the suitable business code and add the code if needed. Remember, do not add the similar meaning code inside the file:
Example: USER_CREATED_SUCCESSFULLY and USER_ADDED_SUCCESSFULLY is not accepted.

- The entities should always extends the BaseEntity
- The CRUD actions should remember that we have a soft-delete flag defined in BaseEntity: `deleted`
- The repository should use a short, comprehensible name with a `@Query`. Use native query if needed, the dialect is PostgreSQL in this project.
- Use MapStruct in mappers package for static mapping between DTO and Entities
- Create DTOs in a smallest scope as possible to minimize unwanted data leakage and save bandwidth (maybe). This also means: do not reuse the request DTO for response DTO.
- Do not suggest any Maven action test/actions unless I told you to do so.
- Always return 200 with the business code and message
- Do not use the PATCH request
- For all controllers, consider which role(s) can use it, use @PreAuthorize to limit the access

## For the frontend

- When requesting an endpoint, the frontend must always process the returned business code.
  - Update the business code to match the backend.
  - Like the backend, do not add the similar meaning code inside the business code definition

## General rules

- Always respect the current implementation and flow. Whenever wanting to change the flow/implementation, ask for my approval.
- After creating new endpoints/new screen / modifying flows, etc, always write and explain changes in doc_assets/logs. The log name should be structured like this `[change_name]_[date]`
