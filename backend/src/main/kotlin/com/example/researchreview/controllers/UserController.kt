package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.services.UsersService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val usersService: UsersService
) {

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
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @GetMapping("/me")
    fun getCurrentUser(@RequestParam email: String): ResponseEntity<BaseResponseDto<UserDto>> {
        return try {
            val user = usersService.getByEmail(email)
            if (user != null) {
                ResponseEntity.ok(
                    BaseResponseDto(
                        code = 200,
                        message = "User found",
                        data = user
                    )
                )
            } else {
                ResponseEntity.status(404).body(
                    BaseResponseDto(
                        code = 404,
                        message = "User not found with email: $email",
                        data = null
                    )
                )
            }
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }

    @PutMapping("/{id}")
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
            ResponseEntity.badRequest().body(
                BaseResponseDto(
                    code = 400,
                    message = e.message ?: "Invalid request",
                    data = null
                )
            )
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body(
                BaseResponseDto(
                    code = 500,
                    message = "Internal server error: ${e.message}",
                    data = null
                )
            )
        }
    }
}
