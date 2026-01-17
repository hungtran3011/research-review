package com.example.researchreview.configs

import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import jakarta.persistence.EntityNotFoundException
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        val firstFieldError: FieldError? = e.bindingResult.fieldErrors.firstOrNull()
        val msg = firstFieldError?.defaultMessage ?: "Invalid request"
        return ResponseEntity.ok(
            BaseResponseDto(
                code = SpecialErrorCode.BAD_REQUEST.value,
                message = msg,
                data = null
            )
        )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleNotReadable(_e: HttpMessageNotReadableException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.ok(
            BaseResponseDto(
                code = SpecialErrorCode.BAD_REQUEST.value,
                message = "Malformed JSON request",
                data = null
            )
        )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(e: IllegalArgumentException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.ok(
            BaseResponseDto(
                code = SpecialErrorCode.BAD_REQUEST.value,
                message = e.message ?: "Invalid request",
                data = null
            )
        )
    }

    @ExceptionHandler(EntityNotFoundException::class)
    fun handleNotFound(e: EntityNotFoundException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 404,
                message = e.message ?: "Not found",
                data = null
            )
        )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(e: AccessDeniedException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.ok(
            BaseResponseDto(
                code = 403,
                message = e.message ?: "Access denied",
                data = null
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(e: Exception, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.ok(
            BaseResponseDto(
                code = SpecialErrorCode.INTERNAL_ERROR.value,
                message = "Internal server error: ${e.message}",
                data = null
            )
        )
    }
}
