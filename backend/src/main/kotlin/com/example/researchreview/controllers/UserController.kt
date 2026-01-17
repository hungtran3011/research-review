package com.example.researchreview.controllers

import com.example.researchreview.constants.Role
import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.constants.UserBusinessCode
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.dtos.UserRoleUpdateRequestDto
import com.example.researchreview.dtos.UserStatusUpdateRequestDto
import com.example.researchreview.services.UsersService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.data.domain.PageRequest
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.annotation.AuthenticationPrincipal

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val usersService: UsersService
) {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createUserAsAdmin(
        @Valid @RequestBody request: AdminCreateUserRequestDto
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val user = usersService.createByAdmin(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User created successfully",
                    data = user
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.BAD_REQUEST.value,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    fun getUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        val safePage = if (page < 0) 0 else page
        val safeSize = when {
            size < 1 -> 10
            size > 100 -> 100
            else -> size
        }
        return try {
            val pageable = PageRequest.of(safePage, safeSize)
            val users = usersService.getAll(pageable)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Users retrieved",
                    data = PageResponseDto.from(users)
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Failed to fetch users: ${e.message}",
                    data = null
                )
            )
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    fun searchUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) email: String?,
        @RequestParam(required = false) institutionName: String?,
        @RequestParam(required = false) role: String?,
        @RequestParam(required = false) status: String?
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        val safePage = if (page < 0) 0 else page
        val safeSize = when {
            size < 1 -> 10
            size > 100 -> 100
            else -> size
        }
        return try {
            val pageable = PageRequest.of(safePage, safeSize)
            val users = usersService.search(name, email, institutionName, role, status, pageable)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Users retrieved",
                    data = PageResponseDto.from(users)
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Failed to fetch users: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PostMapping("/complete-info")
    fun completeUserInfo(@Valid @RequestBody request: UserRequestDto): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val user = usersService.create(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User info completed successfully",
                    data = user
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    fun getCurrentUser(@AuthenticationPrincipal principal: Jwt): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val user = usersService.getById(principal.subject)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = UserBusinessCode.USER_FOUND.value,
                    message = "User found",
                    data = user
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = UserBusinessCode.USER_NOT_FOUND.value,
                    message = e.message ?: "User not found",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.name")
    fun updateUser(
        @PathVariable id: String,
        @Valid @RequestBody request: UserRequestDto
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val user = usersService.update(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User updated successfully",
                    data = user
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.BAD_REQUEST.value, //
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUserRole(
        @PathVariable id: String,
        @Valid @RequestBody request: UserRoleUpdateRequestDto,
        @AuthenticationPrincipal principal: Jwt
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val actorRole = extractRole(principal)
            val updated = usersService.updateRole(id, request.role, actorRole)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User role updated successfully",
                    data = updated
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.BAD_REQUEST.value,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (_: AccessDeniedException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 403,
                    message = "Access denied",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUserStatus(
        @PathVariable id: String,
        @Valid @RequestBody request: UserStatusUpdateRequestDto
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val updated = usersService.updateStatus(id, request.status)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User status updated successfully",
                    data = updated
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.BAD_REQUEST.value,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteUser(@PathVariable id: String): ResponseEntity<BaseResponseDto<Unit>> {
        return try {
            usersService.delete(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "User deleted successfully",
                    data = null
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.BAD_REQUEST.value,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.ok(
                BaseResponseDto(
                    code = SpecialErrorCode.INTERNAL_ERROR.value,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    private fun extractRole(principal: Jwt): Role {
        val roles = principal.getClaimAsStringList("roles") ?: emptyList()
        val roleName = roles.firstOrNull()
            ?: throw AccessDeniedException("Role information missing")
        return try {
            Role.valueOf(roleName)
        } catch (_: Exception) {
            throw AccessDeniedException("Invalid role")
        }
    }
}
