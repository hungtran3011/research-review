package com.example.researchreview.controllers

import com.example.researchreview.constants.ErrorCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.SubmissionMetadataDto
import com.example.researchreview.services.SubmissionMetadataService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/submissions")
class SubmissionMetadataController(
    private val submissionMetadataService: SubmissionMetadataService,
) {

    @GetMapping("/metadata")
    @PreAuthorize("isAuthenticated()")
    fun getSubmissionMetadata(): ResponseEntity<BaseResponseDto<SubmissionMetadataDto>> {
        try {
            val data = submissionMetadataService.getSubmissionMetadata()
            return ResponseEntity.ok(
                BaseResponseDto(
                    code = 200,
                    message = "Submission metadata retrieved",
                    data = data,
                )
            )
        } catch (ex: Exception) {
            ex.printStackTrace()
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BaseResponseDto(
                    code = 500,
                    message = ex.message ?: ErrorCode.INTERNAL_SERVER.key,
                    data = null
                )
            )
        }
    }
}
