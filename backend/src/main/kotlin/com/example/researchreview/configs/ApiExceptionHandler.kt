package com.example.researchreview.configs

import com.example.researchreview.dtos.BaseResponseDto
import jakarta.persistence.EntityNotFoundException
import jakarta.servlet.http.HttpServletRequest
import org.springframework.context.MessageSource
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.validation.FieldError
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.slf4j.LoggerFactory

@RestControllerAdvice
class ApiExceptionHandler(
    private val messageSource: MessageSource,
) {
    private val log = LoggerFactory.getLogger(ApiExceptionHandler::class.java)

    private fun msg(code: String): String = messageSource.getMessage(code, null, LocaleContextHolder.getLocale()) ?: code
    private fun resolveMessage(message: String?, fallbackCode: String): String {
        if (message.isNullOrBlank()) return msg(fallbackCode)
        return messageSource.getMessage(message, null, message, LocaleContextHolder.getLocale()) ?: message
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        val firstFieldError: FieldError? = e.bindingResult.fieldErrors.firstOrNull()
        val msg = resolveMessage(firstFieldError?.defaultMessage, "error.invalid.request")
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            BaseResponseDto(
                code = 400,
                message = msg,
                data = null
            )
        )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleNotReadable(_e: HttpMessageNotReadableException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            BaseResponseDto(
                code = 400,
                message = msg("error.malformed.json"),
                data = null
            )
        )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(e: IllegalArgumentException, request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        log.error("Illegal argument exception at ${request.requestURI}", e)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            BaseResponseDto(
                code = 400,
                message = resolveMessage(e.message, "error.invalid.request"),
                data = null
            )
        )
    }

    @ExceptionHandler(EntityNotFoundException::class)
    fun handleNotFound(e: EntityNotFoundException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            BaseResponseDto(
                code = 404,
                message = resolveMessage(e.message, "error.not.found"),
                data = null
            )
        )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(e: AccessDeniedException, _request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            BaseResponseDto(
                code = 403,
                message = resolveMessage(e.message, "error.access.denied"),
                data = null
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(e: Exception, request: HttpServletRequest): ResponseEntity<BaseResponseDto<Any>> {
        log.error("Unhandled server exception at ${request.requestURI}", e)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            BaseResponseDto(
                code = 500,
                message = msg("error.internal.server"),
                data = null
            )
        )
    }
}
