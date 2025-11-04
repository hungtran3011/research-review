package com.example.researchreview.mappers

import com.example.researchreview.dtos.ReviewerDto
import com.example.researchreview.dtos.ReviewerRequestDto
import com.example.researchreview.entities.Reviewer
import com.example.researchreview.entities.User
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings
import org.mapstruct.Named

@Mapper(componentModel = "spring", uses = [UserMapper::class])
interface ReviewerMapper {

    @Mappings(
        value = [
            Mapping(target = "id", source = "id"),
            Mapping(target = "institution", source = "institution", qualifiedByName = ["institutionToDto"]),
            Mapping(target = "user", source = "user")
        ]
    )
    fun toDto(reviewer: Reviewer): ReviewerDto

    @Mappings(
        value = [
            Mapping(target = "user", source = "userId", qualifiedByName = ["userIdToUser"]),
            Mapping(target = "institution", source = "institutionId", qualifiedByName = ["institutionIdToInstitution"])
        ]
    )
    fun toEntity(dto: ReviewerRequestDto): Reviewer

    @Named("userIdToUser")
    fun userIdToUser(id: String?): User = if (id.isNullOrBlank()) User() else User().apply { this.id = id }
}

