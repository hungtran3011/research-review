package com.example.researchreview.controllers

import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.AdminTopicConfigCreateRequestDto
import com.example.researchreview.dtos.AdminTopicConfigDto
import com.example.researchreview.dtos.AdminTopicConfigUpdateRequestDto
import com.example.researchreview.dtos.AdminTrackConfigCreateRequestDto
import com.example.researchreview.dtos.AdminTrackConfigDto
import com.example.researchreview.dtos.AdminTrackConfigUpdateRequestDto
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.ConferenceMembershipAssignRequestDto
import com.example.researchreview.dtos.ConferenceMembershipDto
import com.example.researchreview.dtos.ConferenceConfigCreateRequestDto
import com.example.researchreview.dtos.ConferenceConfigDto
import com.example.researchreview.dtos.ConferenceConfigSettingsPatchRequestDto
import com.example.researchreview.dtos.ConferenceConfigUpdateRequestDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRoleUpdateRequestDto
import com.example.researchreview.dtos.UserStatusUpdateRequestDto
import com.example.researchreview.services.AdminConfigurationService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.data.domain.PageRequest
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/configuration")
@PreAuthorize("hasRole('ADMIN')")
class AdminConfigurationController(
    private val adminConfigurationService: AdminConfigurationService,
) {

    @GetMapping("/conferences")
    fun getConferences(): ResponseEntity<BaseResponseDto<List<ConferenceConfigDto>>> {
        try {
            val data = adminConfigurationService.getConferences()
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conferences retrieved", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping("/conferences/{conferenceId}")
    fun getConferenceById(@PathVariable conferenceId: String): ResponseEntity<BaseResponseDto<ConferenceConfigDto>> {
        try {
            val data = adminConfigurationService.getConferenceById(conferenceId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference retrieved", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/conferences")
    fun createConference(
        @Valid @RequestBody request: ConferenceConfigCreateRequestDto,
    ): ResponseEntity<BaseResponseDto<ConferenceConfigDto>> {
        try {
            val created = adminConfigurationService.createConference(request)
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponseDto(code = 201, message = "Conference created", data = created))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PutMapping("/conferences/{conferenceId}")
    fun updateConference(
        @PathVariable conferenceId: String,
        @Valid @RequestBody request: ConferenceConfigUpdateRequestDto,
    ): ResponseEntity<BaseResponseDto<ConferenceConfigDto>> {
        try {
            val updated = adminConfigurationService.updateConference(conferenceId, request)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PatchMapping("/conferences/{conferenceId}/settings")
    fun patchConferenceSettings(
        @PathVariable conferenceId: String,
        @Valid @RequestBody request: ConferenceConfigSettingsPatchRequestDto,
    ): ResponseEntity<BaseResponseDto<ConferenceConfigDto>> {
        try {
            val updated = adminConfigurationService.patchConferenceSettings(conferenceId, request)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference settings updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @DeleteMapping("/conferences/{conferenceId}")
    fun deleteConference(@PathVariable conferenceId: String): ResponseEntity<BaseResponseDto<Unit>> {
        try {
            adminConfigurationService.deleteConference(conferenceId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference deleted", data = Unit))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping("/conferences/{conferenceId}/members")
    fun getConferenceMembers(
        @PathVariable conferenceId: String,
    ): ResponseEntity<BaseResponseDto<List<ConferenceMembershipDto>>> {
        try {
            val data = adminConfigurationService.getConferenceMembers(conferenceId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference members retrieved", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/conferences/{conferenceId}/members")
    fun assignConferenceMember(
        @PathVariable conferenceId: String,
        @Valid @RequestBody request: ConferenceMembershipAssignRequestDto,
    ): ResponseEntity<BaseResponseDto<ConferenceMembershipDto>> {
        try {
            val data = adminConfigurationService.assignConferenceMember(conferenceId, request)
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponseDto(code = 201, message = "Conference membership assigned", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @DeleteMapping("/conferences/{conferenceId}/members/{userId}")
    fun removeConferenceMember(
        @PathVariable conferenceId: String,
        @PathVariable userId: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        try {
        adminConfigurationService.removeConferenceMember(conferenceId, userId)
        return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Conference membership removed", data = Unit))
    } catch (e: Exception) {
        e.printStackTrace()
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            BaseResponseDto(
                code = 500,
                message = e.message ?: "error.internal.server"
            )
        )
    }
    }

    @GetMapping("/conferences/{conferenceId}/tracks")
    fun getTracks(@PathVariable conferenceId: String): ResponseEntity<BaseResponseDto<List<AdminTrackConfigDto>>> {
        try {
            val data = adminConfigurationService.getTracks(conferenceId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Tracks retrieved", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/conferences/{conferenceId}/tracks")
    fun createTrack(
        @PathVariable conferenceId: String,
        @Valid @RequestBody request: AdminTrackConfigCreateRequestDto,
    ): ResponseEntity<BaseResponseDto<AdminTrackConfigDto>> {
        try {
            val created = adminConfigurationService.createTrack(conferenceId, request)
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponseDto(code = 201, message = "Track created", data = created))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PutMapping("/conferences/{conferenceId}/tracks/{trackId}")
    fun updateTrack(
        @PathVariable conferenceId: String,
        @PathVariable trackId: String,
        @Valid @RequestBody request: AdminTrackConfigUpdateRequestDto,
    ): ResponseEntity<BaseResponseDto<AdminTrackConfigDto>> {
        try {
            val updated = adminConfigurationService.updateTrack(conferenceId, trackId, request)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Track updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @DeleteMapping("/conferences/{conferenceId}/tracks/{trackId}")
    fun deleteTrack(
        @PathVariable conferenceId: String,
        @PathVariable trackId: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        try {
            adminConfigurationService.deleteTrack(conferenceId, trackId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Track deleted", data = Unit))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping("/conferences/{conferenceId}/topics")
    fun getTopics(
        @PathVariable conferenceId: String,
        @RequestParam(required = false) trackId: String?,
    ): ResponseEntity<BaseResponseDto<List<AdminTopicConfigDto>>> {
        try {
            val data = adminConfigurationService.getTopics(conferenceId, trackId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Topics retrieved", data = data))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/conferences/{conferenceId}/topics")
    fun createTopic(
        @PathVariable conferenceId: String,
        @Valid @RequestBody request: AdminTopicConfigCreateRequestDto,
    ): ResponseEntity<BaseResponseDto<AdminTopicConfigDto>> {
        try {
            val created = adminConfigurationService.createTopic(conferenceId, request)
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponseDto(code = 201, message = "Topic created", data = created))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PutMapping("/conferences/{conferenceId}/topics/{topicId}")
    fun updateTopic(
        @PathVariable conferenceId: String,
        @PathVariable topicId: String,
        @Valid @RequestBody request: AdminTopicConfigUpdateRequestDto,
    ): ResponseEntity<BaseResponseDto<AdminTopicConfigDto>> {
        try {
            val updated = adminConfigurationService.updateTopic(conferenceId, topicId, request)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Topic updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @DeleteMapping("/conferences/{conferenceId}/topics/{topicId}")
    fun deleteTopic(
        @PathVariable conferenceId: String,
        @PathVariable topicId: String,
    ): ResponseEntity<BaseResponseDto<Unit>> {
        try {
            adminConfigurationService.deleteTopic(conferenceId, topicId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Topic deleted", data = Unit))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping("/users")
    fun getUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        try {
            val safePage = if (page < 0) 0 else page
            val safeSize = when {
                size < 1 -> 10
                size > 100 -> 100
                else -> size
            }
            val pageable = PageRequest.of(safePage, safeSize)
            val users = adminConfigurationService.getUsers(pageable)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Users retrieved", data = PageResponseDto.from(users)))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @GetMapping("/users/search")
    fun searchUsers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) email: String?,
        @RequestParam(required = false) institutionName: String?,
        @RequestParam(required = false) role: String?,
        @RequestParam(required = false) status: String?,
    ): ResponseEntity<BaseResponseDto<PageResponseDto<UserDto>>> {
        try {
            val safePage = if (page < 0) 0 else page
            val safeSize = when {
                size < 1 -> 10
                size > 100 -> 100
                else -> size
            }
            val pageable = PageRequest.of(safePage, safeSize)
            val users = adminConfigurationService.searchUsers(name, email, institutionName, role, status, pageable)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "Users retrieved", data = PageResponseDto.from(users)))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PostMapping("/users")
    fun createUser(
        @Valid @RequestBody request: AdminCreateUserRequestDto,
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        try {
            val created = adminConfigurationService.createUser(request)
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponseDto(code = 201, message = "User created", data = created))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PatchMapping("/users/{userId}/role")
    fun updateUserRole(
        @PathVariable userId: String,
        @Valid @RequestBody request: UserRoleUpdateRequestDto,
        @AuthenticationPrincipal principal: Jwt,
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        try {
            val actorRole = extractRole(principal)
            val updated = adminConfigurationService.updateUserRole(userId, request.role, actorRole)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "User role updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @PatchMapping("/users/{userId}/status")
    fun updateUserStatus(
        @PathVariable userId: String,
        @Valid @RequestBody request: UserStatusUpdateRequestDto,
    ): ResponseEntity<BaseResponseDto<UserDto>> {
        try {
            val updated = adminConfigurationService.updateUserStatus(userId, request.status)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "User status updated", data = updated))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    @DeleteMapping("/users/{userId}")
    fun deleteUser(@PathVariable userId: String): ResponseEntity<BaseResponseDto<Unit>> {
        try {
            adminConfigurationService.deleteUser(userId)
            return ResponseEntity.ok(BaseResponseDto(code = 200, message = "User deleted", data = Unit))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = e.message ?: "error.internal.server"
                )
            )
        }
    }

    private fun extractRole(principal: Jwt): GlobalRole {
        val roles = principal.getClaimAsStringList("roles") ?: emptyList()
        val roleName = roles.firstOrNull()
            ?: throw AccessDeniedException("Role information missing")
        return try {
            GlobalRole.valueOf(roleName)
        } catch (e: IllegalArgumentException) {
            e.printStackTrace()
            throw AccessDeniedException("Invalid role in token: $roleName")
        } catch (e: Exception) {
            e.printStackTrace()
            throw AccessDeniedException("Invalid role in token: $roleName")
        }
    }
}
