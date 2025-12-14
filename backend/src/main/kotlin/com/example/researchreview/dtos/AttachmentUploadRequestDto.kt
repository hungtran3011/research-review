package com.example.researchreview.dtos

import com.example.researchreview.constants.AttachmentKind
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

class AttachmentUploadRequestDto {
    @field:NotBlank
    var fileName: String = ""

    @field:Min(1)
    var fileSize: Long = 0

    @field:NotBlank
    var mimeType: String = "application/octet-stream"

    @field:NotNull
    var version: Int = 1

    @field:NotNull
    var kind: AttachmentKind = AttachmentKind.SUBMISSION
}
