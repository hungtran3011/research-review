package com.example.researchreview.mappers

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.entities.Editor
import com.example.researchreview.entities.User
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings
import org.mapstruct.Named

@Mapper(componentModel = "spring", uses = [UserMapper::class])
interface EditorMapper {

    @Mappings(
        value = [
            Mapping(target = "id", source = "id"),
            Mapping(target = "track", source = "track", qualifiedByName = ["trackToDto"]),
            Mapping(target = "user", source = "user")
        ]
    )
    fun toDto(editor: Editor): EditorDto

    @Mappings(
        value = [
            Mapping(target = "user", source = "user.id", qualifiedByName = ["userIdToUser"]),
            Mapping(target = "track", source = "track.id", qualifiedByName = ["trackIdToTrack"])
        ]
    )
    fun toEntity(dto: EditorDto): Editor

    @Named("userIdToUser")
    fun userIdToUser(id: String?): User = if (id.isNullOrBlank()) User() else User().apply { this.id = id }
}
