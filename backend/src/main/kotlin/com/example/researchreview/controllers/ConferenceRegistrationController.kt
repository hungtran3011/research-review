package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ConferenceMembershipDto
import com.example.researchreview.exceptions.BusinessLogicException
import com.example.researchreview.services.ConferenceRegistrationService
import jakarta.persistence.EntityNotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/conferences")
class ConferenceRegistrationController(
    private val conferenceRegistrationService: ConferenceRegistrationService,
) {

    @PostMapping("/{conferenceId}/registrations")
    @PreAuthorize("isAuthenticated()")
    fun register(
        @PathVariable conferenceId: String,
    ): ResponseEntity<BaseResponseDto<ConferenceMembershipDto>> {
        return try {
            val result = conferenceRegistrationService.register(conferenceId)
            val status = if (result.created) HttpStatus.CREATED else HttpStatus.OK
            ResponseEntity.status(status).body(
                BaseResponseDto(
                    code = status.value(),
                    message = if (result.created) "Conference registration created" else "Conference registration already exists",
                    data = result.membership,
                )
            )
        } catch (ex: EntityNotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                BaseResponseDto(
                    code = 404,
                    message = ex.message ?: "conference.notFound",
                )
            )
        } catch (ex: AccessDeniedException) {
            ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                BaseResponseDto(
                    code = 403,
                    message = ex.message ?: "conference.registration.forbidden",
                )
            )
        } catch (ex: BusinessLogicException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                BaseResponseDto(
                    code = 400,
                    message = ex.message ?: "error.badRequest",
                )
            )
        }
    }
}
