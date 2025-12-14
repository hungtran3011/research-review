package com.example.researchreview.mappers

import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.entities.User
import com.example.researchreview.entities.Institution
import com.example.researchreview.entities.Track
import com.example.researchreview.dtos.TrackDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.constants.Role
import com.example.researchreview.constants.Gender
import com.example.researchreview.constants.AcademicStatus
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings
import org.mapstruct.Named

@Mapper(componentModel = "spring")
interface UserMapper {
    @Mappings(
        value = [
            Mapping(target = "id", source = "id", qualifiedByName = ["toStringId"]),
            Mapping(target = "role", source = "role", qualifiedByName = ["roleToString"]),
            Mapping(target = "institution", source = "institution", qualifiedByName = ["institutionToDto"]),
            Mapping(target = "track", source = "track", qualifiedByName = ["trackToDto"]),
            Mapping(target = "nationality", source = "nationality"),
            Mapping(target = "academicStatus", source = "academicStatus"),
            Mapping(target = "gender", source = "gender"),
            Mapping(target = "status", source = "status")
        ]
    )
    fun toDto(user: User): UserDto

    @Mappings(
        value = [
            Mapping(target = "role", source = "role", qualifiedByName = ["stringToRole"]),
            Mapping(target = "institution", source = "institutionId", qualifiedByName = ["institutionIdToInstitution"]),
            Mapping(target = "track", source = "trackId", qualifiedByName = ["trackIdToTrack"]),
            Mapping(target = "gender", source = "gender", qualifiedByName = ["stringToGender"]),
            Mapping(target = "academicStatus", source = "academicStatus", qualifiedByName = ["stringToAcademicStatus"]),
            Mapping(target = "nationality", source = "nationality")
        ]
    )
    fun toEntity(user: UserRequestDto): User

    @Named("roleToString")
    fun roleToString(role: Role): String = role.name

    @Named("stringToRole")
    fun stringToRole(role: String): Role = Role.valueOf(role)

    @Named("institutionIdToString")
    fun institutionIdToString(id: Any?): String = id?.toString() ?: ""

    @Named("institutionIdToInstitution")
    fun institutionIdToInstitution(id: String?): Institution? = if (id.isNullOrBlank()) null else Institution().apply { this.id = id }

    @Named("toStringId")
    fun toStringId(id: Any?): String = id?.toString() ?: ""

    @Named("institutionToDto")
    fun institutionToDto(inst: Institution?): InstitutionDto? = inst?.let {
        InstitutionDto(
            id = it.id,
            name = it.name,
            country = it.country,
            website = it.website,
            logo = it.logo
        )
    }

    @Named("trackToDto")
    fun trackToDto(track: Track?): TrackDto? = track?.let {
        TrackDto(
            id = it.id,
            name = it.name,
            editors = emptyList(),
            description = it.description,
            isActive = it.isActive,
            createdAt = it.createdAt,
            updatedAt = it.updatedAt,
            createdBy = it.createdBy,
            updatedBy = it.updatedBy
        )
    }

    @Named("trackIdToTrack")
    fun trackIdToTrack(id: String?): Track? = if (id.isNullOrBlank()) null else Track().apply { this.id = id }

    @Named("stringToGender")
    fun stringToGender(g: String?): Gender? = if (g.isNullOrBlank()) null else Gender.valueOf(g)

    @Named("stringToAcademicStatus")
    fun stringToAcademicStatus(s: String?): AcademicStatus? = if (s.isNullOrBlank()) null else AcademicStatus.valueOf(s)
}