package com.example.researchreview.exceptions

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ErrorResponseDto
import jakarta.persistence.EntityNotFoundException
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@RestControllerAdvice
class ExceptionController: ResponseEntityExceptionHandler() {

    override fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any> {
        val fieldName = ex.bindingResult.fieldErrors.getOrNull(0)?.field
        val code = when (fieldName) {
            "email" -> 400
            else -> 500
        }
        val errorResponse = BaseResponseDto<Any>(code = code, message = "Invalid input: ${ex.bindingResult.fieldErrors.getOrNull(0)?.defaultMessage}")
        return ResponseEntity.badRequest().body(errorResponse)
    }

    override fun handleServletRequestBindingException(
        ex: ServletRequestBindingException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any> {
        val errorResponse = mapOf("message" to "Invalid input: ${ex.message}")
        return ResponseEntity.badRequest().body(errorResponse)
    }

    @ExceptionHandler(ResourceNotFoundException::class, EntityNotFoundException::class)
    fun handleNotFound(ex: RuntimeException): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponseDto(
                status = HttpStatus.NOT_FOUND.value(),
                errorCode = "RESOURCE_NOT_FOUND",
                message = ex.message ?: "Resource not found",
            )
        )
    }

    @ExceptionHandler(BusinessLogicException::class, IllegalArgumentException::class)
    fun handleBadRequest(ex: RuntimeException): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponseDto(
                status = HttpStatus.BAD_REQUEST.value(),
                errorCode = "INVALID_REQUEST",
                message = ex.message ?: "Invalid request",
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponseDto(
                status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                errorCode = "INTERNAL_SERVER_ERROR",
                message = ex.message ?: "Unexpected error",
            )
        )
    }
}