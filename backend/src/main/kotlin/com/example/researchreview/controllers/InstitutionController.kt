package com.example.researchreview.controllers

import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.services.InstitutionService
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/institutions")
class InstitutionController(
    private val institutionService: InstitutionService
) {

    @GetMapping
    fun getAllInstitutions(pageable: Pageable): ResponseEntity<BaseResponseDto<PageResponseDto<InstitutionDto>>> {
        return try {
            val institutionsPage = institutionService.getAll(pageable)
            val pageResponse = PageResponseDto.from(institutionsPage)
            
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Institutions retrieved successfully",
                    data = pageResponse
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

    @GetMapping("/{id}")
    fun getInstitutionById(@PathVariable id: String): ResponseEntity<BaseResponseDto<InstitutionDto>> {
        return try {
            val institution = institutionService.getById(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Institution found",
                    data = institution
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = 404,
                    message = e.message ?: "Institution not found",
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

    @PostMapping
    fun createInstitution(@Valid @RequestBody request: InstitutionDto): ResponseEntity<BaseResponseDto<InstitutionDto>> {
        return try {
            val institution = institutionService.create(request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Institution created successfully",
                    data = institution
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

    @PutMapping("/{id}")
    fun updateInstitution(
        @PathVariable id: String,
        @Valid @RequestBody request: InstitutionDto
    ): ResponseEntity<BaseResponseDto<InstitutionDto>> {
        return try {
            val institution = institutionService.update(id, request)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Institution updated successfully",
                    data = institution
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

    @DeleteMapping("/{id}")
    fun deleteInstitution(@PathVariable id: String): ResponseEntity<BaseResponseDto<String>> {
        return try {
            institutionService.delete(id)
            ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Institution deleted successfully",
                    data = "Deleted"
                )
            )
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(404).body(
                BaseResponseDto(
                    code = 404,
                    message = e.message ?: "Institution not found",
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
