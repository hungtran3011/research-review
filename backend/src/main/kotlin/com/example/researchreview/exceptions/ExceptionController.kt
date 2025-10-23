package com.example.researchreview.exceptions

import com.example.researchreview.constants.SpecialErrorCode
import com.example.researchreview.constants.ValidationErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.ServletRequestBindingException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

@ControllerAdvice
class ExceptionController: ResponseEntityExceptionHandler() {

    override fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any> {
        val fieldName = ex.bindingResult.fieldErrors.getOrNull(0)?.field
        val code = when (fieldName) {
            "email" -> ValidationErrorCode.EMAIL_INVALID.value
            else -> SpecialErrorCode.GENERAL_ERROR.value
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
}