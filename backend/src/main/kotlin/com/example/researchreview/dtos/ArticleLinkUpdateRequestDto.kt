package com.example.researchreview.dtos

import jakarta.validation.constraints.NotBlank

class ArticleLinkUpdateRequestDto {
    @field:NotBlank
    var link: String = ""
}
