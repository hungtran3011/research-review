package com.example.researchreview.controllers

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.services.UsersService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.data.domain.PageRequest
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val usersService: UsersService
) {

    @GetMapping
    fun getUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) conferenceId: String?
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        val safePage = if (page < 0) 0 else page
        val safeSize = when {
            size < 1 -> 10
            size > 100 -> 100
            else -> size
        }
        return try {
            val pageable = PageRequest.of(safePage, safeSize)
            val users = usersService.getAll(pageable, conferenceId)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Users retrieved",
                    data = PageResponseDto.from(users)
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ErrorCode.INTERNAL_SERVER.key,
                    data = null
                )
            )
        }
    }

    @GetMapping("/search")
    fun searchUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) email: String?,
        @RequestParam(required = false) institutionName: String?,
        @RequestParam(required = false) role: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) conferenceId: String?
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        val safePage = if (page < 0) 0 else page
        val safeSize = when {
            size < 1 -> 10
            size > 100 -> 100
            else -> size
        }
        return try {
            val pageable = PageRequest.of(safePage, safeSize)
            val users = usersService.search(name, email, institutionName, role, status, pageable, conferenceId)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Users retrieved",
                    data = PageResponseDto.from(users)
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ErrorCode.INTERNAL_SERVER.key,
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
            e.printStackTrace()
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "error.invalid.request",
                    data = null
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ErrorCode.INTERNAL_SERVER.key,
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
                    code = 200,
                    message = "User found",
                    data = user
                )
            )
        } catch (e: IllegalArgumentException) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = e.message ?: "user.notFound",
                    data = null
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ErrorCode.INTERNAL_SERVER.key,
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
            e.printStackTrace()
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400, //
                    message = e.message ?: "error.invalid.request",
                    data = null
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ErrorCode.INTERNAL_SERVER.key,
                    data = null
                )
            )
        }
    }
}
