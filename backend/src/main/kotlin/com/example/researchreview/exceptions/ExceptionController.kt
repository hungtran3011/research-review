package com.example.researchreview.exceptions

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ErrorResponseDto
import jakarta.persistence.EntityNotFoundException
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
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
class ExceptionController(
    private val messageSource: MessageSource,
) : ResponseEntityExceptionHandler() {

    private fun msg(code: String): String = messageSource.getMessage(code, null, LocaleContextHolder.getLocale()) ?: code
    private fun resolveMessage(message: String?, fallbackCode: String): String {
        if (message.isNullOrBlank()) return msg(fallbackCode)
        return messageSource.getMessage(message, null, message, LocaleContextHolder.getLocale()) ?: message
    }

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
        val detail = ex.bindingResult.fieldErrors.getOrNull(0)?.defaultMessage
        val errorResponse = BaseResponseDto<Any>(code = code, message = resolveMessage(detail, "error.invalid.request"))
        return ResponseEntity.badRequest().body(errorResponse)
    }

    override fun handleServletRequestBindingException(
        ex: ServletRequestBindingException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any> {
        val errorResponse = mapOf("message" to resolveMessage(ex.message, "error.invalid.request"))
        return ResponseEntity.badRequest().body(errorResponse)
    }

    @ExceptionHandler(ResourceNotFoundException::class, EntityNotFoundException::class)
    fun handleNotFound(ex: RuntimeException): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponseDto(
                status = HttpStatus.NOT_FOUND.value(),
                errorCode = "RESOURCE_NOT_FOUND",
                message = resolveMessage(ex.message, "error.not.found"),
            )
        )
    }

    @ExceptionHandler(BusinessLogicException::class, IllegalArgumentException::class)
    fun handleBadRequest(ex: RuntimeException): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponseDto(
                status = HttpStatus.BAD_REQUEST.value(),
                errorCode = "INVALID_REQUEST",
                message = resolveMessage(ex.message, "error.invalid.request"),
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ErrorResponseDto> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponseDto(
                status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                errorCode = "INTERNAL_SERVER_ERROR",
                message = msg(ErrorCode.INTERNAL_SERVER.key),
            )
        )
    }
}