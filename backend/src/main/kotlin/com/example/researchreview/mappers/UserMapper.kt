package com.example.researchreview.mappers

import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.entities.User
import com.example.researchreview.entities.Institution
import com.example.researchreview.constants.Role
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings
import org.mapstruct.Named
import java.util.UUID

@Mapper(componentModel = "spring")
interface UserMapper {
    @Mappings(
        value = [
            Mapping(target = "id", source = "id", qualifiedByName = ["toStringId"]),
            Mapping(target = "role", source = "role", qualifiedByName = ["roleToString"]),
            Mapping(target = "institutionId", source = "institution.id", qualifiedByName = ["institutionIdToString"]),
        ]
    )
    fun toDto(user: User): UserDto

    @Mappings(
        value = [
            Mapping(target = "role", source = "role", qualifiedByName = ["stringToRole"]),
            Mapping(target = "institution", source = "institutionId", qualifiedByName = ["institutionIdToInstitution"])
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
}